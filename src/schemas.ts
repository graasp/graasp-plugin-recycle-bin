// schema for getting recycled items
const getRecycledItems = {
  response: {
    200: {
      type: 'array',
      items: { $ref: 'http://graasp.org/items/#/definitions/item' }
    },
  }
};

// schema for recycling one item
const recycleOne = {
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
  recycleMany
};