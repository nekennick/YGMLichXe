-- CreateTable
CREATE TABLE "branches" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drivers" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "drivers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routes" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "vehicle" TEXT NOT NULL,
    "sort_order" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "route_branches" (
    "id" SERIAL NOT NULL,
    "route_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "route_branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "route_drivers" (
    "id" SERIAL NOT NULL,
    "route_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "route_drivers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "branches_name_key" ON "branches"("name");

-- CreateIndex
CREATE UNIQUE INDEX "drivers_name_key" ON "drivers"("name");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_name_key" ON "vehicles"("name");

-- CreateIndex
CREATE INDEX "routes_date_sort_order_idx" ON "routes"("date", "sort_order");

-- CreateIndex
CREATE INDEX "route_branches_route_id_position_idx" ON "route_branches"("route_id", "position");

-- CreateIndex
CREATE INDEX "route_drivers_route_id_position_idx" ON "route_drivers"("route_id", "position");

-- AddForeignKey
ALTER TABLE "route_branches" ADD CONSTRAINT "route_branches_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_drivers" ADD CONSTRAINT "route_drivers_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
