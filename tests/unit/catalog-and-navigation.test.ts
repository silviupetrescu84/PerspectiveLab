import { describe, expect, it } from 'vitest';
import { categories, categoriesBySlug, categorySlug, situations, situationsById } from '../../src/lib/catalog';
import { CUSTOM_ID, exploreHref, readRoute } from '../../src/lib/navigation';

it('indexes every situation once, in a declared category, with both kinds of interpretations', () => {
  expect(categories).toHaveLength(10);
  expect(situations).toHaveLength(100);
  expect(categoriesBySlug.size).toBe(categories.length);
  expect(situationsById.size).toBe(situations.length);
  expect(categories.flatMap((category) => category.situations)).toEqual(situations);
  for (const category of categories) {
    expect(category.situations).toHaveLength(10);
    for (const situation of category.situations) {
      expect(situation.situation.trim()).not.toBe('');
      expect(situation.initialInterpretations.length).toBeGreaterThan(0);
      expect(situation.alternativePerspectives.length).toBeGreaterThan(0);
      expect([...situation.initialInterpretations, ...situation.alternativePerspectives].every((text) => text.trim())).toBe(true);
    }
  }
  expect(categorySlug('Mistakes & Setbacks')).toBe('mistakes-and-setbacks');
});

describe('hash routing', () => {
  it.each(['', '#main', '#/', '#/missing', '#/saved/unexpected', '#/explore/a/b/c/d'])('falls back to home for %s', (hash) => {
    expect(readRoute(hash)).toEqual({ page: 'home' });
  });

  it('opens the library from Explore and category links', () => {
    expect(readRoute('#/categories')).toEqual({ page: 'home', section: 'categories' });
    expect(readRoute('#/saved')).toEqual({ page: 'saved' });
    expect(readRoute('#/explore')).toEqual({ page: 'explore', scope: 'all', view: 'library' });
    expect(readRoute('#/explore/unknown')).toEqual({ page: 'explore', scope: 'all', view: 'library' });
    expect(readRoute(exploreHref('work'))).toEqual({ page: 'explore', scope: 'work', view: 'library' });
    expect(readRoute('#/explore/work/situation-011/missing')).toEqual({ page: 'explore', scope: 'work', view: 'library' });
  });

  it('keeps old situation links usable and handles both custom steps', () => {
    expect(exploreHref('work', 'situation-011', 'situation')).toBe('#/explore/work/situation-011');
    expect(readRoute('#/explore/work/situation-011')).toEqual({
      page: 'explore', scope: 'work', view: 'detail', id: 'situation-011', step: 'situation',
    });
    expect(readRoute(exploreHref('work', CUSTOM_ID))).toEqual({ page: 'explore', scope: 'work', view: 'custom' });
    for (const step of ['situation', 'perspectives'] as const) {
      expect(readRoute(exploreHref('work', CUSTOM_ID, step))).toEqual({
        page: 'explore', scope: 'work', view: 'detail', id: CUSTOM_ID, step,
      });
    }
  });
});
