import {FastifyPluginAsync} from "fastify";
import {BaseItem} from "./base-item";
import {IdParam, PreHookHandlerType} from "graasp";

const plugin: FastifyPluginAsync = async (fastify) => {

  const {
    items: { taskManager: itemTaskManager },
    members: { taskManager: memberTaskManager },
    itemMemberships: { taskManager: itemMembershipTaskManager },
    taskRunner: runner } = fastify;

  fastify.patch<{ Params: IdParam}> (
    '/:id/recycle',
    async ({member,params: {id: itemId},log})=> {
      const item = itemTaskManager.createGetTask(member,itemId);

      if(!item) throw new Error("Item Not Found");

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
          "recycleBin",
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
