import { describe, expect, it } from "vitest";
import { mergeLibraries, normalizeLibrary, reduceLibrary, type LibrarySnapshot } from "./library";

const empty: LibrarySnapshot = { progress: [], favorites: [], watchlist: [], lists: [] };

describe("library state", () => {
  it("normalizes legacy browser libraries", () => {
    expect(normalizeLibrary({ favorites: ["a", "a"], lists: [{ id: "1", name: "List", titles: ["a"] } as never] })).toMatchObject({ favorites: ["a"], watchlist: [], lists: [{ position: 0, isPublic: false }] });
  });
  it("merges saved titles, same-named lists, and newest progress", () => {
    const older = { slug: "a", title: "A", episode: 1, position: 10, duration: 100, watchedAt: "2026-01-01T00:00:00Z" };
    const newer = { ...older, position: 50, watchedAt: "2026-01-02T00:00:00Z" };
    const merged = mergeLibraries({ ...empty, progress: [older], favorites: ["a"], lists: [{ id: "cloud", name: "Later", titles: ["a"], position: 0, isPublic: false }] }, { ...empty, progress: [newer], watchlist: ["b"], lists: [{ id: "local", name: "later", titles: ["b"], position: 0, isPublic: false }] });
    expect(merged.progress[0].position).toBe(50);
    expect(merged.lists[0].titles).toEqual(["a", "b"]);
    expect(merged.watchlist).toEqual(["b"]);
  });
  it("applies watchlist and list actions without duplicates", () => {
    const watched = reduceLibrary(empty, { type: "toggle-watchlist", slug: "a" });
    const withList = reduceLibrary({ ...watched, lists: [{ id: "1", name: "One", titles: [], position: 0, isPublic: false }] }, { type: "add-to-list", listId: "1", slug: "a" });
    expect(withList.watchlist).toEqual(["a"]);
    expect(reduceLibrary(withList, { type: "add-to-list", listId: "1", slug: "a" }).lists[0].titles).toEqual(["a"]);
  });
});
