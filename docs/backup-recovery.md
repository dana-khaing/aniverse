# Backup and recovery

Export a JSON backup from **Account → Privacy & Data → Export data**. Validate it before archiving:

```bash
pnpm backup:validate -- ~/Downloads/aniverse-backup-YYYY-MM-DD.json
```

Restore through **Restore backup** on the same account screen, then reload. The import is additive and preserves records not present in the backup. Browser-local video blobs depend on browser export support; keep original creator media files separately.

For full removal, use **Delete account data**. This clears AniVerse IndexedDB and all `aniverse.*` local-storage keys after confirmation.

## Automated recovery drill

Run `pnpm backup:drill` to encrypt, checksum, tamper-test, decrypt, and compare a
representative account backup. It writes machine-readable evidence to
`.artifacts/account-backup-drill.json`, including recovery time and recovery
point. CI runs this drill weekly and retains the report.

## Database restore drill

Use a disposable database with a name containing `drill`, `restore`, or `test`.
The command refuses to run if the source and target URLs match and requires an
explicit destructive-operation flag:

```bash
ALLOW_BACKUP_RESTORE_DRILL=true \
BACKUP_SOURCE_DATABASE_URL='postgresql://…/aniverse' \
BACKUP_DRILL_DATABASE_URL='postgresql://…/aniverse_restore_drill' \
pnpm backup:drill:database
```

The drill creates a custom-format dump, restores it with ownership and ACLs
excluded, verifies migration and profile queries, records recovery time, and
deletes the temporary archive. Never point the target at production. Run this
after schema changes and at least monthly; retain the report with the deployment
SHA and investigate any RTO above the operational target.
