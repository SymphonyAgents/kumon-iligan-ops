-- Convert all money columns from numeric(10,2) to bigint scaled by 100000
-- e.g. 1500.00 -> 150000000

ALTER TABLE "services"
  ALTER COLUMN "price" TYPE bigint USING ROUND("price"::numeric * 100000)::bigint;

ALTER TABLE "transactions"
  ALTER COLUMN "total" TYPE bigint USING ROUND("total"::numeric * 100000)::bigint,
  ALTER COLUMN "paid"  TYPE bigint USING ROUND("paid"::numeric  * 100000)::bigint;

ALTER TABLE "transaction_items"
  ALTER COLUMN "price" TYPE bigint USING ROUND("price"::numeric * 100000)::bigint;

ALTER TABLE "claim_payments"
  ALTER COLUMN "amount" TYPE bigint USING ROUND("amount"::numeric * 100000)::bigint;

ALTER TABLE "expenses"
  ALTER COLUMN "amount" TYPE bigint USING ROUND("amount"::numeric * 100000)::bigint;
