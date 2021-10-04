import { Actor, Item, ItemService, Member, MemberService, } from "graasp";
import { RecycledItemService } from "./db-service";
import { RecycledItemTaskManager } from "./interfaces/task-manager";
import { CreateRecycledItemTask } from "./tasks/create-recycled-item-task";
import { DeleteRecycledItemTask } from "./tasks/delete-recycled-item-task";
import { GetOwnRecycledItemsTask } from "./tasks/get-own-recycled-items-task";
import { IsItemDeletedTask } from "./tasks/is-item-deleted-task";

export class TaskManager implements RecycledItemTaskManager<Member> {
    private itemService: ItemService;
    private memberService: MemberService;
    private recycledItemService: RecycledItemService;

    constructor(itemService: ItemService, memberService: MemberService) {
        this.itemService = itemService;
        this.memberService = memberService;
        this.recycledItemService = new RecycledItemService()
    }

    getOwnTaskName(): string {
        return GetOwnRecycledItemsTask.name;
    }

    createGetOwnTask(member: Member): GetOwnRecycledItemsTask {
        return new GetOwnRecycledItemsTask(member, this.recycledItemService, this.itemService, this.memberService);
    }

    getCreateTaskName(): string {
        return CreateRecycledItemTask.name;
    }

    createCreateTask(member: Member, input?: Partial<Item>): CreateRecycledItemTask {
        return new CreateRecycledItemTask(member, this.recycledItemService, this.itemService, this.memberService, input);
    }
    getDeleteTaskName(): string {
        return DeleteRecycledItemTask.name;
    }

    createDeleteTask(member: Member, itemId?: string): DeleteRecycledItemTask {
        return new DeleteRecycledItemTask(member, this.recycledItemService, this.itemService, this.memberService, itemId);
    }
    getIsDeletedTaskName(): string {
        return DeleteRecycledItemTask.name;
    }
    createIsDeletedTask(member: Member, input?: Partial<Item>): IsItemDeletedTask {
        return new IsItemDeletedTask(member, this.recycledItemService, this.itemService, this.memberService, input);
    }
}
