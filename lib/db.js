import { randomUUID } from "node:crypto";
import { PrismaPostgresAdapter } from "@prisma/adapter-ppg";
import { PrismaClient } from "@prisma/client";
import { defaultBranches, defaultDrivers, defaultVehicles } from "./default-data";
import { normalizeList, normalizeText, toTitleCase } from "./text";

function getPrisma() {
  if (!globalThis.__lichXePrisma) {
    globalThis.__lichXePrisma = new PrismaClient({
      adapter: new PrismaPostgresAdapter({ connectionString: getDatabaseUrl() }),
      transactionOptions: {
        maxWait: 10000,
        timeout: 20000
      }
    });
  }
  return globalThis.__lichXePrisma;
}

function getDatabaseUrl() {
  const rawUrl = [process.env.PRISMA_DATABASE_URL, process.env.POSTGRES_URL, process.env.DATABASE_URL].find((value) =>
    value ? /^postgres(ql)?:\/\//.test(value) : false
  );
  if (!rawUrl) throw new Error("Missing DATABASE_URL, PRISMA_DATABASE_URL, or POSTGRES_URL.");

  const parsed = new URL(rawUrl);
  if (!parsed.searchParams.has("schema")) {
    parsed.searchParams.set("schema", process.env.DATABASE_SCHEMA || "lich_xe");
  }
  return parsed.toString();
}

let seedPromise;

async function ensureSeeded() {
  if (!seedPromise) seedPromise = seedDefaults();
  return seedPromise;
}

async function seedDefaults() {
  const prisma = getPrisma();

  await prisma.branch.createMany({
    data: normalizeList(defaultBranches).map((name) => ({ name: toTitleCase(name) })),
    skipDuplicates: true
  });
  await prisma.driver.createMany({
    data: normalizeList(defaultDrivers).map((name) => ({ name: toTitleCase(name) })),
    skipDuplicates: true
  });
  await prisma.vehicle.createMany({
    data: normalizeList(defaultVehicles).map((name) => ({ name: String(name).trim().toLocaleUpperCase("vi") })),
    skipDuplicates: true
  });

  const routeCount = await prisma.route.count();
  if (routeCount > 0) return;

  const starterRoutes = [
    {
      date: "2026-07-09",
      branches: ["Trà Ôn", "Tiểu Cần", "Trà Vinh"],
      drivers: ["Thành", "Tuấn"],
      vehicle: "DOTHANH"
    },
    {
      date: "2026-07-09",
      branches: ["Cờ Đỏ", "Vị Thanh", "Một Ngàn", "Thới Lai", "Ô Môn", "Thốt Nốt"],
      drivers: ["Nhựt", "Khải"],
      vehicle: "HINO"
    },
    {
      date: "2026-07-09",
      branches: ["Ba Chúc"],
      drivers: ["Khang", "Nghị"],
      vehicle: "SU LỚN"
    },
    {
      date: "2026-07-09",
      branches: ["Cần Thơ", "Phong Điền"],
      drivers: ["Vinh", "Vương"],
      vehicle: "SU NHỎ"
    },
    {
      date: "2026-07-09",
      branches: ["Trung An", "Lấp Vò"],
      drivers: ["Phương", "Phát"],
      vehicle: "KIA"
    }
  ];

  for (const [index, route] of starterRoutes.entries()) {
    const branches = normalizeList(route.branches).map(toTitleCase);
    const drivers = normalizeList(route.drivers).map(toTitleCase);
    await prisma.route.create({
      data: {
        id: randomUUID(),
        date: route.date,
        title: branches.join(" - "),
        vehicle: route.vehicle,
        sortOrder: BigInt(Date.now() + index),
        branches: {
          create: branches.map((name, position) => ({ name, position }))
        },
        drivers: {
          create: drivers.map((name, position) => ({ name, position }))
        }
      }
    });
  }
}

export async function getState(date) {
  await ensureSeeded();
  const [catalog, routes] = await Promise.all([getCatalogRows(), getRoutesForDate(date)]);

  return {
    ...catalog,
    routes
  };
}

export async function getCatalog() {
  await ensureSeeded();
  return getCatalogRows();
}

async function getCatalogRows() {
  const rows = await getPrisma().$queryRaw`
    SELECT 'branch' AS kind, name FROM lich_xe.branches
    UNION ALL
    SELECT 'driver' AS kind, name FROM lich_xe.drivers
    UNION ALL
    SELECT 'vehicle' AS kind, name FROM lich_xe.vehicles
    ORDER BY kind ASC, name ASC
  `;

  return {
    branches: rows.filter((row) => row.kind === "branch").map((row) => row.name),
    drivers: rows.filter((row) => row.kind === "driver").map((row) => row.name),
    vehicles: rows.filter((row) => row.kind === "vehicle").map((row) => row.name)
  };
}

