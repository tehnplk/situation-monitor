-- CreateTable
CREATE TABLE "provinces" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name_th" TEXT NOT NULL,
    "name_en" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "districts" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name_th" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "province_id" INTEGER NOT NULL,
    CONSTRAINT "districts_province_id_fkey" FOREIGN KEY ("province_id") REFERENCES "provinces" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sub_districts" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name_th" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "zip_code" INTEGER NOT NULL,
    "lat" REAL,
    "long" REAL,
    "district_id" INTEGER NOT NULL,
    CONSTRAINT "sub_districts_district_id_fkey" FOREIGN KEY ("district_id") REFERENCES "districts" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "districts_province_id_idx" ON "districts"("province_id");

-- CreateIndex
CREATE INDEX "sub_districts_district_id_idx" ON "sub_districts"("district_id");

-- CreateIndex
CREATE INDEX "sub_districts_zip_code_idx" ON "sub_districts"("zip_code");
