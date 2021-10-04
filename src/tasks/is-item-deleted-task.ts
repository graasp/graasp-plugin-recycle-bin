// global
import { FastifyLoggerInstance } from 'fastify';
import { DatabaseTransactionHandler, Item, ItemService, Member, MemberService } from 'graasp';
import { RecycledItemService } from '../db-service';
import { BaseRecycleItemTask } from './base-task';

type IsItemDeletedTaskInput = Partial<Item>
export class IsItemDeletedTask extends BaseRecycleItemTask<boolean> {

    get name(): string {
        return IsItemDeletedTask.name;
    }

    input: IsItemDeletedTaskInput;
    getInput: () => IsItemDeletedTaskInput

    constructor(member: Member, recycleItemService: RecycledItemService,
        itemService: ItemService, memberService: MemberService, input?: IsItemDeletedTaskInput) {
        super(member, recycleItemService, itemService, memberService);
        this.input = input
    }

    async run(handler: DatabaseTransactionHandler, log: FastifyLoggerInstance): Promise<void> {
        this.status = 'RUNNING';

        const isDeleted = await this.recycleItemService.isDeleted(this.input.path, handler);
        console.log('isDeleted: ', this.input.path, isDeleted);
        this._result = isDeleted
        this.status = 'OK';
    }
}
