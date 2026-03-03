CREATE TABLE "branches" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"address" varchar(500),
	"phone" varchar(50),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "branches_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" serial PRIMARY KEY NOT NULL,
	"phone" varchar(50) NOT NULL,
	"name" varchar(255),
	"email" varchar(255),
	"city" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "customers_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
CREATE TABLE "deposits" (
	"id" serial PRIMARY KEY NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"method" varchar(50) NOT NULL,
	"amount" bigint DEFAULT 0 NOT NULL,
	"branch_id" integer,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "claim_payments" ALTER COLUMN "amount" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "expenses" ALTER COLUMN "amount" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "services" ALTER COLUMN "price" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "transaction_items" ALTER COLUMN "price" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "total" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "total" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "paid" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "paid" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "audit_log" ADD COLUMN "audit_type" varchar(100);--> statement-breakpoint
ALTER TABLE "audit_log" ADD COLUMN "branch_id" integer;--> statement-breakpoint
ALTER TABLE "claim_payments" ADD COLUMN "reference_number" varchar(100);--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "method" varchar(50);--> statement-breakpoint
ALTER TABLE "transaction_items" ADD COLUMN "addon_service_ids" jsonb;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "new_pickup_date" date;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "branch_id" integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "branch_id" integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "deposits" ADD CONSTRAINT "deposits_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE set null ON UPDATE no action;