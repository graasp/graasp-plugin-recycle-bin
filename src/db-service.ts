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

  private static allColumnsForJoins = sql.join(
    [
      [['item', 'id'], ['id']],
      [['item', 'name'], ['name']],
      [['item', 'description'], ['description']],
      [['item', 'type'], ['type']],
      [['item', 'path'], ['path']],
      [['item', 'extra'], ['extra']],
      [['item', 'creator'], ['creator']],
      [['item', 'created_at'], ['createdAt']],
      [['item', 'updated_at'], ['updatedAt']],
    ].map((c) =>
      sql.join(
        c.map((cwa) => sql.identifier(cwa)),
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
          SELECT ${RecycledItemService.allColumnsForJoins}
          FROM (
            SELECT item_path, permission,
              RANK() OVER (PARTITION BY subpath(item_path, 0, 1) ORDER BY item_path ASC) AS membership_rank
            FROM item_membership
            WHERE member_id = ${memberId}
          ) AS t1
          INNER JOIN item
            ON  t1.item_path @> item.path
          INNER JOIN recycled_item ON recycled_item.item_id = item.id
          WHERE t1.membership_rank = 1
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
