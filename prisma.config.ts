import { existsSync, readFileSync } from "node:fs";
import { defineConfig } from "prisma/config";

function loadEnvFile(path: string) {
  if (!existsSync(path)) return;

  const content = readFileSync(path, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) continue;

    const [, key, rawValue] = match;
    if (process.env[key]) continue;
    process.env[key] = rawValue.replace(/^["']|["']$/g, "");
  }
}

loadEnvFile(".env");
loadEnvFile(".env.local");

const rawDatabaseUrl = [process.env.PRISMA_DATABASE_URL, process.env.POSTGRES_URL, process.env.DATABASE_URL].find((value) =>
  value ? /^postgres(ql)?:\/\//.test(value) : false
);
const databaseSchema = process.env.DATABASE_SCHEMA || "lich_xe";

function databaseUrlWithSchema(url: string | undefined) {
  if (!url) return undefined;

  const parsed = new URL(url);
  if (!parsed.searchParams.has("schema")) {
    parsed.searchParams.set("schema", databaseSchema);
  }
  return parsed.toString();
}

const databaseUrl = databaseUrlWithSchema(rawDatabaseUrl);

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations"
  },
  datasource: {
    url: databaseUrl
  }
});
