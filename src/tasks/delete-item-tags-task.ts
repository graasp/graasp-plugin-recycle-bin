// global
import { DatabaseTransactionHandler, Item, Member } from 'graasp';
import { RecycledItemService } from '../db-service';
import { BaseRecycleItemTask } from './base-task';

type DeleteItemTagsTaskInput = Partial<Item>;

export class DeleteItemTagsTask extends BaseRecycleItemTask<number> {
  get name(): string {
    return DeleteItemTagsTask.name;
  }

  input: DeleteItemTagsTaskInput;
  getInput: () => DeleteItemTagsTaskInput;

  constructor(
    member: Member,
    recycleItemService: RecycledItemService,
    input: DeleteItemTagsTaskInput,
  ) {
    super(member, recycleItemService);
    this.input = input;
  }

  async run(handler: DatabaseTransactionHandler): Promise<void> {
    this.status = 'RUNNING';

    const itemPath = this.input?.path;
    this._result = await this.recycleItemService.deleteItemTags(itemPath, handler);
    this.status = 'OK';
  }
}
