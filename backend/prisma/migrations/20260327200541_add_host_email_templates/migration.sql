-- CreateTable
CREATE TABLE "host_email_templates" (
    "id" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "templateName" TEXT NOT NULL,
    "subjectNl" TEXT NOT NULL,
    "subjectEn" TEXT NOT NULL,
    "htmlNl" TEXT NOT NULL,
    "htmlEn" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "host_email_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "host_email_templates_hostId_idx" ON "host_email_templates"("hostId");

-- CreateIndex
CREATE UNIQUE INDEX "host_email_templates_hostId_templateName_key" ON "host_email_templates"("hostId", "templateName");

-- AddForeignKey
ALTER TABLE "host_email_templates" ADD CONSTRAINT "host_email_templates_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
