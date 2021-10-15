// global
import { DatabaseTransactionHandler, Item, Member } from 'graasp';
import { RecycledItemService } from '../db-service';
import { BaseRecycleItemTask } from './base-task';

type CreateRecycledItemTaskInput = Partial<Item>;
export class CreateRecycledItemTask extends BaseRecycleItemTask<Item> {
  get name(): string {
    return CreateRecycledItemTask.name;
  }

  input: CreateRecycledItemTaskInput;
  getInput: () => CreateRecycledItemTaskInput;

  constructor(
    member: Member,
    recycleItemService: RecycledItemService,
    input?: CreateRecycledItemTaskInput,
  ) {
    super(member, recycleItemService);
    this.input = input;
  }

  async run(handler: DatabaseTransactionHandler): Promise<void> {
    this.status = 'RUNNING';

    const { id: memberId } = this.actor;
    await this.recycleItemService.create(this.input, memberId, handler);

    this.status = 'OK';
  }
}
