import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";

const migrationDirectory = resolve("supabase/migrations");
const migrationFiles = (await readdir(migrationDirectory))
  .filter((file) => file.endsWith(".sql"))
  .sort();
const schema = (
  await Promise.all(
    migrationFiles.map((file) =>
      readFile(resolve(migrationDirectory, file), "utf8"),
    ),
  )
).join("\n");

const tables = [
  ...schema.matchAll(
    /create\s+table\s+(?:if\s+not\s+exists\s+)?public\.("?[\w]+"?)/gi,
  ),
].map((match) => match[1].replaceAll('"', "").toLowerCase());
const uniqueTables = [...new Set(tables)].sort();
const missingRls = uniqueTables.filter((table) => {
  const escaped = table.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return !new RegExp(
    `alter\\s+table\\s+(?:if\\s+exists\\s+)?public\\."?${escaped}"?\\s+enable\\s+row\\s+level\\s+security`,
    "i",
  ).test(schema);
});

if (missingRls.length) {
  console.error(
    `RLS audit failed. Public tables without an enable statement: ${missingRls.join(", ")}`,
  );
  process.exit(1);
}

console.log(
  `RLS audit passed for ${uniqueTables.length} public tables across ${migrationFiles.length} migrations.`,
);
