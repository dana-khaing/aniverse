"use client";

import { useEffect } from "react";
import { migrateLegacyLocalStorage } from "@/lib/local-data/database";

export function LocalDataProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    void migrateLegacyLocalStorage().catch((error: unknown) => {
      console.warn("AniVerse could not migrate legacy local data", error);
    });
  }, []);
  return children;
}
