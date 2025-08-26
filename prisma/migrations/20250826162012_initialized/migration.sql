-- CreateEnum
CREATE TYPE "public"."ReviewStatus" AS ENUM ('REVIEWED', 'REVIEWING', 'NOT_REVIEWED');

-- CreateTable
CREATE TABLE "public"."Dictionary" (
    "id" SERIAL NOT NULL,
    "chinese" TEXT NOT NULL,
    "english" TEXT NOT NULL,
    "pinyin" TEXT NOT NULL,
    "phonetic" TEXT NOT NULL,
    "status" "public"."ReviewStatus" NOT NULL DEFAULT 'NOT_REVIEWED',

    CONSTRAINT "Dictionary_pkey" PRIMARY KEY ("id")
);
