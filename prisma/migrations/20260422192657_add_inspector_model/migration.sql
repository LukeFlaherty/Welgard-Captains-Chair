-- AlterTable
ALTER TABLE "Inspection" ADD COLUMN     "inspectorId" TEXT;

-- CreateTable
CREATE TABLE "Inspector" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "company" TEXT,
    "licenseNumber" TEXT,
    "licenseStates" TEXT[],
    "certifications" TEXT[],
    "yearsExperience" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'active',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inspector_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_inspectorId_fkey" FOREIGN KEY ("inspectorId") REFERENCES "Inspector"("id") ON DELETE SET NULL ON UPDATE CASCADE;
