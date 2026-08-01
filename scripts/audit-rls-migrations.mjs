import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { auditRlsSchema } from "./lib/rls-audit.mjs";

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

const result = auditRlsSchema(schema);

if (result.findings.length) {
  console.error("Semantic RLS audit failed:");
  for (const finding of result.findings) {
    console.error(`- ${finding.rule}: ${finding.object}`);
  }
  process.exit(1);
}

console.log(
  `Semantic RLS audit passed for ${result.tables.length} public tables, ${result.views.length} public views, and ${result.definerFunctions.length} security-definer functions across ${migrationFiles.length} migrations.`,
);