export async function getRoutes(date) {
  await ensureSeeded();
  return getRoutesForDate(date);
}

async function getRoutesForDate(date) {
  const rows = await getPrisma().$queryRaw`
    SELECT
      r.id,
      r.date,
      r.title,
      r.vehicle,
      r.sort_order AS "sortOrder",
      COALESCE(
        (
          SELECT json_agg(rb.name ORDER BY rb.position)
          FROM lich_xe.route_branches rb
          WHERE rb.route_id = r.id
        ),
        '[]'::json
      ) AS branches,
      COALESCE(
        (
          SELECT json_agg(rd.name ORDER BY rd.position)
          FROM lich_xe.route_drivers rd
          WHERE rd.route_id = r.id
        ),
        '[]'::json
      ) AS drivers
    FROM lich_xe.routes r
    WHERE r.date = ${date}
    ORDER BY r.sort_order ASC
  `;

  return rows.map(mapRouteRow);
}

export async function saveRoute(route) {
  await ensureSeeded();
  return getPrisma().$transaction((tx) => saveRouteWithClient(tx, route));
}

async function saveRouteWithClient(client, route) {
  const id = route.id || randomUUID();
  const branches = normalizeList(route.branches || []).map(toTitleCase);
  const drivers = normalizeList(route.drivers || route.driverIds || []).map(toTitleCase);
  const vehicle = String(route.vehicle || route.vehicleId || "").trim().toLocaleUpperCase("vi");
  const title = branches.join(" - ") || "Tuyến mới";
  const sortOrder = BigInt(Number(route.sortOrder || Date.now()));

  await client.route.upsert({
    where: { id },
    update: {
      date: route.date,
      title,
      vehicle,
      sortOrder
    },
    create: {
      id,
      date: route.date,
      title,
      vehicle,
      sortOrder
    }
  });

  await client.routeBranch.deleteMany({ where: { routeId: id } });
  await client.routeDriver.deleteMany({ where: { routeId: id } });

  if (branches.length) {
    await client.routeBranch.createMany({
      data: branches.map((name, position) => ({ routeId: id, name, position }))
    });
  }
  if (drivers.length) {
    await client.routeDriver.createMany({
      data: drivers.map((name, position) => ({ routeId: id, name, position }))
    });
  }

  await ensureCatalogBatch(client, { branches, drivers, vehicles: vehicle ? [vehicle] : [] });

  return getRouteById(client, id);
}

export async function deleteRoute(id) {
  await ensureSeeded();
  await getPrisma().route.deleteMany({ where: { id } });
}

export async function reorderRoutes(date, orderedIds) {
  await ensureSeeded();
  const now = Date.now();
  await getPrisma().$transaction(
    orderedIds.map((id, index) =>
      getPrisma().route.updateMany({
        where: { id, date },
        data: { sortOrder: BigInt(now + index) }
      })
    )
  );
}

export async function reorderRouteBranches(routeId, branches) {
  await ensureSeeded();
  return getPrisma().$transaction(async (tx) => {
    const route = await tx.route.findUnique({
      where: { id: routeId },
      include: {
        drivers: { orderBy: { position: "asc" } }
      }
    });
    if (!route) return null;

    return saveRouteWithClient(tx, {
      id: routeId,
      date: route.date,
      vehicle: route.vehicle,
      sortOrder: Number(route.sortOrder),
      branches,
      drivers: route.drivers.map((driver) => driver.name)
    });
  });
}

export async function addBranch(name) {
  await ensureSeeded();
  await ensureBranch(getPrisma(), name);
}

export async function addBranches(names) {
  await ensureSeeded();
  await ensureCatalogBatch(getPrisma(), {
    branches: normalizeList(names).map(toTitleCase)
  });
}

async function ensureCatalogBatch(client, { branches = [], drivers = [], vehicles = [] }) {
  const cleanBranches = normalizeList(branches).map(toTitleCase).filter(Boolean);
  const cleanDrivers = normalizeList(drivers).map(toTitleCase).filter(Boolean);
  const cleanVehicles = normalizeList(vehicles).map((name) => String(name).trim().toLocaleUpperCase("vi")).filter(Boolean);

  await Promise.all([
    cleanBranches.length
      ? client.branch.createMany({
          data: cleanBranches.map((name) => ({ name })),
          skipDuplicates: true
        })
      : Promise.resolve(),
    cleanDrivers.length
      ? client.driver.createMany({
          data: cleanDrivers.map((name) => ({ name })),
          skipDuplicates: true
        })
      : Promise.resolve(),
    cleanVehicles.length
      ? client.vehicle.createMany({
          data: cleanVehicles.map((name) => ({ name })),
          skipDuplicates: true
        })
      : Promise.resolve()
  ]);
}

