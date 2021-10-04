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
          additionalProperties: true
        },
        creator: { type: 'string' },
        createdAt: {},
        updatedAt: {}
      },
      additionalProperties: false
    }
  }
};

// schema for getting recycled items
const getRecycledItems = {
  response: {
    200: {
      type: 'array',
      items: { $ref: 'http://graasp.org/recycle-bin/#/definitions/item' }
      // todo: use global schema to force response with item schema
    },
  }
};

// schema for recycling one item
const recycleOne = {
  params: { $ref: 'http://graasp.org/#/definitions/idParam' }
};
// schema for recycling one item
const restoreOne = {
  params: { $ref: 'http://graasp.org/#/definitions/idParam' }
};

// schema for recycling >1 items
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const recycleMany = (maxItems: number) => ({
  querystring: {
    allOf: [
      { $ref: 'http://graasp.org/#/definitions/idsQuery' },
      { properties: { id: { maxItems } } }
    ]
  }
});

export {
  getRecycledItems,
  recycleOne,
  recycleMany,
  restoreOne
};
