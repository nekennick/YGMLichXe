import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { defaultBranches, defaultDrivers, defaultVehicles } from "./default-data";
import { normalizeList, normalizeText, toTitleCase } from "./text";

const dbPath = path.join(process.cwd(), "data", "lich-xe.sqlite");

function getDatabase() {
  if (globalThis.__lichXeDb) return globalThis.__lichXeDb;

  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new DatabaseSync(dbPath);
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = ON");
  globalThis.__lichXeDb = db;
  initSchema(db);
  seedDefaults(db);
  return db;
}

function initSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS branches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE COLLATE NOCASE,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS drivers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE COLLATE NOCASE
    );

    CREATE TABLE IF NOT EXISTS vehicles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE COLLATE NOCASE
    );

    CREATE TABLE IF NOT EXISTS routes (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      title TEXT NOT NULL,
      vehicle TEXT NOT NULL,
      sort_order INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS route_branches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      route_id TEXT NOT NULL,
      name TEXT NOT NULL,
      position INTEGER NOT NULL,
      FOREIGN KEY(route_id) REFERENCES routes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS route_drivers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      route_id TEXT NOT NULL,
      name TEXT NOT NULL,
      position INTEGER NOT NULL,
      FOREIGN KEY(route_id) REFERENCES routes(id) ON DELETE CASCADE
    );
  `);
}

function seedDefaults(db) {
  const insertBranch = db.prepare("INSERT OR IGNORE INTO branches (name) VALUES (?)");
  const insertDriver = db.prepare("INSERT OR IGNORE INTO drivers (name) VALUES (?)");
  const insertVehicle = db.prepare("INSERT OR IGNORE INTO vehicles (name) VALUES (?)");

  normalizeList(defaultBranches).forEach((name) => insertBranch.run(name));
  normalizeList(defaultDrivers).forEach((name) => insertDriver.run(name));
  normalizeList(defaultVehicles).forEach((name) => insertVehicle.run(name));

  const routeCount = db.prepare("SELECT COUNT(*) AS count FROM routes").get().count;
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

  starterRoutes.forEach((route, index) =>
    saveRoute({
      ...route,
      id: randomUUID(),
      sortOrder: Date.now() + index
    })
  );
}

export function getState(date) {
  const db = getDatabase();
  return {
    branches: db.prepare("SELECT name FROM branches ORDER BY name COLLATE NOCASE").all().map((row) => row.name),
    drivers: db.prepare("SELECT name FROM drivers ORDER BY name COLLATE NOCASE").all().map((row) => row.name),
    vehicles: db.prepare("SELECT name FROM vehicles ORDER BY name COLLATE NOCASE").all().map((row) => row.name),
    routes: getRoutes(date)
  };
}

export function getRoutes(date) {
  const db = getDatabase();
  const routes = db
    .prepare("SELECT id, date, title, vehicle, sort_order AS sortOrder FROM routes WHERE date = ? ORDER BY sort_order")
    .all(date);
  const getBranches = db.prepare("SELECT name FROM route_branches WHERE route_id = ? ORDER BY position");
  const getDrivers = db.prepare("SELECT name FROM route_drivers WHERE route_id = ? ORDER BY position");

  return routes.map((route) => ({
    ...route,
    branches: getBranches.all(route.id).map((row) => row.name),
    driverIds: getDrivers.all(route.id).map((row) => row.name),
    vehicleId: route.vehicle
  }));
}

export function saveRoute(route) {
  const db = getDatabase();
  const id = route.id || randomUUID();
  const branches = normalizeList(route.branches || []).map(toTitleCase);
  const drivers = normalizeList(route.drivers || route.driverIds || []).map(toTitleCase);
  const vehicle = String(route.vehicle || route.vehicleId || "").trim();
  const title = branches.join(" - ") || "Tuyến mới";
  const sortOrder = Number(route.sortOrder || Date.now());

  db.exec("BEGIN");
  try {
    db.prepare(`
      INSERT INTO routes (id, date, title, vehicle, sort_order, updated_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        date = excluded.date,
        title = excluded.title,
        vehicle = excluded.vehicle,
        sort_order = excluded.sort_order,
        updated_at = CURRENT_TIMESTAMP
    `).run(id, route.date, title, vehicle, sortOrder);

    db.prepare("DELETE FROM route_branches WHERE route_id = ?").run(id);
    db.prepare("DELETE FROM route_drivers WHERE route_id = ?").run(id);

    const insertRouteBranch = db.prepare("INSERT INTO route_branches (route_id, name, position) VALUES (?, ?, ?)");
    branches.forEach((name, index) => {
      insertRouteBranch.run(id, name, index);
      addBranch(name);
    });

    const insertRouteDriver = db.prepare("INSERT INTO route_drivers (route_id, name, position) VALUES (?, ?, ?)");
    drivers.forEach((name, index) => {
      insertRouteDriver.run(id, name, index);
      addDriver(name);
    });

    if (vehicle) addVehicle(vehicle);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }

  return getRoutes(route.date).find((item) => item.id === id);
}

export function deleteRoute(id) {
  const db = getDatabase();
  db.prepare("DELETE FROM routes WHERE id = ?").run(id);
}

export function reorderRoutes(date, orderedIds) {
  const db = getDatabase();
  const update = db.prepare("UPDATE routes SET sort_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND date = ?");
  db.exec("BEGIN");
  try {
    orderedIds.forEach((id, index) => update.run(Date.now() + index, id, date));
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function reorderRouteBranches(routeId, branches) {
  const db = getDatabase();
  const route = db.prepare("SELECT date, vehicle, sort_order AS sortOrder FROM routes WHERE id = ?").get(routeId);
  if (!route) return null;
  const drivers = db.prepare("SELECT name FROM route_drivers WHERE route_id = ? ORDER BY position").all(routeId).map((row) => row.name);
  return saveRoute({
    id: routeId,
    date: route.date,
    vehicle: route.vehicle,
    sortOrder: route.sortOrder,
    branches,
    drivers
  });
}

export function addBranch(name) {
  const clean = toTitleCase(name);
  if (!clean) return;
  getDatabase().prepare("INSERT OR IGNORE INTO branches (name) VALUES (?)").run(clean);
}

export function addBranches(names) {
  normalizeList(names).forEach(addBranch);
}

export function renameBranch(oldName, nextName) {
  const db = getDatabase();
  const clean = toTitleCase(nextName);
  if (!clean) throw new Error("Tên chi nhánh không được để trống.");

  db.exec("BEGIN");
  try {
    db.prepare("UPDATE branches SET name = ? WHERE lower(name) = lower(?)").run(clean, oldName);
    db.prepare("UPDATE route_branches SET name = ? WHERE lower(name) = lower(?)").run(clean, oldName);
    db.prepare("UPDATE routes SET title = (SELECT group_concat(name, ' - ') FROM route_branches WHERE route_id = routes.id ORDER BY position)").run();
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function deleteBranch(name) {
  getDatabase().prepare("DELETE FROM branches WHERE lower(name) = lower(?)").run(name);
}

function addDriver(name) {
  const clean = toTitleCase(name);
  if (!clean) return;
  getDatabase().prepare("INSERT OR IGNORE INTO drivers (name) VALUES (?)").run(clean);
}

function addVehicle(name) {
  const clean = String(name || "").trim().toLocaleUpperCase("vi");
  if (!clean) return;
  getDatabase().prepare("INSERT OR IGNORE INTO vehicles (name) VALUES (?)").run(clean);
}

export function findBranchUsage(name) {
  return getDatabase()
    .prepare("SELECT COUNT(DISTINCT route_id) AS count FROM route_branches WHERE lower(name) = lower(?)")
    .get(name).count;
}

export { dbPath };
