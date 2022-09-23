import { FastifyLoggerInstance, FastifyPluginAsync } from 'fastify';

import {
  Actor,
  GraaspError,
  IdParam,
  IdsParams,
  Item,
  MAX_TARGETS_FOR_MODIFY_REQUEST,
  MAX_TARGETS_FOR_READ_REQUEST,
  Member,
  PostHookHandlerType,
} from '@graasp/sdk';

import { RecycledItemService } from './db-service';
import {
  CannotCopyRecycledItem,
  CannotGetRecycledItem,
  CannotMoveRecycledItem,
} from './graasp-recycle-bin-errors';
import common, {
  deleteMany,
  deleteOne,
  getRecycledItems,
  recycleMany,
  recycleOne,
  restoreMany,
  restoreOne,
} from './schemas';
import { TaskManager as RecycledItemTaskManager } from './task-manager';

export interface RecycleBinOptions {
  /** Max number of items to recycle in a request.
   * A number above this value will trigger an immediate bad request (400). Defaults to `10`. */
  maxItemsInRequest: number;
  /** Max number of items to recycle in a request w/ response. A number of items less or equal
   * to this value will make the server completely finish the execution before returning a response.
   * Above this value, the server will immediatly return a 202 (accepted) and the execution
   * will continue "in the back". **This value should be smaller than `maxItemsInRequest`**
   * otherwise it has no effect. Defaults to `5`. */
  maxItemsWithResponse: number;
  recycleItemPostHook?: PostHookHandlerType<string>;
}

