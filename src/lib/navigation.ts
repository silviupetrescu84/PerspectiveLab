import { categoriesBySlug, situations } from './catalog';

export type Route =
  | { page: 'home'; section?: 'categories' }
  | { page: 'saved' }
  | { page: 'explore'; scope: string; id?: string };

export function readRoute(hash: string): Route {
  const segments = hash.slice(2).split('/');
  if (!hash.startsWith('#/')) return { page: 'home' };
  if (segments[0] === 'categories' && segments.length === 1) return { page: 'home', section: 'categories' };
  if (segments[0] === 'saved' && segments.length === 1) return { page: 'saved' };
  if (segments[0] !== 'explore' || segments.length > 3) return { page: 'home' };

  const [, scope = 'all', id] = segments;
  return { page: 'explore', scope: scope === 'all' || categoriesBySlug.has(scope) ? scope : 'all', id };
}

export function exploreHref(scope = 'all', id?: string): string {
  return id ? `#/explore/${scope}/${id}` : `#/explore/${scope}`;
}

export function getExploration(scope: string, id?: string, lastId?: string) {
  const category = categoriesBySlug.get(scope);
  const collection = category?.situations ?? situations;
  const index = Math.max(0, collection.findIndex((situation) => situation.id === (id ?? lastId)));
  return { category, collection, index, current: collection[index] };
}
