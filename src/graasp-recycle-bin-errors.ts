import { StatusCodes } from 'http-status-codes';

import { ErrorFactory } from '@graasp/sdk';
import { FAILURE_MESSAGES } from '@graasp/translations';

import { PLUGIN_NAME } from './constants';

const GraaspRecycleBinError = ErrorFactory(PLUGIN_NAME);

export class CannotCopyRecycledItem extends GraaspRecycleBinError {
  constructor(data?: unknown) {
    super(
      {
        code: 'GRBERR001',
        statusCode: StatusCodes.BAD_REQUEST,
        message: FAILURE_MESSAGES.CANNOT_COPY_RECYCLED_ITEM,
      },
      data,
    );
  }
}

export class CannotMoveRecycledItem extends GraaspRecycleBinError {
  constructor(data?: unknown) {
    super(
      {
        code: 'GRBERR002',
        statusCode: StatusCodes.BAD_REQUEST,
        message: FAILURE_MESSAGES.CANNOT_MOVE_RECYCLED_ITEM,
      },
      data,
    );
  }
}

export class CannotDeleteRecycleItem extends GraaspRecycleBinError {
  constructor(data?: unknown) {
    super(
      {
        code: 'GRBERR003',
        statusCode: StatusCodes.BAD_REQUEST,
        message: FAILURE_MESSAGES.CANNOT_DELETE_RECYCLED_ITEM,
      },
      data,
    );
  }
}

export class CannotGetRecycledItem extends GraaspRecycleBinError {
  constructor(data?: unknown) {
    super(
      {
        code: 'GRBERR004',
        statusCode: StatusCodes.BAD_REQUEST,
        message: FAILURE_MESSAGES.CANNOT_GET_RECYCLED_ITEM,
      },
      data,
    );
  }
}

export class InvalidItemStatus extends GraaspRecycleBinError {
  constructor(data?: unknown) {
    super(
      {
        code: 'GRBERR005',
        statusCode: StatusCodes.BAD_REQUEST,
        message: FAILURE_MESSAGES.INVALID_ITEM_STATUS,
      },
      data,
    );
  }
}
