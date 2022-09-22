import { v4 } from 'uuid';

import { Actor, Item, ItemType } from '@graasp/sdk';

export const ITEM_FILE: Item = {
  id: v4(),
  description: '',
  path: 'some_path',
  name: 'item-file',
  type: ItemType.LOCAL_FILE,
  extra: {
    file: {},
  },
  creator: 'creator-id',
  createdAt: 'somedata',
  updatedAt: 'somedata',
  settings: {
    isPinned: false,
    showChatBox: false,
  },
};

export const ITEM_FOLDER: Item = {
  id: v4(),
  description: '',
  path: 'some_folder_path_0',
  name: 'item-folder',
  type: ItemType.FOLDER,
  extra: {},
  creator: 'creator-id',
  createdAt: 'somedata',
  updatedAt: 'somedata',
  settings: {
    isPinned: false,
    showChatBox: false,
  },
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
    type: ItemType.FOLDER,
    extra: {},
    creator: 'creator-id',
    createdAt: 'somedata',
    updatedAt: 'somedata',
    settings: {
      isPinned: false,
      showChatBox: false,
    },
  },
  {
    id: v4(),
    description: '',
    path: 'some_folder_path_2',
    name: 'item-folder',
    type: ItemType.FOLDER,
    extra: {},
    creator: 'creator-id',
    createdAt: 'somedata',
    updatedAt: 'somedata',
    settings: {
      isPinned: false,
      showChatBox: false,
    },
  },
];