export async function renameBranch(oldName, nextName) {
  await ensureSeeded();
  const prisma = getPrisma();
  const clean = toTitleCase(nextName);
  if (!clean) throw new Error("Tên chi nhánh không được để trống.");

  await prisma.$transaction(async (tx) => {
    const [oldBranch, targetBranch, affectedRows] = await Promise.all([
      tx.branch.findFirst({ where: { name: { equals: oldName, mode: "insensitive" } } }),
      tx.branch.findFirst({ where: { name: { equals: clean, mode: "insensitive" } } }),
      tx.routeBranch.findMany({
        where: { name: { equals: oldName, mode: "insensitive" } },
        distinct: ["routeId"],
        select: { routeId: true }
      })
    ]);

    if (oldBranch && targetBranch && oldBranch.id !== targetBranch.id) {
      await tx.branch.delete({ where: { id: oldBranch.id } });
    } else if (oldBranch) {
      await tx.branch.update({ where: { id: oldBranch.id }, data: { name: clean } });
    } else if (!targetBranch) {
      await tx.branch.create({ data: { name: clean } });
    }

    await tx.routeBranch.updateMany({
      where: { name: { equals: oldName, mode: "insensitive" } },
      data: { name: clean }
    });

    for (const row of affectedRows) {
      await refreshRouteTitle(tx, row.routeId);
    }
  });

  return { name: clean };
}

export async function deleteBranch(name) {
  await ensureSeeded();
  await getPrisma().branch.deleteMany({ where: { name: { equals: name, mode: "insensitive" } } });
}

export async function findBranchUsage(name) {
  await ensureSeeded();
  const rows = await getPrisma().routeBranch.findMany({
    where: { name: { equals: name, mode: "insensitive" } },
    distinct: ["routeId"],
    select: { routeId: true }
  });
  return rows.length;
}

async function ensureBranch(client, name) {
  const clean = toTitleCase(name);
  if (!clean) return;
  const existing = await client.branch.findFirst({ where: { name: { equals: clean, mode: "insensitive" } } });
  if (!existing) await client.branch.create({ data: { name: clean } });
}

async function ensureDriver(client, name) {
  const clean = toTitleCase(name);
  if (!clean) return;
  const existing = await client.driver.findFirst({ where: { name: { equals: clean, mode: "insensitive" } } });
  if (!existing) await client.driver.create({ data: { name: clean } });
}

async function ensureVehicle(client, name) {
  const clean = String(name || "").trim().toLocaleUpperCase("vi");
  if (!clean) return;
  const existing = await client.vehicle.findFirst({ where: { name: { equals: clean, mode: "insensitive" } } });
  if (!existing) await client.vehicle.create({ data: { name: clean } });
}

async function refreshRouteTitle(client, routeId) {
  const branches = await client.routeBranch.findMany({
    where: { routeId },
    orderBy: { position: "asc" },
    select: { name: true }
  });
  await client.route.update({
    where: { id: routeId },
    data: { title: branches.map((branch) => branch.name).join(" - ") || "Tuyến mới" }
  });
}

async function getRouteById(client, id) {
  const route = await client.route.findUnique({
    where: { id },
    include: routeIncludes()
  });
  return route ? mapRoute(route) : null;
}

function routeIncludes() {
  return {
    branches: { orderBy: { position: "asc" } },
    drivers: { orderBy: { position: "asc" } }
  };
}

function mapRoute(route) {
  return {
    id: route.id,
    date: route.date,
    title: route.title,
    vehicle: route.vehicle,
    sortOrder: Number(route.sortOrder),
    branches: route.branches.map((branch) => branch.name),
    driverIds: route.drivers.map((driver) => driver.name),
    vehicleId: route.vehicle
  };
}

function mapRouteRow(route) {
  const branches = parseJsonArray(route.branches);
  const drivers = parseJsonArray(route.drivers);
  return {
    id: route.id,
    date: route.date,
    title: route.title,
    vehicle: route.vehicle,
    sortOrder: Number(route.sortOrder),
    branches,
    driverIds: drivers,
    vehicleId: route.vehicle
  };
}

function parseJsonArray(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

export const dbPath = "Prisma Postgres";
