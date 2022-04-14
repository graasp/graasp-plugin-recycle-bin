import {
  Actor,
  Item,
  ItemMembershipTaskManager,
  ItemService,
  ItemTaskManager,
  Member,
  Task,
} from 'graasp';
import { RecycledItemService } from './db-service';
import { RecycledItemTaskManager } from './interfaces/task-manager';
import { CreateRecycledItemTask } from './tasks/create-recycled-item-task';
import { DeleteRecycledItemTask } from './tasks/delete-recycled-item-task';
import { GetItemTask, GetItemTaskInputType } from './tasks/get-item-task';
import { GetOwnRecycledItemsTask } from './tasks/get-own-recycled-items-task';
import { IsItemDeletedTask } from './tasks/is-item-deleted-task';
import { PostHookFunctionType } from './types';

export class TaskManager implements RecycledItemTaskManager<Member> {
  private recycledItemService = new RecycledItemService();

  getOwnTaskName(): string {
    return GetOwnRecycledItemsTask.name;
  }

  createGetOwnTask(member: Member): GetOwnRecycledItemsTask {
    return new GetOwnRecycledItemsTask(member, this.recycledItemService);
  }

  getCreateTaskName(): string {
    return CreateRecycledItemTask.name;
  }

  createCreateTask(member: Member, postHook: PostHookFunctionType, input?: Partial<Item>): CreateRecycledItemTask {
    return new CreateRecycledItemTask(member, this.recycledItemService, postHook, input);
  }
  getDeleteTaskName(): string {
    return DeleteRecycledItemTask.name;
  }

  createDeleteTask(member: Member, itemId?: string): DeleteRecycledItemTask {
    return new DeleteRecycledItemTask(member, this.recycledItemService, itemId);
  }
  getIsDeletedTaskName(): string {
    return DeleteRecycledItemTask.name;
  }
  createIsDeletedTask(
    member: Member,
    input?: { item?: Partial<Item>; validate?: boolean },
  ): IsItemDeletedTask {
    return new IsItemDeletedTask(member, this.recycledItemService, input);
  }
  createGetItemTask(
    member: Member,
    itemService: ItemService,
    input?: GetItemTaskInputType,
  ): GetItemTask {
    return new GetItemTask(member, this.recycledItemService, itemService, input);
  }
  createDeleteTaskSequence(
    member: Member,
    iTM: ItemTaskManager,
    iMTM: ItemMembershipTaskManager,
    itemService: ItemService,
    id: string,
  ): Task<Actor, unknown>[] {
    const t1 = this.createGetItemTask(member, itemService, { itemId: id });

    // enforce the item to be recycled
    const t2 = this.createIsDeletedTask(member as Member, {});
    t2.getInput = () => ({ item: t1.result, validate: true });

    const t3 = iMTM.createGetMemberItemMembershipTask(member, {});
    t3.getInput = () => ({ validatePermission: 'admin', item: t1.result });

    const t4 = iTM.createDeleteTask(member);
    t4.getInput = () => ({ item: t1.result });

    return [t1, t2, t3, t4];
  }
}
