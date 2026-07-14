"use client";

import { useCallback, useEffect, useState } from "react";
import { deleteRecord, getAllRecords, putRecord, type StoreName } from "./database";

export function useIndexedRecords<T extends { id: string }>(store: StoreName) {
  const [records, setRecords] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  const refresh = useCallback(async () => {
    try {
      setRecords(await getAllRecords<T>(store));
      setError(undefined);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Local storage failed");
    } finally {
      setLoading(false);
    }
  }, [store]);

  useEffect(() => { void refresh(); }, [refresh]);

  const save = useCallback(async (record: T) => {
    await putRecord(store, record);
    await refresh();
  }, [refresh, store]);

  const remove = useCallback(async (id: string) => {
    await deleteRecord(store, id);
    await refresh();
  }, [refresh, store]);

  return { records, loading, error, save, remove, refresh };
}

