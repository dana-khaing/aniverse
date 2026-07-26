import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { performance } from "node:perf_hooks";

const source = process.env.BACKUP_SOURCE_DATABASE_URL;
const target = process.env.BACKUP_DRILL_DATABASE_URL;
if (process.env.ALLOW_BACKUP_RESTORE_DRILL !== "true" || !source || !target) {
  console.error(
    "Set ALLOW_BACKUP_RESTORE_DRILL=true, BACKUP_SOURCE_DATABASE_URL, and BACKUP_DRILL_DATABASE_URL.",
  );
  process.exit(2);
}
if (source === target) {
  console.error("Restore target must never equal the backup source.");
  process.exit(2);
}
const targetUrl = new URL(target);
if (!/(drill|restore|test)/i.test(targetUrl.pathname)) {
  console.error("Restore database name must contain drill, restore, or test.");
  process.exit(2);
}

const directory = mkdtempSync(join(tmpdir(), "aniverse-restore-"));
const archive = join(directory, "aniverse.dump");
const run = (command, args) => {
  const result = spawnSync(command, args, { stdio: "inherit" });
  if (result.status !== 0) throw new Error(`${command} failed`);
};
const started = performance.now();
try {
  run("pg_dump", [
    "--format=custom",
    "--no-owner",
    "--no-acl",
    "--file",
    archive,
    source,
  ]);
  run("pg_restore", [
    "--clean",
    "--if-exists",
    "--no-owner",
    "--no-acl",
    "--dbname",
    target,
    archive,
  ]);
  run("psql", [
    target,
    "--set",
    "ON_ERROR_STOP=1",
    "--command",
    "select count(*) as migration_count from supabase_migrations.schema_migrations; select count(*) as profile_count from public.profiles;",
  ]);
  console.log(
    JSON.stringify(
      {
        drill: "postgres-restore",
        status: "passed",
        targetHost: targetUrl.hostname,
        targetDatabase: targetUrl.pathname.slice(1),
        recoveryTimeMs: Number((performance.now() - started).toFixed(2)),
        completedAt: new Date().toISOString(),
      },
      null,
      2,
    ),
  );
} finally {
  rmSync(directory, { recursive: true, force: true });
}
