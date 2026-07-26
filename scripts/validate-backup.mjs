import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const path = process.argv[2];
if (!path) throw new Error("Usage: pnpm backup:validate -- <backup.json>");
const bytes = await readFile(path);
const backup = JSON.parse(bytes.toString());
if (
  backup.manifest?.format !== "aniverse-backup" ||
  backup.manifest?.version !== 1
)
  throw new Error("Invalid or unsupported AniVerse backup");
if (
  !backup.manifest.createdAt ||
  !Number.isFinite(Date.parse(backup.manifest.createdAt))
)
  throw new Error("Backup creation time is invalid");
if (!backup.data || typeof backup.data !== "object" || Array.isArray(backup.data))
  throw new Error("Backup data is missing");
const stores = Object.entries(backup.data);
if (!stores.every(([, records]) => Array.isArray(records)))
  throw new Error("Every backup store must contain a record array");
console.log(
  JSON.stringify({
    valid: true,
    createdAt: backup.manifest.createdAt,
    stores: stores.length,
    records: stores.reduce((total, [, records]) => total + records.length, 0),
    sha256: createHash("sha256").update(bytes).digest("hex"),
  }),
);
