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

export class CopyToRecycleBin extends GraaspItemTagsError {
  constructor(data?: unknown) {
    super({ code: 'GRBERR001', statusCode: 406, message: 'Cannot Copy Item to Recycle Bin' }, data);
  }
}

export class CopyRecycleBin extends GraaspItemTagsError {
  constructor() {
    super({ code: 'GRBERR002', statusCode: 406, message: 'Cannot Copy Recycle Bin' });
  }
}

export class MoveRecycleBin extends GraaspItemTagsError {
  constructor() {
    super({ code: 'GRBERR003', statusCode: 406, message: 'Cannot Move Recycle Bin' });
  }
}
