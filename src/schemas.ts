export default {
  $id: 'http://graasp.org/recycle-bin/',
  definitions: {
    // item properties to be returned to the client
    item: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        description: { type: ['string', 'null'] },
        type: { type: 'string' },
        path: { type: 'string' },
        extra: {
          type: 'object',
          additionalProperties: true,
        },
        creator: { type: 'string' },
        createdAt: { type: 'string' },
        updatedAt: { type: 'string' }
      },
      additionalProperties: false,
    },
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
    idsQuery: {
      type: 'object',
      required: ['id'],
      properties: {
        id: {
          type: 'array',
          items: { $ref: '#/definitions/uuid' },
          uniqueItems: true,
        },
      },
      additionalProperties: false,
    },
  },
};

// schema for getting recycled items
const getRecycledItems = {
  response: {
    200: {
      type: 'array',
      items: { $ref: 'http://graasp.org/recycle-bin/#/definitions/item' },
      // todo: use global schema to force response with item schema
    },
  },
};

// schema for recycling one item
const recycleOne = {
  params: { $ref: 'http://graasp.org/recycle-bin/#/definitions/idParam' },
};
// schema for recycling one item
const restoreOne = {
  params: { $ref: 'http://graasp.org/recycle-bin/#/definitions/idParam' },
};

// schema for recycling >1 items
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const recycleMany = (maxItems: number) => ({
  querystring: {
    allOf: [
      { $ref: 'http://graasp.org/recycle-bin/#/definitions/idsQuery' },
      { properties: { id: { maxItems } } },
    ],
  },
});
// schema for restoring>1 items
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const restoreMany = (maxItems: number) => ({
  querystring: {
    allOf: [
      { $ref: 'http://graasp.org/recycle-bin/#/definitions/idsQuery' },
      { properties: { id: { maxItems } } }
    ]
  }
});

export {
  getRecycledItems,
  recycleOne,
  recycleMany,
  restoreOne,
  restoreMany
};
