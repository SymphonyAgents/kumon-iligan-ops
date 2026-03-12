-- customers: remove barangay and province fields (simplified address — street + city only)
ALTER TABLE "customers" DROP COLUMN IF EXISTS "barangay";
ALTER TABLE "customers" DROP COLUMN IF EXISTS "province";
