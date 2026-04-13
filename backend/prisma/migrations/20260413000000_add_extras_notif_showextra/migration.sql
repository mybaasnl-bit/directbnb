-- Add showExtraServices to properties
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "showExtraServices" BOOLEAN NOT NULL DEFAULT false;

-- Add notificationPreferences to users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "notificationPreferences" JSONB NOT NULL DEFAULT '{}';

-- Create property_extras table
CREATE TABLE IF NOT EXISTS "property_extras" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "pricePer" TEXT NOT NULL DEFAULT 'STAY',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "property_extras_pkey" PRIMARY KEY ("id")
);

-- Add foreign key
ALTER TABLE "property_extras" ADD CONSTRAINT "property_extras_propertyId_fkey"
    FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add indexes
CREATE INDEX IF NOT EXISTS "property_extras_propertyId_idx" ON "property_extras"("propertyId");
