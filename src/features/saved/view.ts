import { button, element, heading, icon, link } from '../../components/elements';
import { categorySlug, situationsById, type Situation } from '../../lib/catalog';
import { exploreHref } from '../../lib/navigation';

function savedCard(situation: Situation, remove: () => void): HTMLLIElement {
  const item = element('li', 'saved-card');
  const entry = link('', exploreHref(categorySlug(situation.category), situation.id), 'saved-entry');
  entry.append(
    element('span', 'saved-category', situation.category),
    element('span', 'saved-name', situation.situation),
  );
  const removeButton = button('', 'action action-secondary remove-button');
  removeButton.setAttribute('aria-label', `Remove saved situation: ${situation.situation}`);
  removeButton.append(icon('x'));
  removeButton.addEventListener('click', remove);
  item.append(entry, removeButton);
  return item;
}

export function savedView(ids: readonly string[], onRemove: (id: string, index: number) => void): HTMLElement {
  const view = element('div', 'shell inner-page saved-page');
  view.append(heading('h1', 'page-title', 'Saved situations'));
  const saved = ids.map((id) => situationsById.get(id)).filter((situation) => situation !== undefined);
  if (saved.length === 0) {
    const empty = element('div', 'saved-empty');
    empty.append(
      icon('bookmark-simple', 'empty-icon'),
      element('h2', 'section-title', 'No saved situations yet'),
      element('p', 'section-intro', 'Save any situation you’d like to revisit.'),
      link('Start Exploring', exploreHref(), 'action action-primary'),
    );
    view.append(empty);
    return view;
  }

  const list = element('ul', 'saved-list');
  list.setAttribute('role', 'list');
  for (const [index, situation] of saved.entries()) {
    list.append(savedCard(situation, () => onRemove(situation.id, index)));
  }
  view.append(list);
  return view;
}
