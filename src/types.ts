export type RecycledItemEntry = {
  id: string;
  parentId: string;
  createdAt: string;
  creator: string;
};

export type PostHookFunctionType = (itemPath, handler) => null;