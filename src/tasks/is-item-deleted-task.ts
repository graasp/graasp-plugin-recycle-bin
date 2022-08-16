import { DatabaseTransactionHandler, Item, Member, TaskStatus } from '@graasp/sdk';

import { RecycledItemService } from '../db-service';
import { InvalidItemStatus } from '../graasp-recycle-bin-errors';
import { BaseRecycleItemTask } from './base-task';

type IsItemDeletedTaskInput = { item?: Partial<Item>; validate?: boolean };
export class IsItemDeletedTask extends BaseRecycleItemTask<boolean> {
  get name(): string {
    return IsItemDeletedTask.name;
  }

  input: IsItemDeletedTaskInput;
  getInput: () => IsItemDeletedTaskInput;

  constructor(
    member: Member,
    recycleItemService: RecycledItemService,
    input?: IsItemDeletedTaskInput,
  ) {
    super(member, recycleItemService);
    this.input = input;
  }

  async run(handler: DatabaseTransactionHandler): Promise<void> {
    this.status = TaskStatus.RUNNING;

    const { item, validate } = this.input;
    const isDeleted = await this.recycleItemService.isDeleted(item.path, handler);

    // if item should be validate, throw if it doesn't satisfy validate input
    if (typeof validate === 'boolean') {
      if (isDeleted !== validate)
        throw new InvalidItemStatus({ item, shouldBeDeleted: validate, isDeleted });
    }

    this._result = isDeleted;
    this.status = TaskStatus.OK;
  }
}
