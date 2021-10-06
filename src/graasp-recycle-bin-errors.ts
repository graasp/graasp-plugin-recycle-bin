import { GraaspErrorDetails, GraaspError } from 'graasp';

export class GraaspItemTagsError implements GraaspError {
  name: string;
  code: string;
  message: string;
  statusCode?: number;
  data?: unknown;
  origin: 'core' | 'plugin';

  constructor({ code, statusCode, message }: GraaspErrorDetails, data?: unknown) {
    this.name = code;
    this.code = code;
    this.message = message;
    this.statusCode = statusCode;
    this.data = data;
    this.origin = 'plugin';
  }
}

export class CannotCopyRecycledItem extends GraaspItemTagsError {
  constructor(data?: unknown) {
    super({ code: 'GRBERR002', statusCode: 400, message: 'Cannot copy recycled item' }, data);
  }
}

export class CannotMoveRecycledItem extends GraaspItemTagsError {
  constructor(data?: unknown) {
    super({ code: 'GRBERR003', statusCode: 400, message: 'Cannot move recycled item' }, data);
  }
}

export class CannotDeleteRecycleItem extends GraaspItemTagsError {
  constructor(data?: unknown) {
    super({ code: 'GRBERR004', statusCode: 400, message: 'Cannot delete recycled item' }, data);
  }
}

export class CannotCreateItemMembershipInRecycledItem extends GraaspItemTagsError {
  constructor(data?: unknown) {
    super(
      {
        code: 'GRBERR005',
        statusCode: 400,
        message: 'Cannot create item memberships in recycle bin',
      },
      data,
    );
  }
}

export class CannotUpdateItemMembershipInRecycledItem extends GraaspItemTagsError {
  constructor(data?: unknown) {
    super(
      {
        code: 'GRBERR006',
        statusCode: 400,
        message: 'Cannot update item memberships in recycle bin',
      },
      data,
    );
  }
}

export class CannotGetRecycledItem extends GraaspItemTagsError {
  constructor(data?: unknown) {
    super({ code: 'GRBERR007', statusCode: 400, message: 'Cannot get recycled item' }, data);
  }
}


export class InvalidItemStatus extends GraaspItemTagsError {
  constructor(data?: unknown) {
    super({ code: 'GRBERR008', statusCode: 400, message: 'Invalid item status' }, data);
  }
}
