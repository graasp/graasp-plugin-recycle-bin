// global
import { FastifyLoggerInstance } from 'fastify';
import { DatabaseTransactionHandler, Item, Member } from 'graasp';
import { RecycledItemService } from '../db-service';
import { BaseRecycleItemTask } from './base-task';

type CreateRecycledItemTaskInput = Partial<Item>;
export class CreateRecycledItemTask extends BaseRecycleItemTask<string> {
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

  async run(handler: DatabaseTransactionHandler, log: FastifyLoggerInstance): Promise<void> {
    this.status = 'RUNNING';

    const { id: memberId } = this.actor;
    const { path } = this.input;
    await this.recycleItemService.create(this.input, memberId, handler);
    await this.postHookHandler?.(path, this.actor, {log, handler});

    this.status = 'OK';
  }
}
