import { Item, ItemService, Member } from 'graasp';
import { RecycledItemService } from './db-service';
import { RecycledItemTaskManager } from './interfaces/task-manager';
import { CreateRecycledItemTask } from './tasks/create-recycled-item-task';
import { DeleteRecycledItemTask } from './tasks/delete-recycled-item-task';
import { GetItemTask, GetItemTaskInputType } from './tasks/get-item-task';
import { GetOwnRecycledItemsTask } from './tasks/get-own-recycled-items-task';
import { IsItemDeletedTask } from './tasks/is-item-deleted-task';

export class TaskManager implements RecycledItemTaskManager<Member> {
  private recycledItemService = new RecycledItemService();

  getOwnTaskName(): string {
    return GetOwnRecycledItemsTask.name;
  }

  createGetOwnTask(member: Member): GetOwnRecycledItemsTask {
    return new GetOwnRecycledItemsTask(member, this.recycledItemService,);
  }

  getCreateTaskName(): string {
    return CreateRecycledItemTask.name;
  }

  createCreateTask(member: Member, input?: Partial<Item>): CreateRecycledItemTask {
    return new CreateRecycledItemTask(member, this.recycledItemService, input);
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
  createIsDeletedTask(member: Member, input?: { item?: Partial<Item>, validate?: boolean }): IsItemDeletedTask {
    return new IsItemDeletedTask(member, this.recycledItemService, input);
  }
  createGetItemTask(member: Member, itemService: ItemService, input?: GetItemTaskInputType): GetItemTask {
    return new GetItemTask(member, this.recycledItemService, itemService, input);
  }
}
