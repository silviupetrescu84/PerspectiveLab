import { describe, expect, it } from 'vitest';
import { categories, categoriesBySlug, categorySlug, situations, situationsById } from '../../src/lib/catalog';
import { exploreHref, getExploration, readRoute } from '../../src/lib/navigation';

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
  it.each(['', '#main', '#/', '#/missing', '#/saved/unexpected', '#/explore/a/b/c'])('falls back to home for %s', (hash) => {
    expect(readRoute(hash)).toEqual({ page: 'home' });
  });

  it('parses supported links and falls back to all situations for an unknown scope', () => {
    expect(readRoute('#/categories')).toEqual({ page: 'home', section: 'categories' });
    expect(readRoute('#/saved')).toEqual({ page: 'saved' });
    expect(readRoute('#/explore')).toEqual({ page: 'explore', scope: 'all' });
    expect(readRoute('#/explore/unknown')).toEqual({ page: 'explore', scope: 'all' });
    expect(readRoute(exploreHref('work', 'situation-011'))).toEqual({ page: 'explore', scope: 'work', id: 'situation-011' });
  });

  it('resumes within a category, gives priority to a deep link, and falls back for invalid IDs', () => {
    expect(getExploration('all').collection).toBe(situations);
    expect(getExploration('work', undefined, 'situation-013').current?.id).toBe('situation-013');
    expect(getExploration('work', 'situation-014', 'situation-013').index).toBe(3);
    expect(getExploration('work', 'situation-001').current?.id).toBe('situation-011');
    expect(getExploration('all', 'unknown').current?.id).toBe('situation-001');
  });
});
