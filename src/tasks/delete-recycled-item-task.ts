// global
import { DatabaseTransactionHandler, Member } from 'graasp';
import { RecycledItemService } from '../db-service';
import { RecycledItemEntry } from '../types';
import { BaseRecycleItemTask } from './base-task';

type DeleteRecycledItemTaskInput = string;

export class DeleteRecycledItemTask extends BaseRecycleItemTask<RecycledItemEntry> {
  get name(): string {
    return DeleteRecycledItemTask.name;
  }

  input: DeleteRecycledItemTaskInput;
  getInput: () => DeleteRecycledItemTaskInput;

  constructor(
    member: Member,
    recycleItemService: RecycledItemService,
    input?: DeleteRecycledItemTaskInput,
  ) {
    super(member, recycleItemService);
    this.input = input;
  }

  async run(handler: DatabaseTransactionHandler): Promise<void> {
    this.status = 'RUNNING';

    // get member's "own" recycled items (member is admin and is in recycled items table)
    const result = await this.recycleItemService.delete(this.input, handler);

    this.status = 'OK';
    this._result = result;
  }
}