const plugin: FastifyPluginAsync<RecycleBinOptions> = async (fastify, options) => {
  const {
    items: { taskManager: itemTaskManager, dbService: itemService },
    itemMemberships: { taskManager: itemMembershipTaskManager },
    taskRunner: runner,
    db,
  } = fastify;
  const {
    maxItemsInRequest = MAX_TARGETS_FOR_READ_REQUEST,
    maxItemsWithResponse = MAX_TARGETS_FOR_MODIFY_REQUEST,
    recycleItemPostHook: postHook,
  } = options;

  const recycledItemService = new RecycledItemService();
  const recycledItemTaskManager = new RecycledItemTaskManager(recycledItemService);
  fastify.addSchema(common);

  const removeRecycledItems = async (items) => {
    if (!items || !items.length) {
      return;
    }
    // get recycled ids from given item paths and filter them out
    const recycledItems = await recycledItemService.areDeleted(
      items.map(({ path }) => path),
      db.pool,
    );
    const filteredItems = items.map((item) => {
      return recycledItems.find(({ path }) => item.path.includes(path)) ? null : item;
    });

    // split for in-place changes in the array
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
    async (_copy, actor, { log }, { original: { id, path } }) => {
      if (await isRecycledItem(path, actor, log)) throw new CannotCopyRecycledItem(id);
    },
  );

  // Prevent getting recycled item
  runner.setTaskPostHookHandler<Item>(
    itemTaskManager.getGetTaskName(),
    async ({ id, path }, actor, { log }) => {
      if (await isRecycledItem(path, actor, log)) throw new CannotGetRecycledItem(id);
    },
  );

  // Hide recycled items when getting own items
  runner.setTaskPostHookHandler<Item[]>(itemTaskManager.getGetOwnTaskName(), async (items) => {
    await removeRecycledItems(items);
  });

  // Hide recycled items when getting shared items
  runner.setTaskPostHookHandler<Item[]>(
    itemTaskManager.getGetSharedWithTaskName(),
    async (items) => {
      await removeRecycledItems(items);
    },
  );

  // Hide recycled items when getting children
  runner.setTaskPostHookHandler<Item[]>(itemTaskManager.getGetChildrenTaskName(), async (items) => {
    await removeRecycledItems(items);
  });

  // Hide recycled items when getting descendants
  runner.setTaskPostHookHandler<Item[]>(
    itemTaskManager.getGetDescendantsTaskName(),
    async (items) => {
      await removeRecycledItems(items);
    },
  );

  runner.setTaskPostHookHandler<string>(recycledItemTaskManager.getCreateTaskName(), postHook);

  // Replace recycled items with errors
  runner.setTaskPostHookHandler<(Item | GraaspError)[]>(
    itemTaskManager.getGetManyTaskName(),
    async (items) => {
      // get recycled ids from given item paths and filter them out
      const recycledItems = await recycledItemService.areDeleted(
        items.map((item) => (item as Item)?.path).filter(Boolean),
        db.pool,
      );
      const filteredItems = items.map((item) => {
        const itemPath = (item as Item).path;
        return recycledItems.find(({ path }) => itemPath.includes(path))
          ? new CannotGetRecycledItem(itemPath)
          : item;
      });
      // split for in-place changes in the array
      items.splice(0, items.length, ...filteredItems.filter(Boolean));
    },
  );

  // Note: it's okay to not prevent memberships changes on recycled items
  // it is not really possible to change them in the interface
  // but it won't break anything

  // API endpoints

  // get recycled items
  fastify.get<{ Params: IdParam }>(
    '/recycled',
    { schema: getRecycledItems },
    async ({ member, log }) => {
      const task = recycledItemTaskManager.createGetOwnTask(member);
      return runner.runSingle(task, log);
    },
  );

  // recycle item
  fastify.post<{ Params: IdParam }>(
    '/:id/recycle',
    { schema: recycleOne },
    async ({ member, params: { id: itemId }, log }) => {
      log.info(`Recycling item '${itemId}'`);
      return recycleItem(itemId, member, log);
    },
  );

  // recycle multiple items
  fastify.post<{ Querystring: IdsParams }>(
    '/recycle',
    { schema: recycleMany(maxItemsInRequest) },
    async ({ member, query: { id: ids }, log }, reply) => {
      log.info(`Recycling items ${ids}`);
      // too many items to recycle and wait for execution to finish: start execution and return 202.
      if (ids.length > maxItemsWithResponse) {
        for (const id of ids) {
          recycleItem(id, member, log);
        }
        reply.status(202);
        return ids;
      }

      const results = [];
      for (const id of ids) {
        const result = await recycleItem(id, member, log);
        results.push(result);
      }
      return results;
    },
  );

  // restore one item
  fastify.post<{ Params: IdParam }>(
    '/:id/restore',
    { schema: restoreOne },
    async ({ member, params: { id }, log }) => {
      log.info(`Restore item '${id}'`);
      return restoreItem(id, member, log);
    },
  );

  // restore multiple items
  fastify.post<{ Querystring: IdsParams }>(
    '/restore',
    { schema: restoreMany(maxItemsInRequest) },
    async ({ member, query: { id: ids }, log }, reply) => {
      log.info(`Restoring items ${ids}`);
      // too many items to recycle and wait for execution to finish: start execution and return 202.
      if (ids.length > maxItemsWithResponse) {
        for (const id of ids) {
          restoreItem(id, member, log);
        }
        reply.status(202);
        return ids;
      }

      const results = [];
      for (const id of ids) {
        const result = await restoreItem(id, member, log);
        results.push(result);
      }
      return results;
    },
  );

  // delete a recycled item
  fastify.delete<{ Params: IdParam }>(
    '/:id/delete',
    { schema: deleteOne },
    async ({ member, params: { id }, log }) => {
      const tasks = recycledItemTaskManager.createDeleteTaskSequence(
        member,
        itemTaskManager,
        itemMembershipTaskManager,
        itemService,
        id,
      );

      return runner.runSingleSequence(tasks, log);
    },
  );

  // delete recycled items
  fastify.delete<{ Querystring: IdsParams }>(
    '/delete',
    { schema: deleteMany(maxItemsInRequest) },
    async ({ member, query: { id: ids }, log }, reply) => {
      log.info(`Deleting recycled items ${ids}`);

      const tasks = ids.map((id) =>
        recycledItemTaskManager.createDeleteTaskSequence(
          member,
          itemTaskManager,
          itemMembershipTaskManager,
          itemService,
          id,
        ),
      );

      if (ids.length > maxItemsWithResponse) {
        for (let i = 0; i < ids.length; i++) {
          runner.runMultipleSequences(tasks, log);
        }
        reply.status(202);
        return ids;
      }

      return runner.runMultipleSequences(tasks, log);
    },
  );

  async function recycleItem(
    itemId: string,
    member: Member,
    log: FastifyLoggerInstance,
  ): Promise<unknown> {
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
    t4.getResult = () => t1[0].result;

    return runner.runSingleSequence([...t1, t2, t3, t4], log);
  }

  async function restoreItem(
    itemId: string,
    member: Member,
    log: FastifyLoggerInstance,
  ): Promise<unknown> {
    // remove entry from recycle_item
    const t1 = recycledItemTaskManager.createDeleteTask(member, itemId);
    return runner.runSingle(t1, log);
  }

  // warning: avoid this function if this is used on many items AND in hooks
  async function isRecycledItem(path: string, member: Actor, log: FastifyLoggerInstance) {
    const t1 = recycledItemTaskManager.createIsDeletedTask(member as Member, { item: { path } });
    return runner.runSingle(t1, log);
  }
};

export default plugin;
