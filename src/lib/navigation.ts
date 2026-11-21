import { categoriesBySlug } from './catalog';

export const CUSTOM_ID = 'custom';
export type ExploreStep = 'situation' | 'perspectives';

export type ExploreRoute =
  | { page: 'explore'; scope: string; view: 'library' | 'custom' }
  | { page: 'explore'; scope: string; view: 'detail'; id: string; step: ExploreStep };

export type DetailRoute = Extract<ExploreRoute, { view: 'detail' }>;

export type Route =
  | { page: 'home'; section?: 'categories' }
  | { page: 'saved' }
  | ExploreRoute;

export function readRoute(hash: string): Route {
  const segments = hash.slice(2).split('/');
  if (!hash.startsWith('#/')) return { page: 'home' };
  if (segments[0] === 'categories' && segments.length === 1) return { page: 'home', section: 'categories' };
  if (segments[0] === 'saved' && segments.length === 1) return { page: 'saved' };
  if (segments[0] !== 'explore' || segments.length > 4) return { page: 'home' };

  const [, requestedScope = 'all', id, step] = segments;
  const scope = categoriesBySlug.has(requestedScope) ? requestedScope : 'all';
  if (!id || (step !== undefined && step !== 'situation' && step !== 'perspectives')) {
    return { page: 'explore', scope, view: 'library' };
  }
  if (id === CUSTOM_ID && step === undefined) return { page: 'explore', scope, view: 'custom' };
  return { page: 'explore', scope, view: 'detail', id, step: step ?? 'situation' };
}

export function exploreHref(scope = 'all', id?: string, step?: ExploreStep): string {
  const path = `#/explore/${scope}`;
  if (!id) return path;
  return step && (step === 'perspectives' || id === CUSTOM_ID) ? `${path}/${id}/${step}` : `${path}/${id}`;
}
