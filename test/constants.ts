import { v4 } from 'uuid';
import { Actor, Item } from 'graasp';

export const ITEM_FILE: Item = {
  id: v4(),
  description: '',
  path: 'some_path',
  name: 'item-file',
  type: 'file',
  extra: {
    file: {},
  },
  creator: 'creator-id',
  createdAt: 'somedata',
  updatedAt: 'somedata',
};

export const ITEM_FOLDER: Item = {
  id: v4(),
  description: '',
  path: 'some_folder_path',
  name: 'item-folder',
  type: 'folder',
  extra: {},
  creator: 'creator-id',
  createdAt: 'somedata',
  updatedAt: 'somedata',
};

export const GRAASP_ACTOR: Actor = {
  id: 'actorid',
};

export const ITEMS: Item[] = [
  ITEM_FOLDER,
  {
    id: v4(),
    description: '',
    path: 'some_folder_path_1',
    name: 'item-folder',
    type: 'folder',
    extra: {},
    creator: 'creator-id',
    createdAt: 'somedata',
    updatedAt: 'somedata',
  },
  {
    id: v4(),
    description: '',
    path: 'some_folder_path_2',
    name: 'item-folder',
    type: 'folder',
    extra: {},
    creator: 'creator-id',
    createdAt: 'somedata',
    updatedAt: 'somedata',
  },
];
