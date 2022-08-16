import { FastifyLoggerInstance } from 'fastify';

import { DatabaseTransactionHandler, Item, Member, TaskStatus } from '@graasp/sdk';

import { RecycledItemService } from '../db-service';
import { BaseRecycleItemTask } from './base-task';

export class GetOwnRecycledItemsTask extends BaseRecycleItemTask<readonly Item[]> {
  get name(): string {
    return GetOwnRecycledItemsTask.name;
  }

  constructor(member: Member, recycleItemService: RecycledItemService) {
    super(member, recycleItemService);
  }

  async run(handler: DatabaseTransactionHandler, _log: FastifyLoggerInstance): Promise<void> {
    this.status = TaskStatus.RUNNING;

    // get member's "own" recycled items (created by member and where member is admin)
    const items = await this.recycleItemService.getOwn(this.actor.id, handler);

    this.status = TaskStatus.OK;
    this._result = items;
  }
}
