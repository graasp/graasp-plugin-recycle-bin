// global
import { DatabaseTransactionHandler, Member } from 'graasp';
import { RecycledItemService } from '../db-service';
import { BaseRecycleItemTask } from './base-task';

type DeleteRecycledItemTaskInput = string;

export class DeleteRecycledItemTask extends BaseRecycleItemTask<string> {
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

    await this.recycleItemService.delete(this.input, handler);
    // return id of the item
    this._result = this.input;

    this.status = 'OK';
  }
}
