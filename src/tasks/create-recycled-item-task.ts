// global
import { FastifyLoggerInstance } from 'fastify';
import { DatabaseTransactionHandler, Item, ItemService, Member, MemberService } from 'graasp';
import { RecycledItemService } from '../db-service';
import { BaseRecycleItemTask } from './base-task';

type CreateRecycledItemTaskInput = Partial<Item>
export class CreateRecycledItemTask extends BaseRecycleItemTask<Item> {

    get name(): string {
        return CreateRecycledItemTask.name;
    }


    input: CreateRecycledItemTaskInput;
    getInput: () => CreateRecycledItemTaskInput

    constructor(member: Member, recycleItemService: RecycledItemService,
        itemService: ItemService, memberService: MemberService, input?: CreateRecycledItemTaskInput) {
        super(member, recycleItemService, itemService, memberService);
        this.input = input
    }

    async run(handler: DatabaseTransactionHandler, log: FastifyLoggerInstance): Promise<void> {
        this.status = 'RUNNING';

        const { id: memberId } = this.actor;
        await this.recycleItemService.create(this.input, memberId, handler);

        this.status = 'OK';
    }
}
