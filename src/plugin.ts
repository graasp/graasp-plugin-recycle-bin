import {FastifyPluginAsync} from "fastify";
import {BaseItem} from "./base-item";
import {
  IdParam,
  Item,
  ItemCopyHookHandlerExtraData,
  ItemMembership,
  Member,
  PreHookHandlerType
} from "graasp";
import {
  CopyRecycleBin,
  CopyToRecycleBin, CreateRecycleBin,
  DeleteRecycleBin,
  MoveRecycleBin, ShareRecycleBinOrContent
} from "./graasp-recycle-bin-errors";
import {RECYCLE_BIN_TYPE} from "./constants";

const plugin: FastifyPluginAsync = async (fastify) => {

  const {
    items: { taskManager: itemTaskManager },
    members: { taskManager: memberTaskManager },
    itemMemberships: { taskManager: itemMembershipTaskManager },
    taskRunner: runner } = fastify;


  /**
   * Check if an item is being copied to the recycle bin
   * @param copy Item copy (before being saved)
   * @param member Member triggering the copy task - used to get recycleBin
   */
  const preventCopyToRecycleBin: PreHookHandlerType<Item> =
    async (copy: Item, member: Member ) => {
      const { path: copyPath } = copy;

      const { extra } = member;
      const recycleBin = extra['recycleBin']

      if(!recycleBin) return

      const recycleBinId = recycleBin['id'];
      const getRecycleBinTask = itemTaskManager.createGetTask(member,recycleBinId);
      const recycleBinItem = await runner.runSingle(getRecycleBinTask);
      const { path: recycleBinPath } = recycleBinItem;
      if(copyPath.includes(recycleBinPath)) throw new CopyToRecycleBin(copy.id)

    };
  runner.setTaskPreHookHandler(itemTaskManager.getCopyTaskName(), preventCopyToRecycleBin);

  /**
   * Check if the recycle bin is being copied
   * @param copy Item copy (before being saved)
   */
  const preventCreationOfRecycleBin: PreHookHandlerType<Item> =
    async (copy: Item) => {
      const { type } = copy;

      if(type=== RECYCLE_BIN_TYPE) throw new CreateRecycleBin()
    };
  runner.setTaskPreHookHandler(itemTaskManager.getCreateTaskName(), preventCreationOfRecycleBin);

  /**
   * Check if the recycle bin is being copied
   * @param copy Item copy (before being saved)
   */
  const preventCopyOfRecycleBin: PreHookHandlerType<Item> =
    async (copy: Item) => {
      const { type } = copy;

      if(type=== RECYCLE_BIN_TYPE) throw new CopyRecycleBin()
    };
  runner.setTaskPreHookHandler(itemTaskManager.getCopyTaskName(), preventCopyOfRecycleBin);

  /**
   * Check if the recycle bin is being moved
   * @param move Item move (before being moved)
   */
  const preventMoveOfRecycleBin: PreHookHandlerType<Item> =
    async (move: Item) => {
      const { type } = move;

      if(type=== RECYCLE_BIN_TYPE) throw new MoveRecycleBin()
    };
  runner.setTaskPreHookHandler(itemTaskManager.getMoveTaskName(), preventMoveOfRecycleBin);

  /**
   * Check if the recycle bin is being deleted
   * @param deleted Item delete (before being deleted)
   */
  const preventDeleteRecycleBin: PreHookHandlerType<Item> =
    async (deleted: Item) => {
      const { type } = deleted;

      if(type=== RECYCLE_BIN_TYPE) throw new DeleteRecycleBin()
    };
  runner.setTaskPreHookHandler(itemTaskManager.getDeleteTaskName(), preventDeleteRecycleBin);

  /**
   * Check if the recycle bin or it's content are being shared
   * @param iM ItemMembership shared or updated (before being done)
   */
  const preventSharingOperationsRecycleBin: PreHookHandlerType<ItemMembership> =
    async (iM: ItemMembership, member: Member) => {
      const { itemPath } = iM;

      const { extra } = member;
      const recycleBin = extra['recycleBin']

      if(!recycleBin) return

      const recycleBinId = recycleBin['id'];
      const getRecycleBinTask = itemTaskManager.createGetTask(member,recycleBinId);
      const recycleBinItem = await runner.runSingle(getRecycleBinTask);
      const { path: recycleBinPath } = recycleBinItem;
      if(itemPath.includes(recycleBinPath)) throw new ShareRecycleBinOrContent()
    };
  runner.setTaskPreHookHandler(itemMembershipTaskManager.getCreateTaskName(), preventSharingOperationsRecycleBin);
  runner.setTaskPreHookHandler(itemMembershipTaskManager.getUpdateTaskName(), preventSharingOperationsRecycleBin);


  fastify.post<{ Params: IdParam}> (
    '/:id/recycle',
    async ({member,params: {id: itemId},log})=> {

      const itemTask = itemTaskManager.createGetTask(member,itemId);
      const item = await runner.runSingle(itemTask,log);

      const {extra, name,id: memberId} = member;
      let recycleBin;
      if(extra['recycleBin']){
        const recycleBinId = extra['recycleBin']['id'];
        const getRecycleBinTask = itemTaskManager.createGetTask(member,recycleBinId);
        recycleBin = await runner.runSingle(getRecycleBinTask,log);
      }
      else{
        const recycleBinItem = new BaseItem(
          `${name}'s Recycle Bin`,
          "Recycle Bin",
          RECYCLE_BIN_TYPE,
          {},
          memberId);
        const createRecycleBinTask = itemTaskManager.createCreateTask(member,recycleBinItem);
        recycleBin = await runner.runSingle(createRecycleBinTask,log);
        const extra = {
          recycleBin: {
            id: recycleBin.id
          }
        }
        const updateMemberTask = memberTaskManager.createUpdateTask(member, memberId,{extra});
        await runner.runSingle(updateMemberTask,log);
      }

      const removeItemMembershipsTask = itemMembershipTaskManager.createDeleteAllOnAndBelowItemTask(member,itemId);
      await runner.runSingle(removeItemMembershipsTask,log);
      const recycleTask = itemTaskManager.createMoveTask(member,item.id,recycleBin.id);
      await runner.runSingle(recycleTask,log);
      return recycleBin;
    }
  )
}

export default plugin;
