import { button, element, heading, icon, link } from '../../components/elements';
import { categories } from '../../lib/catalog';
import { exploreHref, getExploration } from '../../lib/navigation';

interface ExplorerOptions {
  scope: string;
  selection: ReturnType<typeof getExploration>;
  saved: boolean;
  onToggleSave: () => boolean;
}

function categoryPicker(scope: string): HTMLFormElement {
  const form = element('form', 'category-picker');
  const label = element('label', '', 'Category');
  label.htmlFor = 'category';
  const controls = element('div', 'category-controls');
  const select = element('select', 'category-select');
  select.id = 'category';
  select.add(new Option('All situations', 'all'));
  for (const category of categories) select.add(new Option(category.name, category.slug));
  select.value = scope;
  const apply = button('Go', 'action action-secondary');
  apply.type = 'submit';
  apply.setAttribute('aria-label', 'Go to category');
  controls.append(select, apply);
  form.append(label, controls);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (select.value !== scope) window.location.hash = exploreHref(select.value);
  });
  return form;
}

function interpretationList(items: readonly string[], className: string): HTMLUListElement {
  const list = element('ul', className);
  list.setAttribute('role', 'list');
  list.append(...items.map((item) => element('li', '', item)));
  return list;
}

function saveButton(saved: boolean, toggle: () => boolean): HTMLButtonElement {
  const save = button('Save', 'action action-secondary save-button');
  save.setAttribute('aria-label', 'Save situation');
  save.prepend(icon('bookmark-simple'), icon('check'));
  save.setAttribute('aria-pressed', String(saved));
  save.addEventListener('click', () => save.setAttribute('aria-pressed', String(toggle())));
  return save;
}

export function explorerView({ scope, selection, saved, onToggleSave }: ExplorerOptions): HTMLElement {
  const { collection, current, index } = selection;
  const view = element('div', 'shell inner-page');
  const toolbar = element('div', 'explorer-toolbar');
  toolbar.append(link('Browse categories', '#/categories', 'text-link'), categoryPicker(scope));
  view.append(toolbar);

  if (!current) {
    view.append(heading('h1', 'page-title', 'No situations in this category'));
    return view;
  }

  const card = element('article', 'explorer-card');
  const top = element('div', 'situation-meta');
  top.append(element('span', 'situation-category', current.category), saveButton(saved, onToggleSave));
  card.append(top, heading('h1', 'situation-title', current.situation));

  const initial = element('section', 'interpretation-panel initial-panel');
  const initialTitle = element('h2', 'panel-title', 'Common first thoughts');
  initialTitle.prepend(icon('chat-circle'));
  initial.append(initialTitle, interpretationList(current.initialInterpretations, 'interpretations'));
  card.append(initial);

  const reveal = button('Reveal other perspectives', 'action action-primary reveal-button');
  reveal.prepend(icon('sparkle'));
  reveal.setAttribute('aria-expanded', 'false');
  reveal.setAttribute('aria-controls', 'other-perspectives');

  const alternatives = element('section', 'interpretation-panel alternative-panel');
  alternatives.id = 'other-perspectives';
  alternatives.hidden = true;
  const alternativeTitle = element('h2', 'panel-title', 'Other ways to see it');
  alternatives.append(alternativeTitle, interpretationList(current.alternativePerspectives, 'interpretations'));
  reveal.addEventListener('click', () => {
    const willShow = alternatives.hidden;
    alternatives.hidden = !willShow;
    reveal.setAttribute('aria-expanded', String(willShow));
    reveal.replaceChildren(icon('sparkle'), willShow ? 'Hide other perspectives' : 'Reveal other perspectives');
  });
  card.append(reveal, alternatives);

  const pagination = element('nav', 'pagination');
  pagination.setAttribute('aria-label', 'Situation navigation');
  const previous = collection[index - 1];
  const next = collection[index + 1];
  const previousControl = previous
    ? link('Previous', exploreHref(scope, previous.id), 'action action-secondary')
    : button('Previous', 'action action-secondary');
  const nextControl = next
    ? link('Next situation', exploreHref(scope, next.id), 'action action-secondary')
    : button('Next situation', 'action action-secondary');
  if (previousControl instanceof HTMLButtonElement) previousControl.disabled = true;
  if (nextControl instanceof HTMLButtonElement) nextControl.disabled = true;
  pagination.append(previousControl, element('span', 'position', `${index + 1} of ${collection.length}`), nextControl);
  view.append(card, pagination);
  return view;
}
