-- CreateTable
CREATE TABLE "Member" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "serviceAddress" TEXT,
    "ghlContactId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "inspectorName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "licenseNumber" TEXT,
    "ghlReferenceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inspection" (
    "id" TEXT NOT NULL,
    "memberId" TEXT,
    "vendorId" TEXT,
    "homeownerName" TEXT NOT NULL,
    "homeownerEmail" TEXT,
    "homeownerPhone" TEXT,
    "propertyAddress" TEXT NOT NULL,
    "city" TEXT,
    "state" TEXT,
    "zip" TEXT,
    "inspectorName" TEXT,
    "inspectionCompany" TEXT,
    "inspectionDate" TIMESTAMP(3) NOT NULL,
    "wellType" TEXT,
    "wellDepthFt" DOUBLE PRECISION,
    "pumpType" TEXT,
    "pumpAgeYears" INTEGER,
    "pressureTankAgeYears" INTEGER,
    "casingCondition" TEXT,
    "wellCapCondition" TEXT,
    "wiringCondition" TEXT,
    "visibleLeaks" BOOLEAN NOT NULL DEFAULT false,
    "safetyIssues" BOOLEAN NOT NULL DEFAULT false,
    "contaminationRisk" BOOLEAN NOT NULL DEFAULT false,
    "systemOperational" BOOLEAN NOT NULL DEFAULT true,
    "pressureOk" BOOLEAN NOT NULL DEFAULT true,
    "flowOk" BOOLEAN NOT NULL DEFAULT true,
    "siteClearanceOk" BOOLEAN NOT NULL DEFAULT true,
    "inspectorNotes" TEXT,
    "internalReviewerNotes" TEXT,
    "requiredRepairs" TEXT,
    "recommendedRepairs" TEXT,
    "memberFacingSummary" TEXT,
    "systemScore" INTEGER,
    "systemStatus" TEXT NOT NULL DEFAULT 'green',
    "finalStatus" TEXT NOT NULL DEFAULT 'green',
    "overrideReason" TEXT,
    "statusRationale" TEXT[],
    "reportId" TEXT,
    "generatedPdfUrl" TEXT,
    "reportGeneratedAt" TIMESTAMP(3),
    "ghlContactId" TEXT,
    "ghlOpportunityId" TEXT,
    "ghlLocationId" TEXT,
    "ghlSyncStatus" TEXT NOT NULL DEFAULT 'pending',
    "lastSyncedAt" TIMESTAMP(3),
    "isDraft" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inspection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InspectionPhoto" (
    "id" TEXT NOT NULL,
    "inspectionId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "label" TEXT,
    "fileName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InspectionPhoto_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionPhoto" ADD CONSTRAINT "InspectionPhoto_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "Inspection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
