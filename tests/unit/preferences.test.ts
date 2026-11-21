import { expect, it, vi } from 'vitest';
import { resolveSituation } from '../../src/features/explorer/model';
import { customInterpretationKey } from '../../src/lib/interpretation';
import { CUSTOM_ID, exploreHref, readRoute } from '../../src/lib/navigation';
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
    searchQuery: ['message'],
    customDraft: 1,
  }));
  const prefs = createPreferences(storage);
  expect(prefs.savedIds()).toEqual(['situation-001']);
  expect(prefs.lastViewed('all')).toBe('situation-002');
  expect(prefs.searchQuery()).toBe('');
  expect(prefs.customDraft()).toBe('');
  for (const scope of ['work', 'relationships', 'unknown']) expect(prefs.lastViewed(scope)).toBeUndefined();
  storage.setItem(STORAGE_KEY, '{invalid JSON');
  prefs.refresh();
  expect(prefs.savedIds()).toEqual([]);
  expect(prefs.lastViewed('all')).toBeUndefined();
});

it('preserves draft and search text exactly, alongside existing bookmarks and progress', () => {
  const storage = memoryStorage();
  storage.setItem(STORAGE_KEY, JSON.stringify({ saved: ['situation-001'], lastViewed: { work: 'situation-011' } }));
  const prefs = createPreferences(storage);
  expect(prefs.searchQuery()).toBe('');
  expect(prefs.customDraft()).toBe('');
  const draft = ' My friend went quiet.\nI wonder what happened. ';
  prefs.setCustomDraft(draft);
  prefs.setSearchQuery('  message ');
  prefs.setSearchQuery('  message ');
  expect(storage.setItem).toHaveBeenCalledTimes(3);

  const reopen = createPreferences(storage);
  expect(reopen.customDraft()).toBe(draft);
  expect(reopen.searchQuery()).toBe('  message ');
  expect(reopen.savedIds()).toEqual(['situation-001']);
  expect(reopen.lastViewed('work')).toBe('situation-011');
  reopen.setSearchQuery('');
  reopen.setCustomDraft('');
  const cleared = createPreferences(storage);
  expect(cleared.searchQuery()).toBe('');
  expect(cleared.customDraft()).toBe('');
});

it('keeps the current session usable when reading and writing storage fail', () => {
  const storage = memoryStorage();
  storage.getItem = () => { throw new Error('Storage disabled'); };
  storage.setItem.mockImplementation(() => { throw new Error('Quota exceeded'); });
  const prefs = createPreferences(storage);
  prefs.remember('work', 'situation-012');
  prefs.toggleSaved('situation-012');
  prefs.setSearchQuery('praise');
  prefs.setCustomDraft('A colleague received praise.');
  prefs.setInterpretation('situation-012', { text: 'My work goes unnoticed.' });
  prefs.setInterpretation('situation-012', { belief: 3 });
  expect(prefs.isSaved('situation-012')).toBe(true);
  expect(prefs.lastViewed('work')).toBe('situation-012');
  expect(prefs.searchQuery()).toBe('praise');
  expect(prefs.customDraft()).toBe('A colleague received praise.');
  expect(prefs.interpretation('situation-012')).toEqual({ text: 'My work goes unnoticed.', belief: 3 });
});

it('restores partial and complete catalog responses across routes and a reload', () => {
  const storage = memoryStorage();
  const href = exploreHref('work', 'situation-011');
  function open(path: string) {
    const route = readRoute(path);
    if (route.page !== 'explore' || route.view !== 'detail') throw new Error('Expected an exploration detail');
    const detail = resolveSituation(route, '', '');
    if (detail.redirect !== undefined) throw new Error('Expected an existing situation');
    return detail;
  }

  const first = open(href);
  const response = '  My manager might be unhappy.\nI do not know why.  ';
  createPreferences(storage).setInterpretation(first.interpretationKey, { text: response });
  const afterRefresh = createPreferences(storage);
  expect(afterRefresh.interpretation(first.interpretationKey)).toEqual({ text: response, belief: null });
  afterRefresh.setInterpretation(first.interpretationKey, { belief: 4 });

  const perspectives = open(first.links.next);
  const back = open(perspectives.links.back);
  const reopened = createPreferences(storage);
  for (const detail of [perspectives, back, open(exploreHref('all', 'situation-011'))]) {
    expect(reopened.interpretation(detail.interpretationKey)).toEqual({ text: response, belief: 4 });
  }
  expect(reopened.interpretation(open(exploreHref('work', 'situation-012')).interpretationKey)).toEqual({ text: '', belief: null });
});

