-- CreateTable
CREATE TABLE "PdfGeneration" (
    "id" TEXT NOT NULL,
    "inspectionId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PdfGeneration_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PdfGeneration" ADD CONSTRAINT "PdfGeneration_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "Inspection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
