-- Add worksheet fields to Inspection
ALTER TABLE "Inspection"
  ADD COLUMN "wellCompletionDate"        TEXT,
  ADD COLUMN "wellCompletionDateUnknown" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "wellPermit"                TEXT,
  ADD COLUMN "wellPermitUnknown"         BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "wellDataSource"            TEXT,
  ADD COLUMN "casingType"               TEXT,
  ADD COLUMN "casingSize"               TEXT,
  ADD COLUMN "distanceFromHouseFt"      DOUBLE PRECISION,
  ADD COLUMN "pumpManufacturer"         TEXT,
  ADD COLUMN "pumpHp"                   TEXT,
  ADD COLUMN "tankBrand"                TEXT,
  ADD COLUMN "tankModel"                TEXT,
  ADD COLUMN "tankSizeGal"              DOUBLE PRECISION,
  ADD COLUMN "psiSettings"              TEXT,
  ADD COLUMN "waterTreatment"           TEXT,
  ADD COLUMN "wireType"                 TEXT,
  ADD COLUMN "yieldTestType"            TEXT;

-- Add static water level to YieldTest
ALTER TABLE "YieldTest"
  ADD COLUMN "staticWaterLevelFt" DOUBLE PRECISION;
