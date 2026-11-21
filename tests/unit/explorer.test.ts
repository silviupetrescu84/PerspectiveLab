import { describe, expect, it } from 'vitest';
import { draftSituation, filterSituations, resolveSituation } from '../../src/features/explorer/model';
import { categories, situations } from '../../src/lib/catalog';
import { CUSTOM_ID, exploreHref, readRoute } from '../../src/lib/navigation';

function openSituation(href: string, { draft = '', query = '' } = {}) {
  const route = readRoute(href);
  if (route.page !== 'explore' || route.view !== 'detail') throw new Error(`Expected a situation link: ${href}`);
  return resolveSituation(route, draft, query);
}

describe('situation library', () => {
  it('lists the full catalog when no search or category is selected', () => {
    expect(filterSituations('all', '')).toBe(situations);
    expect(filterSituations('all', '  \t')).toBe(situations);
    expect(filterSituations('unknown-scope', '')).toBe(situations);
  });

  it.each([...categories])('lists only the situations in $name', ({ slug, situations: entries }) => {
    expect(filterSituations(slug, '')).toEqual(entries);
    for (const situation of entries) {
      expect(openSituation(exploreHref(slug, situation.id))).toMatchObject({ kind: 'catalog', current: situation });
    }
  });

  it('matches scenario text across categories without depending on case, accents, or punctuation', () => {
    const results = filterSituations('all', ' MéSSAGE! ');
    expect(results.map(({ id }) => id)).toEqual(['situation-001', 'situation-058']);
    expect(filterSituations('all', 'message HASN’T').map(({ id }) => id)).toEqual(['situation-001']);
  });

  it('combines category and text filters and returns an empty list when nothing matches', () => {
    expect(filterSituations('relationships', 'message').map(({ id }) => id)).toEqual(['situation-001']);
    expect(filterSituations('work', 'message')).toEqual([]);
    expect(filterSituations('all', 'zzznosuchscenario')).toEqual([]);
    expect(filterSituations('all', 'distraction does not explain')).toEqual([]);
  });
});

describe('catalog exploration', () => {
  it('uses Back and Continue to move between the scoped list, selected situation, and perspectives', () => {
    const href = exploreHref('work', 'situation-011');
    const situation = openSituation(href);
    expect(situation.links?.back).toBe(exploreHref('work'));
    expect(situation.links?.next).toBe(exploreHref('work', 'situation-011', 'perspectives'));
    const perspectives = openSituation(situation.links!.next);
    expect(perspectives.current).toBe(situation.current);
    expect(perspectives.interpretationKey).toBe('situation-011');
    expect(openSituation(exploreHref('all', 'situation-011')).interpretationKey).toBe(perspectives.interpretationKey);
    expect(perspectives.links).toEqual({ back: href, next: exploreHref('work') });
  });

  it('keeps previous and next navigation within the results when a situation matches the search', () => {
    const query = 'message';
    expect(openSituation(exploreHref('all', 'situation-001'), { query })).toMatchObject({
      kind: 'catalog', current: { id: 'situation-001' }, index: 0, total: 2, previous: undefined, next: { id: 'situation-058' },
    });
    expect(openSituation(exploreHref('all', 'situation-058'), { query })).toMatchObject({
      kind: 'catalog', current: { id: 'situation-058' }, index: 1, total: 2, previous: { id: 'situation-001' }, next: undefined,
    });
  });

  it('opens a saved or resumed situation even if it does not match the current text filter', () => {
    expect(openSituation(exploreHref('work', 'situation-011'), { query: 'message' })).toMatchObject({
      kind: 'catalog', current: { id: 'situation-011' }, index: 0, total: 10, next: { id: 'situation-012' },
    });
  });

  it('returns to the correct library for a missing or out-of-category selection', () => {
    expect(openSituation(exploreHref('all', 'missing'))).toEqual({ redirect: exploreHref() });
    expect(openSituation(exploreHref('work', 'situation-001'))).toEqual({ redirect: exploreHref('work') });
  });
});

describe('custom exploration', () => {
  it.each(['', ' ', '\n\t', '　'])('requires text and returns an empty draft to the entry form', (draft) => {
    expect(draftSituation(draft)).toBeUndefined();
    for (const step of ['situation', 'perspectives'] as const) {
      expect(openSituation(exploreHref('family', CUSTOM_ID, step), { draft })).toEqual({ redirect: exploreHref('family', CUSTOM_ID) });
    }
  });

  it('keeps the same personal situation through review, guided questions, and Back', () => {
    const draft = '  My brother left quietly.\nI did not ask why.  ';
    const review = exploreHref('family', CUSTOM_ID, 'situation');
    const alternatives = exploreHref('family', CUSTOM_ID, 'perspectives');
    const text = 'My brother left quietly.\nI did not ask why.';
    expect(openSituation(review, { draft })).toEqual({
      kind: 'custom', text, interpretationKey: `custom:${text}`, prompts: [],
      links: { back: exploreHref('family', CUSTOM_ID), next: alternatives },
    });
    expect(openSituation(alternatives, { draft })).toEqual({
      kind: 'custom', text, interpretationKey: `custom:${text}`, links: { back: review, next: exploreHref('family') },
      prompts: ['What supports this interpretation?', 'What might suggest something else?', 'What do I still not know?'],
    });
  });
});
