-- AlterTable
ALTER TABLE "properties" ADD COLUMN     "amenities" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "cancellationPolicy" TEXT,
ADD COLUMN     "checkInTime" TEXT,
ADD COLUMN     "checkOutTime" TEXT,
ADD COLUMN     "childrenAllowed" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "petsAllowed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "smokingAllowed" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "rooms" ADD COLUMN     "bathrooms" INTEGER,
ADD COLUMN     "beds" INTEGER,
ADD COLUMN     "minStay" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "sqm" INTEGER;

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "bookingId" TEXT,
    "guestFirstName" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "cleanlinessRating" INTEGER,
    "locationRating" INTEGER,
    "valueRating" INTEGER,
    "comment" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "reviews_bookingId_key" ON "reviews"("bookingId");

-- CreateIndex
CREATE INDEX "reviews_propertyId_idx" ON "reviews"("propertyId");

-- CreateIndex
CREATE INDEX "reviews_isPublished_idx" ON "reviews"("isPublished");

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
