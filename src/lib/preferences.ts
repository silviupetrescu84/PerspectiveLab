import { categoriesBySlug, situationsById } from './catalog';
import { isBeliefRating, isInterpretationKey, type InitialInterpretation } from './interpretation';

export const STORAGE_KEY = 'perspective-lab:v1';

interface Preferences {
  saved: string[];
  lastViewed: Record<string, string>;
  searchQuery: string;
  customDraft: string;
  interpretations: Record<string, InitialInterpretation>;
}

const EMPTY_INTERPRETATION: Readonly<InitialInterpretation> = { text: '', belief: null };

function readPreferences(storage: Storage | undefined): Preferences {
  const preferences: Preferences = { saved: [], lastViewed: {}, searchQuery: '', customDraft: '', interpretations: {} };
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    if (!raw) return preferences;
    const data = JSON.parse(raw);
    if (typeof data?.searchQuery === 'string') preferences.searchQuery = data.searchQuery;
    if (typeof data?.customDraft === 'string') preferences.customDraft = data.customDraft;
    if (data?.interpretations && typeof data.interpretations === 'object') {
      for (const [key, value] of Object.entries(data.interpretations)) {
        if (!isInterpretationKey(key) || !value || typeof value !== 'object') continue;
        const stored = value as { text?: unknown; belief?: unknown };
        const text = typeof stored.text === 'string' ? stored.text : '';
        const belief = isBeliefRating(stored.belief) ? stored.belief : null;
        if (text || belief !== null) preferences.interpretations[key] = { text, belief };
      }
    }
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
    searchQuery: () => preferences.searchQuery,
    customDraft: () => preferences.customDraft,
    interpretation(key: string): InitialInterpretation {
      const value = isInterpretationKey(key) ? preferences.interpretations[key] : undefined;
      return { ...(value ?? EMPTY_INTERPRETATION) };
    },
    setInterpretation(key: string, update: Partial<InitialInterpretation>) {
      if (!isInterpretationKey(key)) return;
      refresh();
      const previous = preferences.interpretations[key] ?? EMPTY_INTERPRETATION;
      const text = typeof update.text === 'string' ? update.text : previous.text;
      const belief = update.belief === null || isBeliefRating(update.belief) ? update.belief : previous.belief;
      if (text === previous.text && belief === previous.belief) return;
      if (!text && belief === null) delete preferences.interpretations[key];
      else preferences.interpretations[key] = { text, belief };
      write();
    },
    setSearchQuery(query: string) {
      refresh();
      if (preferences.searchQuery === query) return;
      preferences.searchQuery = query;
      write();
    },
    setCustomDraft(draft: string) {
      refresh();
      if (preferences.customDraft === draft) return;
      preferences.customDraft = draft;
      write();
    },
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
