import reflection from '../../assets/reflection_prompts.json' with { type: 'json' };
import { categoriesBySlug, situations, type Situation } from '../../lib/catalog';
import { CUSTOM_ID, exploreHref, type DetailRoute } from '../../lib/navigation';

function searchWords(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/['’]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

function situationsInScope(scope: string): readonly Situation[] {
  return categoriesBySlug.get(scope)?.situations ?? situations;
}

export function filterSituations(scope: string, query: string): readonly Situation[] {
  const collection = situationsInScope(scope);
  const terms = searchWords(query);
  if (!terms) return collection;
  const words = terms.split(' ');
  return collection.filter(({ situation }) => {
    const searchable = searchWords(situation);
    return words.every((word) => searchable.includes(word));
  });
}

export function draftSituation(draft: string): string | undefined {
  return draft.trim() || undefined;
}

function detailLinks({ scope, id, step }: DetailRoute) {
  const library = exploreHref(scope);
  if (step === 'perspectives') {
    return { back: exploreHref(scope, id, 'situation'), next: library };
  }
  return {
    back: id === CUSTOM_ID ? exploreHref(scope, CUSTOM_ID) : library,
    next: exploreHref(scope, id, 'perspectives'),
  };
}

export function resolveSituation(route: DetailRoute, draft: string, query: string) {
  const { scope, id, step } = route;
  const links = detailLinks(route);
  if (id === CUSTOM_ID) {
    const text = draftSituation(draft);
    if (!text) return { redirect: exploreHref(scope, CUSTOM_ID) };
    return {
      kind: 'custom' as const,
      text,
      links,
      prompts: step === 'perspectives' ? Object.values(reflection.defaultPrompts) : [],
    };
  }

  const matches = filterSituations(scope, query);
  const collection = matches.some((situation) => situation.id === id) ? matches : situationsInScope(scope);
  const index = collection.findIndex((situation) => situation.id === id);
  const current = collection[index];
  if (!current) return { redirect: exploreHref(scope) };
  return {
    kind: 'catalog' as const,
    current,
    links,
    index,
    total: collection.length,
    previous: collection[index - 1],
    next: collection[index + 1],
  };
}

export type SituationDetail = Exclude<ReturnType<typeof resolveSituation>, { redirect: string }>;
