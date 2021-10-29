import qs from 'qs';
import { v4 } from 'uuid';
import { ItemTaskManager, ItemMembershipTaskManager, TaskRunner } from 'graasp-test';
import { StatusCodes } from 'http-status-codes';
import { GRAASP_ACTOR, ITEMS, ITEM_FILE, ITEM_FOLDER } from './constants';
import build from './app';
import { RecycledItemService } from '../src/db-service';
import {
  mockCreateGetMemberItemMembershipTask,
  mockDeleteTask,
  mockGetTaskSequence,
} from './mocks';
import {
  CannotCopyRecycledItem,
  CannotGetRecycledItem,
  CannotMoveRecycledItem,
} from '../src/graasp-recycle-bin-errors';
import { Item } from 'graasp';

const itemTaskManager = new ItemTaskManager();
const itemMembershipTaskManager = new ItemMembershipTaskManager();
const runner = new TaskRunner();
const actor = GRAASP_ACTOR;

describe('Plugin Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Hooks', () => {
    const item = ITEM_FILE;

    describe('Move Pre Hook Handler', () => {
      it('Prevent move on recycled items', async () => {
        jest.spyOn(runner, 'setTaskPostHookHandler').mockImplementation(async () => false);
        jest.spyOn(runner, 'setTaskPreHookHandler').mockImplementation(async (name, fn) => {
          if (name === itemTaskManager.getMoveTaskName()) {
            jest
              .spyOn(RecycledItemService.prototype, 'isDeleted')
              .mockImplementation(async () => true);
            jest.spyOn(runner, 'runSingle').mockImplementation(async () => true);
            expect(fn(item, actor, { log: undefined })).rejects.toEqual(
              new CannotMoveRecycledItem(item.id),
            );
          }
        });

        await build({ itemTaskManager, runner, itemMembershipTaskManager });
      });
      it('Continue moving for non-recycled items', async () => {
        jest.spyOn(runner, 'setTaskPostHookHandler').mockImplementation(async () => false);
        jest.spyOn(runner, 'setTaskPreHookHandler').mockImplementation(async (name, fn) => {
          if (name === itemTaskManager.getMoveTaskName()) {
            jest
              .spyOn(RecycledItemService.prototype, 'isDeleted')
              .mockImplementation(async () => true);
            jest.spyOn(runner, 'runSingle').mockImplementation(async () => false);
            expect(fn(item, actor, { log: undefined })).resolves;
          }
        });

        await build({ itemTaskManager, runner, itemMembershipTaskManager });
      });
    });
    describe('Copy Pre Hook Handler', () => {
      it('Prevent copy on recycled items', async () => {
        jest.spyOn(runner, 'setTaskPostHookHandler').mockImplementation(async () => false);
        jest.spyOn(runner, 'setTaskPreHookHandler').mockImplementation(async (name, fn) => {
          if (name === itemTaskManager.getCopyTaskName()) {
            jest
              .spyOn(RecycledItemService.prototype, 'isDeleted')
              .mockImplementation(async () => true);
            jest.spyOn(runner, 'runSingle').mockImplementation(async () => true);
            expect(fn(item, actor, { log: undefined })).rejects.toEqual(
              new CannotCopyRecycledItem(item.id),
            );
          }
        });

        await build({ itemTaskManager, runner, itemMembershipTaskManager });
      });
      it('Continue copy for non-recycled items', async () => {
        jest.spyOn(runner, 'setTaskPostHookHandler').mockImplementation(async () => false);
        jest.spyOn(runner, 'setTaskPreHookHandler').mockImplementation(async (name, fn) => {
          if (name === itemTaskManager.getCopyTaskName()) {
            jest
              .spyOn(RecycledItemService.prototype, 'isDeleted')
              .mockImplementation(async () => true);
            jest.spyOn(runner, 'runSingle').mockImplementation(async () => false);
            expect(fn(item, actor, { log: undefined })).resolves;
          }
        });

        await build({ itemTaskManager, runner, itemMembershipTaskManager });
      });
    });

    describe('Get Own Items Post Hook Handler', () => {
      it('Filter items on get own items', async () => {
        jest.spyOn(runner, 'setTaskPreHookHandler').mockImplementation(async () => false);
        jest.spyOn(runner, 'setTaskPostHookHandler').mockImplementation(async (name, fn) => {
          const deletedItem = ITEM_FOLDER;
          const items = [...ITEMS];
          if (name === itemTaskManager.getGetOwnTaskName()) {
            // only folder item is deleted
            jest
              .spyOn(RecycledItemService.prototype, 'isDeleted')
              .mockImplementation(async () => true);
            jest.spyOn(runner, 'runSingle').mockImplementation(async (task) => {
              return (task.input as { item: Item })?.item.path === deletedItem.path;
            });
            await fn(items, actor, { log: undefined });
            expect(items.length).toEqual(ITEMS.length - 1);
            expect(items).toEqual(ITEMS.slice(1));
          }
        });

        await build({ itemTaskManager, runner, itemMembershipTaskManager });
      });
    });
    describe('Get Children Post Hook Handler', () => {
      it('Filter items on get children', async () => {
        jest.spyOn(runner, 'setTaskPreHookHandler').mockImplementation(async () => false);
        jest.spyOn(runner, 'setTaskPostHookHandler').mockImplementation(async (name, fn) => {
          const deletedItem = ITEM_FOLDER;
          const items = [...ITEMS];
          if (name === itemTaskManager.getGetChildrenTaskName()) {
            // only folder item is deleted
            jest
              .spyOn(RecycledItemService.prototype, 'isDeleted')
              .mockImplementation(async () => true);
            jest.spyOn(runner, 'runSingle').mockImplementation(async (task) => {
              return (task.input as { item: Item })?.item.path === deletedItem.path;
            });
            await fn(items, actor, { log: undefined });
            expect(items.length).toEqual(ITEMS.length - 1);
            expect(items).toEqual(ITEMS.slice(1));
          }
        });

        await build({ itemTaskManager, runner, itemMembershipTaskManager });
      });
    });
    describe('Get Shared Items Hook Handler', () => {
      it('Filter items on get shared items', async () => {
        jest.spyOn(runner, 'setTaskPreHookHandler').mockImplementation(async () => false);
        jest.spyOn(runner, 'setTaskPostHookHandler').mockImplementation(async (name, fn) => {
          const deletedItem = ITEM_FOLDER;
          const items = [...ITEMS];
          if (name === itemTaskManager.getGetSharedWithTaskName()) {
            // only folder item is deleted
            jest
              .spyOn(RecycledItemService.prototype, 'isDeleted')
              .mockImplementation(async () => true);
            jest.spyOn(runner, 'runSingle').mockImplementation(async (task) => {
              return (task.input as { item: Item })?.item.path === deletedItem.path;
            });
            await fn(items, actor, { log: undefined });
            expect(items.length).toEqual(ITEMS.length - 1);
            expect(items).toEqual(ITEMS.slice(1));
          }
        });

        await build({ itemTaskManager, runner, itemMembershipTaskManager });
      });
    });
    describe('Get Item Post Hook Handler', () => {
      it('Throw error if item is recycled', async () => {
        jest.spyOn(runner, 'setTaskPreHookHandler').mockImplementation(async () => false);
        jest.spyOn(runner, 'setTaskPostHookHandler').mockImplementation(async (name, fn) => {
          const deletedItem = ITEM_FOLDER;
          if (name === itemTaskManager.getGetTaskName()) {
            // only folder item is deleted
            jest
              .spyOn(RecycledItemService.prototype, 'isDeleted')
              .mockImplementation(async () => true);
            jest.spyOn(runner, 'runSingle').mockImplementation(async (task) => {
              return true;
            });
            expect(fn(deletedItem, actor, { log: undefined })).rejects.toEqual(
              new CannotGetRecycledItem(deletedItem.id),
            );
          }
        });

        await build({ itemTaskManager, runner, itemMembershipTaskManager });
      });

      it('Continue get for non-recycled item', async () => {
        jest.spyOn(runner, 'setTaskPostHookHandler').mockImplementation(async () => false);
        jest.spyOn(runner, 'setTaskPreHookHandler').mockImplementation(async (name, fn) => {
          if (name === itemTaskManager.getGetTaskName()) {
            jest
              .spyOn(RecycledItemService.prototype, 'isDeleted')
              .mockImplementation(async () => true);
            jest.spyOn(runner, 'runSingle').mockImplementation(async () => false);
            expect(fn(item, actor, { log: undefined })).resolves;
          }
        });

        await build({ itemTaskManager, runner, itemMembershipTaskManager });
      });
    });
  });

  describe('Endpoints', () => {
    beforeEach(() => {
      jest.spyOn(runner, 'setTaskPreHookHandler').mockImplementation(async () => false);
      jest.spyOn(runner, 'setTaskPostHookHandler').mockImplementation(async () => false);
    });

    describe('GET /recycled', () => {
      it('Successfully get recycled items', async () => {
        const app = await build({ itemTaskManager, itemMembershipTaskManager, runner });
        const items = [ITEM_FOLDER, ITEM_FILE];

        jest.spyOn(RecycledItemService.prototype, 'getOwn').mockImplementation(async () => items);
        jest.spyOn(runner, 'runSingle').mockImplementation(async () => items);

        const res = await app.inject({
          method: 'GET',
          url: '/recycled',
        });

        const response = res.json();
        expect(res.statusCode).toBe(StatusCodes.OK);
        expect(response).toEqual(items);
      });

      it('Throw an error if DB throws an error', async () => {
        const app = await build({ itemTaskManager, itemMembershipTaskManager, runner });

        const errorMsg = 'This is a database error.';
        jest.spyOn(RecycledItemService.prototype, 'getOwn').mockRejectedValue(new Error(errorMsg));
        jest.spyOn(runner, 'runSingle').mockRejectedValue(new Error(errorMsg));

        const res = await app.inject({
          method: 'GET',
          url: '/recycled',
        });

        expect(res.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
        expect(res.json().message).toBe(errorMsg);
      });

      // tests are more exhaustive for task manager's createCreateTask
    });

    describe('POST /:id/recycle', () => {
      it('Successfully recycle an item', async () => {
        const app = await build({ itemTaskManager, itemMembershipTaskManager, runner });
        const item = ITEM_FOLDER;

        mockGetTaskSequence(item);
        mockCreateGetMemberItemMembershipTask(item);

        jest.spyOn(runner, 'runSingleSequence').mockImplementation(async () => true);

        const res = await app.inject({
          method: 'POST',
          url: `/${item.id}/recycle`,
        });

        expect(res.statusCode).toBe(StatusCodes.NO_CONTENT);
      });

      it('Bad request for invalid id', async () => {
        const app = await build({ itemTaskManager, itemMembershipTaskManager, runner });

        const res = await app.inject({
          method: 'POST',
          url: '/invalid/recycle',
        });

        expect(res.statusCode).toBe(StatusCodes.BAD_REQUEST);
      });

      // tests are more exhaustive for task manager's createCreateTask
    });

    describe('POST /recycle', () => {
      it('Successfully recycle many items', async () => {
        const app = await build({ itemTaskManager, itemMembershipTaskManager, runner });
        const items = [ITEM_FOLDER, ITEM_FILE];

        mockGetTaskSequence(items[0]);
        mockCreateGetMemberItemMembershipTask(items[0]);

        const mockRunSingleSequence = jest
          .spyOn(runner, 'runSingleSequence')
          .mockImplementation(async () => true);

        const res = await app.inject({
          method: 'POST',
          url: `/recycle?${qs.stringify(
            { id: items.map(({ id }) => id) },
            { arrayFormat: 'repeat' },
          )}`,
        });
        expect(res.statusCode).toBe(StatusCodes.NO_CONTENT);
        expect(mockRunSingleSequence).toHaveBeenCalledTimes(2);
      });

      it('Returns 202 when recycle many items', async () => {
        const app = await build({
          itemTaskManager,
          itemMembershipTaskManager,
          runner,
          options: { maxItemsWithResponse: 1 },
        });
        const items = [ITEM_FOLDER, ITEM_FILE];

        mockGetTaskSequence(items[0]);
        mockCreateGetMemberItemMembershipTask(items[0]);

        const mockRunSingleSequence = jest
          .spyOn(runner, 'runSingleSequence')
          .mockImplementation(async () => true);

        const res = await app.inject({
          method: 'POST',
          url: `/recycle?${qs.stringify(
            { id: items.map(({ id }) => id) },
            { arrayFormat: 'repeat' },
          )}`,
        });
        expect(res.statusCode).toBe(StatusCodes.ACCEPTED);
        expect(mockRunSingleSequence).toHaveBeenCalledTimes(2);
      });

      it('Bad request if recycle more than maxItemsInRequest items', async () => {
        const app = await build({
          itemTaskManager,
          itemMembershipTaskManager,
          runner,
          options: { maxItemsInRequest: 1 },
        });
        const items = [ITEM_FOLDER, ITEM_FILE];

        const res = await app.inject({
          method: 'POST',
          url: `/recycle?${qs.stringify(
            { id: items.map(({ id }) => id) },
            { arrayFormat: 'repeat' },
          )}`,
        });
        expect(res.statusCode).toBe(StatusCodes.BAD_REQUEST);
      });

      it('Bad request for invalid id', async () => {
        const app = await build({ itemTaskManager, itemMembershipTaskManager, runner });

        const res = await app.inject({
          method: 'POST',
          url: `/recycle?${qs.stringify({ id: ['invalid-id', v4()] }, { arrayFormat: 'repeat' })}`,
        });

        expect(res.statusCode).toBe(StatusCodes.BAD_REQUEST);
      });
    });

    describe('POST /:id/restore', () => {
      it('Successfully restore an item', async () => {
        const app = await build({ itemTaskManager, itemMembershipTaskManager, runner });
        const item = ITEM_FOLDER;

        jest.spyOn(runner, 'runSingle').mockImplementation(async () => true);

        const response = await app.inject({
          method: 'POST',
          url: `/${item.id}/restore`,
        });

        expect(response.statusCode).toBe(StatusCodes.NO_CONTENT);
      });

      it('Bad request for invalid id', async () => {
        const app = await build({ itemTaskManager, itemMembershipTaskManager, runner });

        const res = await app.inject({
          method: 'POST',
          url: '/invalid/restore',
        });

        expect(res.statusCode).toBe(StatusCodes.BAD_REQUEST);
      });
    });

    describe('POST /restore', () => {
      it('Successfully restore multiple items', async () => {
        const app = await build({ itemTaskManager, itemMembershipTaskManager, runner });
        const items = [ITEM_FOLDER, ITEM_FILE];

        jest.spyOn(runner, 'runSingle').mockImplementation(async () => true);

        const response = await app.inject({
          method: 'POST',
          url: `/restore?${qs.stringify(
            { id: items.map(({ id }) => id) },
            { arrayFormat: 'repeat' },
          )}`,
        });

        expect(response.statusCode).toBe(StatusCodes.NO_CONTENT);
      });

      it('Bad request for invalid id', async () => {
        const app = await build({ itemTaskManager, itemMembershipTaskManager, runner });

        const res = await app.inject({
          method: 'POST',
          url: `/restore?${qs.stringify({ id: ['invalid', 'invalid-id'] })}`,
        });

        expect(res.statusCode).toBe(StatusCodes.BAD_REQUEST);
      });
    });

    describe('DELETE /:id/delete', () => {
      it('Successfully delete a recycled item', async () => {
        const app = await build({ itemTaskManager, itemMembershipTaskManager, runner });
        const item = ITEM_FOLDER;

        jest.spyOn(runner, 'runSingleSequence').mockImplementation(async () => item);
        mockCreateGetMemberItemMembershipTask(item);
        mockDeleteTask(item);

        const response = await app.inject({
          method: 'DELETE',
          url: `${item.id}/delete`,
        });

        expect(response.statusCode).toBe(StatusCodes.OK);
        // the following check is not really meaningful since the value comes from a mock
        expect(response.json()).toEqual(item);
      });

      it('Bad request for invalid id', async () => {
        const app = await build({ itemTaskManager, itemMembershipTaskManager, runner });

        const res = await app.inject({
          method: 'DELETE',
          url: `invalid-id/delete`,
        });

        expect(res.statusCode).toBe(StatusCodes.BAD_REQUEST);
      });
    });


    describe('DELETE /delete', () => {
      it('Successfully delete multiple items', async () => {
        const app = await build({ itemTaskManager, itemMembershipTaskManager, runner });
        const items = [ITEM_FOLDER, ITEM_FILE];

        jest.spyOn(runner, 'runSingle').mockImplementation(async () => true);
        const mock = mockCreateGetMemberItemMembershipTask(items[0])
        mockDeleteTask(items[0])
        jest.spyOn(runner, 'runMultipleSequences').mockImplementation(async () => items);

        const response = await app.inject({
          method: 'DELETE',
          url: `/delete?${qs.stringify(
            { id: items.map(({ id }) => id) },
            { arrayFormat: 'repeat' },
          )}`,
        });
        expect(response.statusCode).toBe(StatusCodes.OK);
        expect(mock).toHaveBeenCalledTimes(items.length)
      });


      it('Returns 202 when deleting many items', async () => {
        const app = await build({
          itemTaskManager,
          itemMembershipTaskManager,
          runner,
          options: { maxItemsWithResponse: 1 },
        });
        const items = [ITEM_FOLDER, ITEM_FILE];

        jest.spyOn(runner, 'runSingle').mockImplementation(async () => true);
        const mock = mockCreateGetMemberItemMembershipTask(items[0])
        mockDeleteTask(items[0])
        jest.spyOn(runner, 'runMultipleSequences').mockImplementation(async () => items);

        const res = await app.inject({
          method: 'DELETE',
          url: `/delete?${qs.stringify(
            { id: items.map(({ id }) => id) },
            { arrayFormat: 'repeat' },
          )}`,
        });
        expect(res.statusCode).toBe(StatusCodes.ACCEPTED);
        expect(mock).toHaveBeenCalledTimes(2);
      });

      it('Bad request if recycle more than maxItemsInRequest items', async () => {
        const app = await build({
          itemTaskManager,
          itemMembershipTaskManager,
          runner,
          options: { maxItemsInRequest: 1 },
        });
        const items = [ITEM_FOLDER, ITEM_FILE];

        const res = await app.inject({
          method: 'DELETE',
          url: `/delete?${qs.stringify(
            { id: items.map(({ id }) => id) },
            { arrayFormat: 'repeat' },
          )}`,
        });
        expect(res.statusCode).toBe(StatusCodes.BAD_REQUEST);
      });

      it('Bad request for invalid id', async () => {
        const app = await build({ itemTaskManager, itemMembershipTaskManager, runner });

        const res = await app.inject({
          method: 'DELETE',
          url: `/delete?${qs.stringify({ id: ['invalid', 'invalid-id'] })}`,
        });

        expect(res.statusCode).toBe(StatusCodes.BAD_REQUEST);
      });
    });
  });
});
