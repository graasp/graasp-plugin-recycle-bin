-- alter table item add column deleted boolean


CREATE TABLE "recycled_item" (
  "id" uuid PRIMARY KEY UNIQUE NOT NULL DEFAULT uuid_generate_v4(), -- generated programatically and passed on insertion
  "item_id" uuid UNIQUE NOT NULL REFERENCES "item" ("id") ON DELETE CASCADE,
  "item_path" ltree UNIQUE NOT NULL,
  "creator" uuid REFERENCES "member" ("id") ON DELETE SET NULL, -- don't remove item - set creator to NULL
  "created_at" timestamp NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc')
);



-- -- insert the recycle bin item

-- INSERT INTO item (
--     id,
--     name,
--     description,
--     type,
--     path,
--     creator
--   )
-- VALUES (
--     'c7ce9a0e-492a-4a4b-a063-4e229f75bb3d',
--     'recycleBin',
--     '',
--     'folder',
--     'c7ce9a0e_492a_4a4b_a063_4e229f75bb3d',
--     '12345678-1234-1234-1234-123456789012' -- this should match graasp actor id
--   );




-- id, itemid, createdAt, original path

-- - > should keep mmeberships
-- -> recycled items : admin rights 


-- - id, itemid, createdAt
--     get children, get own -> move item to avoid being there one recyclebin item of actor 
--                 <- avoid check membership? i suppose no error/o/w read for everyone? <- but then need to remove in shared...
--         bypass membership of parent
--             X use item get children <- give only memberships? NO
--             get id from recycle table with admin memberships
            
--         need to prevent op on recycled items <- root in recyclebin item


-- restore:
    -- remove entry in recycle table
    -- move to original path
-- recycle:
    -- add entry
    -- move to recyclebin item

-- get children of deleted item
    -- get item normal? <- front can infer recycled from path given id

-- get recycle bin items
    -- get children of recyclebin item <- does not work bc regular call doesn't check memberships
    ---> join recycle table x admin memberships <<<- allow for multiple people to have the same item
    
-- XX move whole item to recycle
--     - move memberships??
