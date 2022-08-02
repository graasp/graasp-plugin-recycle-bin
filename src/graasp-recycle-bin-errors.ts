import { ErrorFactory } from '@graasp/sdk';

import { PLUGIN_NAME } from './constants';

const GraaspRecycleBinError = ErrorFactory(PLUGIN_NAME);

export class CannotCopyRecycledItem extends GraaspRecycleBinError {
  constructor(data?: unknown) {
    super({ code: 'GRBERR002', statusCode: 400, message: 'Cannot copy recycled item' }, data);
  }
}

export class CannotMoveRecycledItem extends GraaspRecycleBinError {
  constructor(data?: unknown) {
    super({ code: 'GRBERR003', statusCode: 400, message: 'Cannot move recycled item' }, data);
  }
}

export class CannotDeleteRecycleItem extends GraaspRecycleBinError {
  constructor(data?: unknown) {
    super({ code: 'GRBERR004', statusCode: 400, message: 'Cannot delete recycled item' }, data);
  }
}

export class CannotGetRecycledItem extends GraaspRecycleBinError {
  constructor(data?: unknown) {
    super({ code: 'GRBERR007', statusCode: 400, message: 'Cannot get recycled item' }, data);
  }
}

export class InvalidItemStatus extends GraaspRecycleBinError {
  constructor(data?: unknown) {
    super({ code: 'GRBERR008', statusCode: 400, message: 'Invalid item status' }, data);
  }
}
