# Backup and recovery

Export a JSON backup from **Account → Privacy & Data → Export data**. Validate it before archiving:

```bash
npm run backup:validate -- ~/Downloads/aniverse-backup-YYYY-MM-DD.json
```

Restore through **Restore backup** on the same account screen, then reload. The import is additive and preserves records not present in the backup. Browser-local video blobs depend on browser export support; keep original creator media files separately.

For full removal, use **Delete account data**. This clears AniVerse IndexedDB and all `aniverse.*` local-storage keys after confirmation.
