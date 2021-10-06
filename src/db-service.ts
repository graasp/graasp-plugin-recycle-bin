// global
import { sql, DatabaseTransactionConnectionType as TrxHandler } from 'slonik';
import { Item } from 'graasp';
import { RecycledItemEntry } from './types';

export class RecycledItemService {
  constructor() {}

  // the 'safe' way to dynamically generate the columns names:
  private static allColumns = sql.join(
    [
      'id',
      ['item_id', 'itemId'],
      ['item_path', 'itemPath'],
      'creator',
      ['created_at', 'createdAt'],
    ].map((c) =>
      !Array.isArray(c)
        ? sql.identifier([c])
        : sql.join(
            c.map((cwa) => sql.identifier([cwa])),
            sql` AS `,
          ),
    ),
    sql`, `,
  );

  /**
   * Create item-recycle bond in 'recycled_item' table
   * @param itemId Item id
   * @param transactionHandler Database transaction handler
   */
  async create(
    { id, path }: Partial<Item>,
    creator: string,
    transactionHandler: TrxHandler,
  ): Promise<RecycledItemEntry> {
    return transactionHandler
      .query<RecycledItemEntry>(
        sql`
        INSERT INTO recycled_item (item_id, item_path, creator)
        VALUES (${id}, ${path}, ${creator})
      `,
      )
      .then(({ rows }) => rows[0]);
  }

  /**
   * Delete item-recycle bond in 'recycled_item' table
   * @param itemId Item id
   * @param transactionHandler Database transaction handler
   */
  async delete(itemId: string, transactionHandler: TrxHandler): Promise<RecycledItemEntry> {
    return transactionHandler
      .query<RecycledItemEntry>(
        sql`
        DELETE FROM recycled_item
        WHERE item_id = ${itemId}
        RETURNING ${RecycledItemService.allColumns}
      `,
      )
      .then(({ rows }) => rows[0]);
  }

  /**
   * Get `member`'s own recycled items (where member is `admin`)
   * @param transactionHandler Database transaction handler
   * TODO: does this make sense here? Should this be part of different (micro)service??
   */
  async getOwn(memberId: string, transactionHandler: TrxHandler): Promise<Item[]> {
    return (
      transactionHandler
        .query<Item>(
          sql`
        SELECT *
        FROM item
        INNER JOIN recycled_item ON recycled_item.item_id = item.id
        INNER JOIN item_membership
          ON item.path = item_membership.item_path
        WHERE item_membership.member_id = ${memberId}
          AND item_membership.permission = 'admin'
          AND item.creator = ${memberId}
      `,
        )
        // TODO: is there a better way?
        .then(({ rows }) => rows.slice(0))
    );
  }

  /**
   * Get whether an item is deleted
   * @param transactionHandler Database transaction handler
   */
  async isDeleted(itemPath: string, transactionHandler: TrxHandler): Promise<boolean> {
    return transactionHandler
      .query<Item>(
        sql`
        SELECT *
        FROM recycled_item
        WHERE item_path @> ${itemPath}
      `,
      )
      .then(({ rows }) => Boolean(rows.length));
  }
}
