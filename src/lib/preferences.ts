import { categoriesBySlug, situationsById } from './catalog';

export const STORAGE_KEY = 'perspective-lab:v1';

interface Preferences {
  saved: string[];
  lastViewed: Record<string, string>;
}

function readPreferences(storage: Storage | undefined): Preferences {
  const preferences: Preferences = { saved: [], lastViewed: {} };
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    if (!raw) return preferences;
    const data = JSON.parse(raw);
    if (Array.isArray(data?.saved)) {
      preferences.saved = [...new Set<string>(data.saved.filter((id: unknown) =>
        typeof id === 'string' && situationsById.has(id)))];
    }
    if (data?.lastViewed && typeof data.lastViewed === 'object') {
      for (const [scope, id] of Object.entries(data.lastViewed)) {
        if (typeof id !== 'string') continue;
        const situation = situationsById.get(id);
        if (situation && (scope === 'all' || categoriesBySlug.get(scope)?.name === situation.category)) {
          preferences.lastViewed[scope] = id;
        }
      }
    }
  } catch {
    // Storage may be blocked, or previously stored data may be invalid.
  }
  return preferences;
}

export function createPreferences(storage?: Storage) {
  let preferences = readPreferences(storage);
  let canPersist = storage !== undefined;

  function refresh() {
    if (canPersist) preferences = readPreferences(storage);
  }

  function write() {
    if (!canPersist) return;
    try {
      storage?.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch {
      // Keep the current session usable when browser storage is unavailable.
      canPersist = false;
    }
  }

  return {
    savedIds: () => [...preferences.saved],
    isSaved: (id: string) => preferences.saved.includes(id),
    lastViewed: (scope: string) => preferences.lastViewed[scope],
    remember(scope: string, id: string) {
      refresh();
      if (preferences.lastViewed[scope] === id) return;
      preferences.lastViewed[scope] = id;
      write();
    },
    toggleSaved(id: string) {
      refresh();
      const alreadySaved = preferences.saved.includes(id);
      preferences.saved = alreadySaved
        ? preferences.saved.filter((savedId) => savedId !== id)
        : [id, ...preferences.saved];
      write();
      return !alreadySaved;
    },
    refresh,
  };
}

export function browserStorage(): Storage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}
