import { DatabaseTransactionHandler, Item, ItemService, Member, TaskStatus } from '@graasp/sdk';

import { RecycledItemService } from '../db-service';
import { BaseRecycleItemTask } from './base-task';

// this task get aroung the regular get item task
// it avoids the post and pre hooks
export type GetItemTaskInputType = { itemId: string };
export class GetItemTask extends BaseRecycleItemTask<Item> {
  get name(): string {
    return GetItemTask.name;
  }

  input: GetItemTaskInputType;
  getInput: () => GetItemTaskInputType;

  constructor(
    member: Member,
    recycleItemService: RecycledItemService,
    itemService: ItemService,
    input?: GetItemTaskInputType,
  ) {
    super(member, recycleItemService);
    this.itemService = itemService;
    this.input = input;
  }

  async run(handler: DatabaseTransactionHandler): Promise<void> {
    this.status = TaskStatus.RUNNING;

    const { itemId } = this.input;

    this._result = await this.itemService.get(itemId, handler);
    this.status = TaskStatus.OK;
  }
}
