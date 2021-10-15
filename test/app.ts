import fastify from 'fastify';
import { Item, ItemMembershipTaskManager, ItemTaskManager, TaskRunner } from 'graasp';
import plugin from '../src/plugin';
import { GRAASP_ACTOR } from './constants';

const schemas = {
  $id: 'http://graasp.org/',
  definitions: {
    uuid: {
      type: 'string',
      pattern: '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$',
    },
    idParam: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { $ref: '#/definitions/uuid' },
      },
      additionalProperties: false,
    },
  },
};

const build = async ({
  runner,
  itemTaskManager,
  itemMembershipTaskManager,
  options,
}: {
  runner: TaskRunner<Item>
  itemTaskManager: ItemTaskManager,
  itemMembershipTaskManager: ItemMembershipTaskManager
  options?: any;
}) => {
  const app = fastify();
  app.addSchema(schemas);
  app.decorateRequest('member', GRAASP_ACTOR);

  app.decorate('taskRunner', runner);
  app.decorate('items', {
    taskManager: itemTaskManager,
  });
  app.decorate('itemMemberships', {
    taskManager: itemMembershipTaskManager,
  });

  await app.register(plugin, options);

  return app;
};
export default build;
