// todo: use global schema to force response with item schema
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
        updatedAt: { type: 'string' },
        settings: {
          type: 'object',
          additionalProperties: true,
        },
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
    error: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        code: { type: 'string' },
        message: { type: 'string' },
        statusCode: { type: 'number' },
        data: {},
        origin: { type: 'string' },
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
    },
  },
};

// schema for recycling one item
const recycleOne = {
  params: { $ref: 'http://graasp.org/recycle-bin/#/definitions/idParam' },
  response: {
    200: {
      anyOf: [
        { $ref: 'http://graasp.org/recycle-bin/#/definitions/error' },
        { $ref: 'http://graasp.org/recycle-bin/#/definitions/item' },
      ],
    },
  },
};
// schema for restoring one item
const restoreOne = {
  params: { $ref: 'http://graasp.org/recycle-bin/#/definitions/idParam' },
  response: {
    200: {
      anyOf: [{ $ref: 'http://graasp.org/recycle-bin/#/definitions/error' }, { type: 'string' }],
    },
  },
};
// schema for deleting one item
const deleteOne = {
  params: { $ref: 'http://graasp.org/recycle-bin/#/definitions/idParam' },
  response: {
    200: {
      anyOf: [
        { $ref: 'http://graasp.org/recycle-bin/#/definitions/error' },
        { $ref: 'http://graasp.org/recycle-bin/#/definitions/item' },
      ],
    },
  },
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
  response: {
    200: {
      type: 'array',
      anyOf: [
        { $ref: 'http://graasp.org/recycle-bin/#/definitions/error' },
        { $ref: 'http://graasp.org/recycle-bin/#/definitions/item' },
      ],
    },
    202: {
      // ids > MAX_TARGETS_FOR_MODIFY_REQUEST_W_RESPONSE
      type: 'array',
      items: { $ref: 'http://graasp.org/recycle-bin/#/definitions/uuid' },
    },
  },
});
// schema for restoring>1 items
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const restoreMany = (maxItems: number) => ({
  querystring: {
    allOf: [
      { $ref: 'http://graasp.org/recycle-bin/#/definitions/idsQuery' },
      { properties: { id: { maxItems } } },
    ],
  },
  response: {
    200: {
      type: 'array',
      anyOf: [{ $ref: 'http://graasp.org/recycle-bin/#/definitions/error' }, { type: 'string' }],
    },
    202: {
      // ids > MAX_TARGETS_FOR_MODIFY_REQUEST_W_RESPONSE
      type: 'array',
      items: { $ref: 'http://graasp.org/recycle-bin/#/definitions/uuid' },
    },
  },
});
// schema for restoring>1 items
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const deleteMany = (maxItems: number) => ({
  querystring: {
    allOf: [
      { $ref: 'http://graasp.org/recycle-bin/#/definitions/idsQuery' },
      { properties: { id: { maxItems } } },
    ],
  },
  response: {
    200: {
      type: 'array',
      anyOf: [
        { $ref: 'http://graasp.org/recycle-bin/#/definitions/error' },
        { $ref: 'http://graasp.org/recycle-bin/#/definitions/item' },
      ],
    },
    202: {
      // ids > MAX_TARGETS_FOR_MODIFY_REQUEST_W_RESPONSE
      type: 'array',
      items: { $ref: 'http://graasp.org/recycle-bin/#/definitions/uuid' },
    },
  },
});

export {
  getRecycledItems,
  recycleOne,
  recycleMany,
  restoreOne,
  restoreMany,
  deleteMany,
  deleteOne,
};
