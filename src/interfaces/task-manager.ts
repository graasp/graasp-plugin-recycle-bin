import { Actor, Item, Task } from 'graasp';
import { PostHookFunctionType } from '../types';

export interface RecycledItemTaskManager<A extends Actor = Actor> {
  getOwnTaskName(): string;
  getCreateTaskName(): string;
  getDeleteTaskName(): string;
  getIsDeletedTaskName(): string;

  createGetOwnTask(actor: A): Task<A, unknown>;
  createCreateTask(actor: A, postHook: PostHookFunctionType, input?: Partial<Item>): Task<A, unknown>;
  createDeleteTask(actor: A, itemId: string): Task<A, unknown>;
  createIsDeletedTask(
    actor: A,
    input?: { item?: Partial<Item>; validate?: boolean },
  ): Task<A, unknown>;
}
