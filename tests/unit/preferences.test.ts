import { expect, it, vi } from 'vitest';
import { createPreferences, STORAGE_KEY } from '../../src/lib/preferences';

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    get length() { return values.size; },
    clear: () => values.clear(),
    getItem: (key: string) => values.get(key) ?? null,
    key: (index: number) => [...values.keys()][index] ?? null,
    removeItem: (key: string) => values.delete(key),
    setItem: vi.fn((key: string, value: string) => { values.set(key, value); }),
  } satisfies Storage;
}

it('persists saved situations in most-recent order and returns a copy', () => {
  const storage = memoryStorage();
  const prefs = createPreferences(storage);
  expect(prefs.toggleSaved('situation-011')).toBe(true);
  expect(prefs.toggleSaved('situation-001')).toBe(true);
  prefs.savedIds().pop();
  const reopened = createPreferences(storage);
  expect(reopened.savedIds()).toEqual(['situation-001', 'situation-011']);
  expect(reopened.toggleSaved('situation-001')).toBe(false);
  expect(createPreferences(storage).savedIds()).toEqual(['situation-011']);
});

it('stores resume positions by scope and skips unchanged writes', () => {
  const storage = memoryStorage();
  const prefs = createPreferences(storage);
  prefs.remember('all', 'situation-098');
  prefs.remember('work', 'situation-015');
  prefs.remember('work', 'situation-015');
  expect(storage.setItem).toHaveBeenCalledTimes(2);
  const next = createPreferences(storage);
  expect(next.lastViewed('all')).toBe('situation-098');
  expect(next.lastViewed('work')).toBe('situation-015');
  expect(next.lastViewed('family')).toBeUndefined();
});

it('keeps another tab’s latest changes when writing from an older session', () => {
  const storage = memoryStorage();
  const firstTab = createPreferences(storage);
  const secondTab = createPreferences(storage);
  firstTab.toggleSaved('situation-001');
  secondTab.remember('work', 'situation-011');
  firstTab.toggleSaved('situation-002');
  secondTab.refresh();
  expect(secondTab.savedIds()).toEqual(['situation-002', 'situation-001']);
  expect(secondTab.lastViewed('work')).toBe('situation-011');
});

it('ignores invalid, duplicate and cross-category stored values', () => {
  const storage = memoryStorage();
  storage.setItem(STORAGE_KEY, JSON.stringify({
    saved: ['situation-001', 'situation-001', 'old-id', 2, null],
    lastViewed: { all: 'situation-002', work: 'situation-001', relationships: 5, unknown: 'situation-011' },
  }));
  const prefs = createPreferences(storage);
  expect(prefs.savedIds()).toEqual(['situation-001']);
  expect(prefs.lastViewed('all')).toBe('situation-002');
  for (const scope of ['work', 'relationships', 'unknown']) expect(prefs.lastViewed(scope)).toBeUndefined();
  storage.setItem(STORAGE_KEY, '{invalid JSON');
  prefs.refresh();
  expect(prefs.savedIds()).toEqual([]);
  expect(prefs.lastViewed('all')).toBeUndefined();
});

it('keeps the current session usable when reading and writing storage fail', () => {
  const storage = memoryStorage();
  storage.getItem = () => { throw new Error('Storage disabled'); };
  storage.setItem.mockImplementation(() => { throw new Error('Quota exceeded'); });
  const prefs = createPreferences(storage);
  prefs.remember('work', 'situation-012');
  prefs.toggleSaved('situation-012');
  expect(prefs.isSaved('situation-012')).toBe(true);
  expect(prefs.lastViewed('work')).toBe('situation-012');
});
