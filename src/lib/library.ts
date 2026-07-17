export type WatchProgress = {
  slug: string;
  title: string;
  episode: number;
  position: number;
  duration: number;
  watchedAt: string;
  completed?: boolean;
};

export type CustomList = {
  id: string;
  name: string;
  titles: string[];
  position: number;
  isPublic: boolean;
};

export type LibrarySnapshot = {
  progress: WatchProgress[];
  favorites: string[];
  watchlist: string[];
  lists: CustomList[];
};

export type LibraryAction =
  | { type: "toggle-watchlist"; slug: string }
  | { type: "toggle-favorite"; slug: string }
  | { type: "save-progress"; progress: WatchProgress }
  | { type: "remove-history"; slug: string; episode: number }
  | { type: "create-list"; list: CustomList }
  | { type: "rename-list"; listId: string; name: string }
  | { type: "delete-list"; listId: string }
  | { type: "add-to-list"; listId: string; slug: string }
  | { type: "remove-from-list"; listId: string; slug: string };

const unique = (values: string[]) => Array.from(new Set(values));

export function normalizeLibrary(value: Partial<LibrarySnapshot> | undefined): LibrarySnapshot {
  return {
    progress: Array.isArray(value?.progress) ? value.progress : [],
    favorites: unique(Array.isArray(value?.favorites) ? value.favorites : []),
    watchlist: unique(Array.isArray(value?.watchlist) ? value.watchlist : []),
    lists: Array.isArray(value?.lists)
      ? value.lists.map((list, position) => ({
          id: list.id,
          name: list.name,
          titles: unique(list.titles),
          position: list.position ?? position,
          isPublic: list.isPublic ?? false,
        }))
      : [],
  };
}

export function mergeLibraries(cloud: LibrarySnapshot, local: LibrarySnapshot): LibrarySnapshot {
  const progress = new Map<string, WatchProgress>();
  for (const item of [...cloud.progress, ...local.progress]) {
    const key = `${item.slug}:${item.episode}`;
    const previous = progress.get(key);
    if (!previous || new Date(item.watchedAt) > new Date(previous.watchedAt)) progress.set(key, item);
  }
  const lists = cloud.lists.map((list) => ({ ...list, titles: [...list.titles] }));
  for (const localList of local.lists) {
    const match = lists.find((list) => list.name.toLocaleLowerCase() === localList.name.toLocaleLowerCase());
    if (match) match.titles = unique([...match.titles, ...localList.titles]);
    else lists.push({ ...localList, position: lists.length });
  }
  return normalizeLibrary({
    progress: [...progress.values()].sort((a, b) => b.watchedAt.localeCompare(a.watchedAt)),
    favorites: unique([...cloud.favorites, ...local.favorites]),
    watchlist: unique([...cloud.watchlist, ...local.watchlist]),
    lists,
  });
}

export function reduceLibrary(state: LibrarySnapshot, action: LibraryAction): LibrarySnapshot {
  const toggle = (values: string[], slug: string) => values.includes(slug) ? values.filter((item) => item !== slug) : [...values, slug];
  switch (action.type) {
    case "toggle-watchlist": return { ...state, watchlist: toggle(state.watchlist, action.slug) };
    case "toggle-favorite": return { ...state, favorites: toggle(state.favorites, action.slug) };
    case "save-progress": return { ...state, progress: [action.progress, ...state.progress.filter((item) => item.slug !== action.progress.slug || item.episode !== action.progress.episode)] };
    case "remove-history": return { ...state, progress: state.progress.filter((item) => item.slug !== action.slug || item.episode !== action.episode) };
    case "create-list": return { ...state, lists: [...state.lists, action.list] };
    case "rename-list": return { ...state, lists: state.lists.map((list) => list.id === action.listId ? { ...list, name: action.name } : list) };
    case "delete-list": return { ...state, lists: state.lists.filter((list) => list.id !== action.listId) };
    case "add-to-list": return { ...state, lists: state.lists.map((list) => list.id === action.listId ? { ...list, titles: unique([...list.titles, action.slug]) } : list) };
    case "remove-from-list": return { ...state, lists: state.lists.map((list) => list.id === action.listId ? { ...list, titles: list.titles.filter((slug) => slug !== action.slug) } : list) };
  }
}
