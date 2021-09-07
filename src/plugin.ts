import { FastifyLoggerInstance, FastifyPluginAsync } from 'fastify';
import {
  IdParam,
  IdsParams,
  Item,
  ItemMembership,
  Member,
  UnknownExtra
} from 'graasp';
import {
  CannotCopyIntoRecycleBin,
  CannotCopyRecycleBin,
  CannotCreateItemMembershipInRecycleBin,
  CannotDeleteRecycleBin,
  CannotModifyOwnRecycleBinItemMembership,
  CannotMoveRecycleBin
} from './graasp-recycle-bin-errors';
import common, { recycleOne, recycleMany, getRecycledItems } from './schemas';

interface RecycleExtra extends UnknownExtra {
  recycleBin?: { itemId: string }
}

interface RecycleBinOptions {
  /** Max number of items to recycle in a request.
   * A number above this value will trigger an immediate bad request (400). Defaults to `10`. */
  maxItemsInRequest: number
  /** Max number of items to recycle in a request w/ response. A number of items less or equal
   * to this value will make the server completely finish the execution before returning a response.
   * Above this value, the server will immediatly return a 202 (accepted) and the execution
   * will continue "in the back". **This value should be smaller than `maxItemsInRequest`**
   * otherwise it has no effect. Defaults to `5`. */
  maxItemsWithResponse: number
}

const RECYCLE_BIN_TYPE = 'recycleBin';

