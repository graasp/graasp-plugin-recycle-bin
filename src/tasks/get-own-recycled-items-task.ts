// global
import { FastifyLoggerInstance } from 'fastify';
import { Actor, DatabaseTransactionHandler, Item, ItemService, Member, MemberService } from 'graasp';
import { RecycledItemService } from '../db-service';
import { BaseRecycleItemTask } from './base-task';

export class GetOwnRecycledItemsTask extends BaseRecycleItemTask<readonly Item[]> {
    get name(): string {
        return GetOwnRecycledItemsTask.name;
    }

    constructor(member: Member, recycleItemService: RecycledItemService,
        itemService: ItemService, memberService: MemberService,) {
        super(member, recycleItemService, itemService, memberService);
    }

    async run(handler: DatabaseTransactionHandler, log: FastifyLoggerInstance): Promise<void> {
        this.status = 'RUNNING';

        // get member's "own" recycled items (created by member and where member is admin)
        const items = await this.recycleItemService.getOwn(this.actor.id, handler);

        this.postHookHandler?.(items, this.actor, { log, handler });

        this.status = 'OK';
        this._result = items;
    }
}


