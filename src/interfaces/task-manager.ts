import { Actor, Item, Task } from "graasp";


export interface RecycledItemTaskManager<A extends Actor = Actor> {
    getOwnTaskName(): string;
    getCreateTaskName(): string;
    getDeleteTaskName(): string;
    getIsDeletedTaskName(): string;

    createGetOwnTask(actor: A): Task<A, unknown>;
    createCreateTask(actor: A, input?: Partial<Item>): Task<A, unknown>;
    createDeleteTask(actor: A, itemId: string): Task<A, unknown>;
    createIsDeletedTask(actor: A, input?: Partial<Item>): Task<A, unknown>;
}
