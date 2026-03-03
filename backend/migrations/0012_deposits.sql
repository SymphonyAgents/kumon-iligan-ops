CREATE TABLE "deposits" (
  "id" serial PRIMARY KEY NOT NULL,
  "year" integer NOT NULL,
  "month" integer NOT NULL,
  "method" varchar(50) NOT NULL,
  "amount" bigint DEFAULT 0 NOT NULL,
  "branch_id" integer REFERENCES "branches"("id") ON DELETE cascade,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
