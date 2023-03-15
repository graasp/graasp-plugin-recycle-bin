CREATE TABLE "recycled_item" (
  "id" uuid PRIMARY KEY UNIQUE NOT NULL DEFAULT uuid_generate_v4(), -- generated programatically and passed on insertion
  "item_id" uuid UNIQUE NOT NULL REFERENCES "item" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "item_path" ltree UNIQUE NOT NULL,
  "creator" uuid REFERENCES "member" ("id") ON DELETE SET NULL, -- don't remove item - set creator to NULL
  "created_at" timestamp NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc')
);