it('keeps responses for different custom situations separate through edits and reloads', () => {
  const storage = memoryStorage();
  const prefs = createPreferences(storage);
  const draft = '  My brother left quietly.\nI did not ask why.  ';
  const alternative = 'I did not hear back about my application.';
  function currentResponseKey(step: 'situation' | 'perspectives', value: string) {
    const route = readRoute(exploreHref('family', CUSTOM_ID, step));
    if (route.page !== 'explore' || route.view !== 'detail') throw new Error('Expected a custom exploration');
    const detail = resolveSituation(route, value, '');
    if (detail.redirect !== undefined) throw new Error('Expected a valid custom situation');
    return detail.interpretationKey;
  }

  prefs.setCustomDraft(draft);
  const key = currentResponseKey('situation', prefs.customDraft());
  prefs.setInterpretation(key, { belief: 5 });
  const reopen = createPreferences(storage);
  expect(reopen.interpretation(currentResponseKey('perspectives', reopen.customDraft()))).toEqual({ text: '', belief: 5 });
  reopen.setInterpretation(key, { text: 'He is upset with me.' });
  reopen.setCustomDraft(alternative);
  const otherKey = currentResponseKey('situation', reopen.customDraft());
  expect(reopen.interpretation(otherKey)).toEqual({ text: '', belief: null });
  reopen.setInterpretation(otherKey, { text: 'I did not get the job.', belief: 1 });
  reopen.setCustomDraft(draft.trim());

  const again = createPreferences(storage);
  expect(again.interpretation(currentResponseKey('situation', again.customDraft()))).toEqual({ text: 'He is upset with me.', belief: 5 });
  expect(again.interpretation(otherKey)).toEqual({ text: 'I did not get the job.', belief: 1 });
});

it('merges text and rating edits and skips writes for unchanged responses', () => {
  const storage = memoryStorage();
  const firstTab = createPreferences(storage);
  const secondTab = createPreferences(storage);
  const id = 'situation-011';
  firstTab.setInterpretation(id, { text: 'I am worried.' });
  secondTab.setInterpretation(id, { belief: 2 });
  firstTab.setInterpretation(id, { text: 'I am worried.' });
  expect(storage.setItem).toHaveBeenCalledTimes(2);
  const response = firstTab.interpretation(id);
  expect(response).toEqual({ text: 'I am worried.', belief: 2 });
  response.text = 'changed by caller';
  expect(firstTab.interpretation(id).text).toBe('I am worried.');
  secondTab.setInterpretation(id, { text: '' });
  expect(createPreferences(storage).interpretation(id)).toEqual({ text: '', belief: 2 });
  secondTab.setInterpretation(id, { belief: null });
  expect(createPreferences(storage).interpretation(id)).toEqual({ text: '', belief: null });
});

it('reads older preferences and recovers valid parts of malformed interpretation records', () => {
  const storage = memoryStorage();
  storage.setItem(STORAGE_KEY, JSON.stringify({ saved: ['situation-011'], customDraft: 'An example' }));
  expect(createPreferences(storage).interpretation('situation-011')).toEqual({ text: '', belief: null });

  const customKey = customInterpretationKey('A hard day.');
  storage.setItem(STORAGE_KEY, JSON.stringify({ interpretations: {
    'situation-011': { text: 'A valid response.', belief: 7 },
    'situation-012': { text: ['invalid'], belief: 5 },
    'situation-013': { text: 'Saved with a rating as text.', belief: '3' },
    'situation-014': null,
    [customKey]: { text: 'It will happen again.', belief: 1 },
    'custom: ': { text: 'No situation', belief: 2 },
    'deleted-id': { text: 'Missing situation', belief: 4 },
    ['__proto__']: { text: 'Unexpected key', belief: 3 },
  } }));
  const prefs = createPreferences(storage);
  expect(prefs.interpretation('situation-011')).toEqual({ text: 'A valid response.', belief: null });
  expect(prefs.interpretation('situation-012')).toEqual({ text: '', belief: 5 });
  expect(prefs.interpretation('situation-013')).toEqual({ text: 'Saved with a rating as text.', belief: null });
  expect(prefs.interpretation(customKey)).toEqual({ text: 'It will happen again.', belief: 1 });
  for (const key of ['situation-014', 'custom: ', 'deleted-id', '__proto__']) {
    expect(prefs.interpretation(key)).toEqual({ text: '', belief: null });
  }
});