const plugin: FastifyPluginAsync<RecycleBinOptions> = async (fastify, options) => {
  const {
    items: { taskManager: itemTaskManager },
    members: { taskManager: memberTaskManager },
    itemMemberships: { taskManager: itemMembershipTaskManager },
    taskRunner: runner
  } = fastify;
  const { maxItemsInRequest = 10, maxItemsWithResponse = 5 } = options;

  fastify.addSchema(common);

  // Hook handlers

  // Prevent moving of `recycleBin` item
  runner.setTaskPreHookHandler<Item>(itemTaskManager.getMoveTaskName(), async ({ id, type }) => {
    if (type === RECYCLE_BIN_TYPE) throw new CannotMoveRecycleBin(id);
  });

  // Prevent deletion of `recycleBin` item
  runner.setTaskPreHookHandler<Item>(itemTaskManager.getDeleteTaskName(), async ({ id, type }) => {
    if (type === RECYCLE_BIN_TYPE) throw new CannotDeleteRecycleBin(id);
  });

  // Hide `recycleBin` when getting items if it exists
  runner.setTaskPostHookHandler<Item[]>(itemTaskManager.getGetOwnTaskName(), async(items) => {
    const bin = items.find(({ type }) => type === RECYCLE_BIN_TYPE);
    if (bin) {
      items.splice(items.indexOf(bin), 1);
    }
  });

  // Prevent copying of `recycleBin` item
  // Prevent copying into `recycleBin` item
  runner.setTaskPreHookHandler<Item>(itemTaskManager.getCopyTaskName(),
    async ({ id, type, path }, member: Member<RecycleExtra>) => {
      if (type === RECYCLE_BIN_TYPE) throw new CannotCopyRecycleBin(id);

      const { extra: { recycleBin: { itemId: recycleBinItemId } = {} } } = member;

      if (!recycleBinItemId) return;

      const recycleBinPath = recycleBinItemId.replace(/-/g, '_');
      if (path.split('.').some(pathPart => pathPart === recycleBinPath)) throw new CannotCopyIntoRecycleBin(id);
    });

  // Prevent creating memberships inside `recycleBin`
  runner.setTaskPreHookHandler<ItemMembership>(itemMembershipTaskManager.getCreateTaskName(),
    async ({ itemPath }, member: Member<RecycleExtra>) => {

      const { extra: { recycleBin: { itemId: recycleBinItemId } = {} } } = member;

      if (!recycleBinItemId) return;

      const recycleBinPath = recycleBinItemId.replace(/-/g, '_');
      if (itemPath.split('.').some(pathPart => pathPart === recycleBinPath)) {
        throw new CannotCreateItemMembershipInRecycleBin(recycleBinItemId);
      }
    });

  // Prevent changing own membership in `recycleBin`
  runner.setTaskPreHookHandler<ItemMembership>(itemMembershipTaskManager.getUpdateTaskName(),
    async ({ itemPath }, member: Member<RecycleExtra>) => {

      const { extra: { recycleBin: { itemId: recycleBinItemId } = {} } } = member;

      if (!recycleBinItemId) return;

      const recycleBinPath = recycleBinItemId.replace(/-/g, '_');
      if (itemPath === recycleBinPath) throw new CannotModifyOwnRecycleBinItemMembership();
    });

  // API endpoints

  // get recycled items
  fastify.get<{ Params: IdParam }>(
    '/recycled', { schema: getRecycledItems },
    async ({ member, log }) => {
      // return children of recycle item
      const recycleBinItemId = await getMemberRecyclebinId(member, log);
      const task = itemTaskManager.createGetChildrenTask(member, recycleBinItemId);

      return runner.runSingle(task, log);
    }
  );

  // recycle item
  fastify.post<{ Params: IdParam }>(
    '/:id/recycle', { schema: recycleOne },
    async ({ member, params: { id: itemId }, log }, reply) => {
      const recycleBinItemId = await getMemberRecyclebinId(member, log);

      log.info(`Recycling item '${itemId}'`);
      await recycleItem(itemId, member, recycleBinItemId, log);

      reply.status(204);
    }
  );

  // recycle multiple items
  fastify.post<{ Querystring: IdsParams }>(
    '/recycle', { schema: recycleMany(maxItemsInRequest) },
    async ({ member, query: { id: ids }, log }, reply) => {
      const recycleBinItemId = await getMemberRecyclebinId(member, log);

      // too many items to recycle and wait for execution to finish: start execution and return 202.
      if (ids.length > maxItemsWithResponse) {
        log.info(`Recycling items ${ids}`);

        for (let i = 0; i < ids.length; i++) {
          recycleItem(ids[i], member, recycleBinItemId, log);
        }
        reply.status(202);
        return ids;
      }

      log.info(`Recycling items ${ids}`);
      for (let i = 0; i < ids.length; i++) {
        await recycleItem(ids[i], member, recycleBinItemId, log);
      }
      reply.status(204);
    }
  );

  async function getMemberRecyclebinId(member: Member<RecycleExtra>,
    log: FastifyLoggerInstance): Promise<string> {
    const { extra: { recycleBin: { itemId: recycleBinItemId } = {} } } = member;

    if (recycleBinItemId) return recycleBinItemId;

    // create the recycle bin item for this member
    const recycleBinItem = { name: 'RECYCLEBIN', type: RECYCLE_BIN_TYPE };
    const createItem = itemTaskManager.createCreateTask(member, recycleBinItem);
    const { id: itemId } = await runner.runSingle(createItem, log);

    // update member
    const data = { extra: { recycleBin: { itemId } } };
    const updateMember = memberTaskManager.createUpdateTask<RecycleExtra>(member, member.id, data);
    await runner.runSingle(updateMember, log);
  }

  async function recycleItem(itemId: string, member: Member<RecycleExtra>,
    recycleBinItemId: string, log: FastifyLoggerInstance): Promise<void> {

    // TODO: this is not "perfect": the tasks are executing in a different transaction.

    // remove all memberships from item (and its subtree)
    const cleanItemMemeberships =
      itemMembershipTaskManager.createDeleteAllOnAndBelowItemTask(member, itemId);
    await runner.runSingle(cleanItemMemeberships, log);

    // move item to the recycle bin
    const moveItem = itemTaskManager.createMoveTask(member, itemId, recycleBinItemId);
    await runner.runSingle(moveItem, log);
  }
};

export default plugin;
