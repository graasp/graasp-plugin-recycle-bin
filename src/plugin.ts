import {FastifyPluginAsync} from "fastify";
import {BaseItem} from "./base-item";
import {IdParam, Item, ItemCopyHookHandlerExtraData, Member, PreHookHandlerType} from "graasp";
import {CopyRecycleBin, CopyToRecycleBin} from "./graasp-recycle-bin-errors";
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
  const preventCopyOfRecycleBin: PreHookHandlerType<Item> =
    async (copy: Item) => {
      const { type } = copy;

      if(type=== RECYCLE_BIN_TYPE) throw new CopyRecycleBin()
    };
  runner.setTaskPreHookHandler(itemTaskManager.getCopyTaskName(), preventCopyOfRecycleBin);

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

      const recycleTask = itemTaskManager.createMoveTask(member,item.id,recycleBin.id);
      await runner.runSingle(recycleTask,log);
      const removeItemMembershipsTask = itemMembershipTaskManager.createDeleteAllOnAndBelowItemTask(member,itemId);
      await runner.runSingle(removeItemMembershipsTask,log);
      return recycleBin;
    }
  )
}

export default plugin;
