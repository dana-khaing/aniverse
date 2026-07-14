import type { BackupManifest, StoredMedia } from "./types";

export const DATABASE_NAME = "aniverse-local";
export const DATABASE_VERSION = 1;

export const STORE_NAMES = [
  "settings",
  "media",
  "renditions",
  "audioTracks",
  "subtitleTracks",
  "chapters",
  "playbackEvents",
  "profiles",
  "releases",
  "parties",
] as const;

export type StoreName = (typeof STORE_NAMES)[number];

let databasePromise: Promise<IDBDatabase> | undefined;

function requestResult<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed"));
  });
}

export function openAniVerseDatabase() {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB is unavailable in this environment"));
  }
  databasePromise ??= new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      for (const store of STORE_NAMES) {
        if (!database.objectStoreNames.contains(store)) database.createObjectStore(store, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open AniVerse storage"));
  });
  return databasePromise;
}

export async function putRecord<T>(storeName: StoreName, record: T) {
  const database = await openAniVerseDatabase();
  const transaction = database.transaction(storeName, "readwrite");
  await requestResult(transaction.objectStore(storeName).put(record));
}

export async function getRecord<T>(storeName: StoreName, id: string) {
  const database = await openAniVerseDatabase();
  const transaction = database.transaction(storeName, "readonly");
  return requestResult(transaction.objectStore(storeName).get(id)) as Promise<T | undefined>;
}

export async function getAllRecords<T>(storeName: StoreName) {
  const database = await openAniVerseDatabase();
  const transaction = database.transaction(storeName, "readonly");
  return requestResult(transaction.objectStore(storeName).getAll()) as Promise<T[]>;
}

export async function deleteRecord(storeName: StoreName, id: string) {
  const database = await openAniVerseDatabase();
  const transaction = database.transaction(storeName, "readwrite");
  await requestResult(transaction.objectStore(storeName).delete(id));
}

export async function storeMedia(file: File, metadata: Omit<StoredMedia, "id" | "filename" | "mimeType" | "size" | "createdAt" | "blob">) {
  const media: StoredMedia = {
    ...metadata,
    id: crypto.randomUUID(),
    filename: file.name,
    mimeType: file.type || "application/octet-stream",
    size: file.size,
    createdAt: new Date().toISOString(),
    blob: file,
  };
  await putRecord("media", media);
  return media;
}

export async function exportLocalData() {
  const data: Record<string, unknown[]> = {};
  const records: Record<string, number> = {};
  for (const store of STORE_NAMES) {
    const values = await getAllRecords<unknown>(store);
    data[store] = values;
    records[store] = values.length;
  }
  const manifest: BackupManifest = {
    format: "aniverse-backup",
    version: 1,
    createdAt: new Date().toISOString(),
    databaseVersion: DATABASE_VERSION,
    records,
  };
  return { manifest, data };
}

export async function migrateLegacyLocalStorage() {
  if (typeof window === "undefined") return false;
  const marker = await getRecord<{ id: string; value: boolean }>("settings", "legacy-migration-v1");
  if (marker?.value) return false;
  const legacyKeys = ["aniverse.creator-application", "aniverse.creator-workspace", "aniverse.library", "aniverse.community", "aniverse.moderation"];
  for (const key of legacyKeys) {
    const value = window.localStorage.getItem(key);
    if (!value) continue;
    try {
      await putRecord("settings", { id: `legacy:${key}`, value: JSON.parse(value) });
    } catch {
      await putRecord("settings", { id: `legacy:${key}`, value });
    }
  }
  await putRecord("settings", { id: "legacy-migration-v1", value: true, migratedAt: new Date().toISOString() });
  return true;
}

export function resetDatabaseConnectionForTests() {
  databasePromise = undefined;
}
