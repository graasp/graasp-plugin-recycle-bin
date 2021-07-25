import { GraaspErrorDetails, GraaspError } from 'graasp';

export class GraaspItemTagsError implements GraaspError {
  name: string;
  code: string
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

export class CannotCopyIntoRecycleBin extends GraaspItemTagsError {
  constructor(data?: unknown) {
    super({ code: 'GRBERR001', statusCode: 400, message: 'Cannot copy items into recycle bin item' }, data);
  }
}

export class CannotCopyRecycleBin extends GraaspItemTagsError {
  constructor(data?: unknown) {
    super({ code: 'GRBERR002', statusCode: 400, message: 'Cannot copy recycle bin item' }, data);
  }
}

export class CannotMoveRecycleBin extends GraaspItemTagsError {
  constructor(data?: unknown) {
    super({ code: 'GRBERR003', statusCode: 400, message: 'Cannot move recycle bin item' }, data);
  }
}

export class CannotDeleteRecycleBin extends GraaspItemTagsError {
  constructor(data?: unknown) {
    super({ code: 'GRBERR004', statusCode: 400, message: 'Cannot delete recycle bin item' }, data);
  }
}

export class CannotCreateItemMembershipInRecycleBin extends GraaspItemTagsError {
  constructor(data?: unknown) {
    super({ code: 'GRBERR005', statusCode: 400, message: 'Cannot create item memberships in recycle bin' }, data);
  }
}

export class CannotModifyOwnRecycleBinItemMembership extends GraaspItemTagsError {
  constructor(data?: unknown) {
    super({ code: 'GRBERR006', statusCode: 400, message: 'Cannot modify own recycle bin item membership ' }, data);
  }
}
