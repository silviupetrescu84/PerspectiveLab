import type { Category } from '../lib/catalog';
import { exploreHref } from '../lib/navigation';
import { element, icon, link } from './elements';

const themes: Record<string, { glyph: string; tone: string }> = {
  relationships: { glyph: 'heart', tone: 'rose' },
  work: { glyph: 'briefcase', tone: 'blue' },
  'self-confidence': { glyph: 'sparkle', tone: 'violet' },
  'social-situations': { glyph: 'chats', tone: 'mint' },
  'mistakes-and-setbacks': { glyph: 'path', tone: 'peach' },
  uncertainty: { glyph: 'compass', tone: 'blue' },
  'personal-growth': { glyph: 'plant', tone: 'mint' },
  family: { glyph: 'house', tone: 'peach' },
  'everyday-frustrations': { glyph: 'lightning', tone: 'rose' },
  expectations: { glyph: 'target', tone: 'violet' },
};

export function categoryCard(category: Category): HTMLLIElement {
  const item = element('li');
  const card = link('', exploreHref(category.slug), 'category-card');
  const { glyph, tone } = themes[category.slug] ?? { glyph: 'shapes', tone: 'violet' };
  const count = category.situations.length;
  const mark = element('span', `category-mark tone-${tone}`);
  mark.append(icon(glyph));
  card.append(
    mark,
    element('span', 'category-name', category.name),
    element('span', 'category-count', `${count} ${count === 1 ? 'situation' : 'situations'}`),
  );
  item.append(card);
  return item;
}
