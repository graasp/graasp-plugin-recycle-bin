// global
import { FastifyLoggerInstance } from 'fastify';
import {
  DatabaseTransactionHandler,
  IndividualResultType,
  ItemService,
  Member,
  PostHookHandlerType,
  PreHookHandlerType,
} from 'graasp';
import { Task, TaskStatus } from 'graasp';
// local
import { RecycledItemService } from '../db-service';

export abstract class BaseRecycleItemTask<R> implements Task<Member, R> {
  protected itemService: ItemService;
  protected recycleItemService: RecycledItemService;
  protected _result: R;
  protected _message: string;

  readonly actor: Member;

  status: TaskStatus;
  targetId: string;
  data: Partial<IndividualResultType<R>>;
  preHookHandler?: PreHookHandlerType<R>;
  postHookHandler?: PostHookHandlerType<R>;

  getInput?: () => unknown;
  getResult?: () => unknown;

  constructor(actor: Member, recycleItemService: RecycledItemService) {
    this.actor = actor;
    this.recycleItemService = recycleItemService;
    this.status = 'NEW';
  }

  abstract get name(): string;
  get result(): R {
    return this._result;
  }
  get message(): string {
    return this._message;
  }

  input?: unknown;
  skip?: boolean;

  abstract run(
    handler: DatabaseTransactionHandler,
    log: FastifyLoggerInstance,
  ): Promise<void | BaseRecycleItemTask<R>[]>;
}
