ALTER TABLE "expenses" ADD COLUMN "source" varchar(20) DEFAULT 'pos' NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "note" varchar(1000);