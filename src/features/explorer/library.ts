import { button, element, heading, icon, link } from '../../components/elements';
import { categories, type Situation } from '../../lib/catalog';
import { CUSTOM_ID, exploreHref } from '../../lib/navigation';
import { filterSituations } from './model';

interface LibraryOptions {
  scope: string;
  query: string;
  lastViewed: (scope: string) => string | undefined;
  onScopeChange: (scope: string) => void;
  onQueryChange: (query: string) => void;
}

function situationCard(situation: Situation, scope: string): HTMLLIElement {
  const item = element('li');
  const card = link('', exploreHref(scope, situation.id), 'library-card');
  card.append(
    element('span', 'situation-category', situation.category),
    element('span', 'library-card-title', situation.situation),
  );
  item.append(card);
  return item;
}

export function libraryView(options: LibraryOptions): HTMLElement {
  let scope = options.scope;
  const view = element('div', 'shell inner-page library-page');
  const intro = element('div', 'library-intro');
  const introCopy = element('div');
  introCopy.append(
    heading('h1', 'page-title', 'Situation Explorer'),
    element('p', 'section-intro', 'Choose an everyday situation or write one of your own.'),
  );
  const custom = link('Write your own', exploreHref(scope, CUSTOM_ID), 'action action-primary');
  custom.prepend(icon('chat-circle'));
  intro.append(introCopy, custom);

  const filters = element('div', 'library-filters');
  filters.setAttribute('role', 'search');
  filters.setAttribute('aria-label', 'Find a situation');
  const searchLabel = element('label', 'field-label', 'Search situations');
  const search = element('input', 'explorer-field');
  search.type = 'search';
  search.placeholder = 'Try “message”';
  search.value = options.query;
  searchLabel.append(search);
  const categoryLabel = element('label', 'field-label', 'Category');
  const category = element('select', 'explorer-field category-select');
  category.add(new Option('All categories', 'all'));
  for (const item of categories) category.add(new Option(item.name, item.slug));
  category.value = scope;
  categoryLabel.append(category);
  const reset = button('Clear filters', 'action action-secondary');
  filters.append(searchLabel, categoryLabel, reset);

  const toolbar = element('div', 'results-toolbar');
  const count = element('p', 'results-count');
  count.setAttribute('role', 'status');
  count.setAttribute('aria-atomic', 'true');
  const resume = link('Resume your last situation', exploreHref(scope), 'text-link');
  toolbar.append(count, resume);

  const results = element('ul', 'library-grid');
  results.setAttribute('role', 'list');
  results.setAttribute('aria-label', 'Matching situations');
  const empty = element('div', 'explorer-card library-empty');
  empty.append(
    element('h2', 'section-title', 'No matching situations'),
    element('p', 'section-intro', 'Try a different search or choose another category.'),
  );

  function renderResults() {
    const matches = filterSituations(scope, search.value);
    count.textContent = `${matches.length} ${matches.length === 1 ? 'situation' : 'situations'}`;
    results.replaceChildren(...matches.map((situation) => situationCard(situation, scope)));
    results.hidden = matches.length === 0;
    empty.hidden = matches.length > 0;
    reset.disabled = scope === 'all' && !search.value;
    custom.href = exploreHref(scope, CUSTOM_ID);
    const lastId = options.lastViewed(scope);
    resume.hidden = lastId === undefined;
    resume.href = exploreHref(scope, lastId);
  }

  search.addEventListener('input', () => {
    options.onQueryChange(search.value);
    renderResults();
  });
  category.addEventListener('change', () => {
    scope = category.value;
    options.onScopeChange(scope);
    renderResults();
  });
  reset.addEventListener('click', () => {
    search.value = '';
    if (scope !== 'all') options.onScopeChange('all');
    scope = 'all';
    category.value = scope;
    options.onQueryChange('');
    renderResults();
    search.focus();
  });

  renderResults();
  view.append(intro, filters, toolbar, results, empty);
  return view;
}
