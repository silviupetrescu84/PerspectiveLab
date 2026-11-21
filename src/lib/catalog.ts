import source from '../assets/situations.json' with { type: 'json' };

export interface Situation {
  id: string;
  category: string;
  situation: string;
  initialInterpretations: readonly string[];
  alternativePerspectives: readonly string[];
}

export interface Category {
  slug: string;
  name: string;
  situations: readonly Situation[];
}

export const situations: readonly Situation[] = source.situations;

export function categorySlug(name: string): string {
  return name.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export const categories: readonly Category[] = source.categories.map((name) => ({
  slug: categorySlug(name),
  name,
  situations: situations.filter((situation) => situation.category === name),
}));

export const categoriesBySlug = new Map(categories.map((category) => [category.slug, category]));
export const situationsById = new Map(situations.map((situation) => [situation.id, situation]));
