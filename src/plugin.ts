import { FastifyLoggerInstance, FastifyPluginAsync } from 'fastify';
import { Actor, IdParam, IdsParams, Item, ItemMembership, Member } from 'graasp';
import {
  CannotCopyRecycledItem,
  CannotCreateItemMembershipInRecycledItem,
  CannotMoveRecycledItem,
  CannotUpdateItemMembershipInRecycledItem,
} from './graasp-recycle-bin-errors';
import common, { recycleOne, recycleMany, getRecycledItems, restoreOne } from './schemas';
import { TaskManager as RecycledItemTaskManager } from './task-manager';

interface RecycleBinOptions {
  /** Max number of items to recycle in a request.
   * A number above this value will trigger an immediate bad request (400). Defaults to `10`. */
  maxItemsInRequest: number;
  /** Max number of items to recycle in a request w/ response. A number of items less or equal
   * to this value will make the server completely finish the execution before returning a response.
   * Above this value, the server will immediatly return a 202 (accepted) and the execution
   * will continue "in the back". **This value should be smaller than `maxItemsInRequest`**
   * otherwise it has no effect. Defaults to `5`. */
  maxItemsWithResponse: number;
}

const plugin: FastifyPluginAsync<RecycleBinOptions> = async (fastify, options) => {
  const {
    items: { taskManager: itemTaskManager },
    itemMemberships: { taskManager: itemMembershipTaskManager },
    taskRunner: runner,
  } = fastify;
  const { maxItemsInRequest = 10, maxItemsWithResponse = 5 } = options;

  const recycledItemTaskManager = new RecycledItemTaskManager();

  fastify.addSchema(common);


  const removeRecycledItems = async (items, actor, log) => {
    const filteredItems = await Promise.all(
      items.map(async (item) => {
        const isDeleted = await isRecycledItem(item.path, actor, log);
        return !isDeleted ? item : null;
      }),
    );
    items.splice(0, items.length, ...filteredItems.filter(Boolean));
  };

  // Prevent moving of recycled item
  runner.setTaskPreHookHandler<Item>(
    itemTaskManager.getMoveTaskName(),
    async ({ id, path }, actor, { log }) => {
      if (await isRecycledItem(path, actor, log)) throw new CannotMoveRecycledItem(id);
    },
  );

  // Prevent copying into recycled item
  // check the path: it will throw either the parent or the target is invalid
  runner.setTaskPreHookHandler<Item>(
    itemTaskManager.getCopyTaskName(),
    async ({ id, path }, actor, { log }) => {
      if (await isRecycledItem(path, actor, log)) throw new CannotCopyRecycledItem(id);
    },
  );

  // Prevent creating memberships inside a recycled item
  runner.setTaskPreHookHandler<ItemMembership>(
    itemMembershipTaskManager.getCreateTaskName(),
    async ({ itemPath }, actor, { log }) => {
      if (await isRecycledItem(itemPath, actor, log)) {
        throw new CannotCreateItemMembershipInRecycledItem(itemPath);
      }
    },
  );

  // Prevent changing own membership in a recycled item
  runner.setTaskPreHookHandler<ItemMembership>(
    itemMembershipTaskManager.getUpdateTaskName(),
    async ({ itemPath }, actor, { log }) => {
      if (await isRecycledItem(itemPath, actor, log))
        throw new CannotUpdateItemMembershipInRecycledItem(itemPath);
    },
  );

  // Hide recycled items when getting items if it exists
  runner.setTaskPostHookHandler<Item[]>(
    itemTaskManager.getGetOwnTaskName(),
    async (items, actor, { log }) => {
      await removeRecycledItems(items, actor, log);
    },
  );

  // Hide recycled items when getting children
  runner.setTaskPostHookHandler<Item[]>(
    itemTaskManager.getGetChildrenTaskName(),
    async (items, actor, { log }) => {
      await removeRecycledItems(items, actor, log);
    },
  );

  // Do not hide item when getting one -> otherwise we cannot delete

  // API endpoints

  // get recycled items
  fastify.get('/recycled', { schema: getRecycledItems }, async ({ member, log }) => {
    // return children of recycle item
    const task = recycledItemTaskManager.createGetOwnTask(member);
    return runner.runSingle(task, log);
  });

  // recycle item
  fastify.post<{ Params: IdParam }>(
    '/:id/recycle',
    { schema: recycleOne },
    async ({ member, params: { id: itemId }, log }, reply) => {
      log.info(`Recycling item '${itemId}'`);
      await recycleItem(itemId, member, log);

      reply.status(204);
    },
  );

  // recycle multiple items
  fastify.post<{ Querystring: IdsParams }>(
    '/recycle',
    { schema: recycleMany(maxItemsInRequest) },
    async ({ member, query: { id: ids }, log }, reply) => {
      // too many items to recycle and wait for execution to finish: start execution and return 202.
      if (ids.length > maxItemsWithResponse) {
        log.info(`Recycling items ${ids}`);

        for (let i = 0; i < ids.length; i++) {
          recycleItem(ids[i], member, log);
        }
        reply.status(202);
        return ids;
      }

      log.info(`Recycling items ${ids}`);
      for (let i = 0; i < ids.length; i++) {
        await recycleItem(ids[i], member, log);
      }
      reply.status(204);
    },
  );

  // restore one item
  fastify.post<{ Params: IdParam }>(
    '/:id/restore',
    { schema: restoreOne },
    async ({ member, params: { id }, log }, reply) => {
      log.info(`Restore item '${id}'`);
      await restoreItem(id, member, log);

      reply.status(204);
    },
  );



  async function recycleItem(
    itemId: string,
    member: Member,
    log: FastifyLoggerInstance,
  ): Promise<void> {
    // get item
    // todo: pass validatePermission to define et minimum condition for reading an item
    // this will avoid checking the permission twice
    const t1 = itemTaskManager.createGetTaskSequence(member, itemId);

    const t2 = itemMembershipTaskManager.createGetMemberItemMembershipTask(member);
    t2.getInput = () => ({ validatePermission: 'admin', item: t1[0].result });

    // check item is not already deleted
    const t3 = recycledItemTaskManager.createIsDeletedTask(member as Member, { validate: false });
    t3.getInput = () => ({ item: t1[0].result });

    // create entry in table
    const t4 = recycledItemTaskManager.createCreateTask(member, {});
    t4.getInput = () => t1[0].result;

    await runner.runSingleSequence([...t1, t2, t3, t4], log);
  }

  async function restoreItem(
    itemId: string,
    member: Member,
    log: FastifyLoggerInstance,
  ): Promise<void> {
    // remove entry from recycle_item
    const t1 = recycledItemTaskManager.createDeleteTask(member, itemId);
    await runner.runSingle(t1, log);
  }

  async function isRecycledItem(path: string, member: Actor, log: FastifyLoggerInstance) {
    const t1 = recycledItemTaskManager.createIsDeletedTask(member as Member, { item: { path } });
    return runner.runSingle(t1, log);
  }
};

export default plugin;
