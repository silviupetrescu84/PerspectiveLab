import { button, element, heading, icon, link } from '../../components/elements';
import { exploreHref, type DetailRoute } from '../../lib/navigation';
import type { SituationDetail } from './model';

interface ExplorerOptions {
  route: DetailRoute;
  detail: SituationDetail;
  saved: boolean;
  onToggleSave: () => boolean;
}

function interpretationPanel(title: string, items: readonly string[], variant: 'initial' | 'alternative'): HTMLElement {
  const panel = element('section', `interpretation-panel ${variant}-panel`);
  const panelTitle = variant === 'alternative' ? heading('h2', 'panel-title', title) : element('h2', 'panel-title', title);
  if (variant === 'alternative') panelTitle.id = 'perspective-heading';
  panelTitle.prepend(icon(variant === 'initial' ? 'chat-circle' : 'sparkle'));
  const list = element('ul', 'interpretations');
  list.setAttribute('role', 'list');
  list.append(...items.map((item) => element('li', '', item)));
  panel.append(panelTitle, list);
  return panel;
}

function saveButton(saved: boolean, toggle: () => boolean): HTMLButtonElement {
  const save = button('Save', 'action action-secondary save-button');
  save.setAttribute('aria-label', 'Save situation');
  save.prepend(icon('bookmark-simple'), icon('check'));
  save.setAttribute('aria-pressed', String(saved));
  save.addEventListener('click', () => save.setAttribute('aria-pressed', String(toggle())));
  return save;
}

function situationPagination(detail: Extract<SituationDetail, { kind: 'catalog' }>, scope: string): HTMLElement {
  const { previous, next, index, total } = detail;
  const pagination = element('nav', 'pagination');
  pagination.setAttribute('aria-label', 'Browse situations');
  const previousControl = previous
    ? link('Previous situation', exploreHref(scope, previous.id), 'text-link')
    : element('span');
  const nextControl = next
    ? link('Next situation', exploreHref(scope, next.id), 'text-link')
    : element('span');
  pagination.append(previousControl, element('span', 'position', `${index + 1} of ${total}`), nextControl);
  return pagination;
}

export function explorerView({ route, detail, saved, onToggleSave }: ExplorerOptions): HTMLElement {
  const view = element('div', 'shell inner-page');
  const card = element('article', 'explorer-card');
  const comparing = route.step === 'perspectives';

  if (detail.kind === 'catalog') {
    const situation = detail.current;
    const top = element('div', 'situation-meta');
    top.append(element('span', 'situation-category', situation.category), saveButton(saved, onToggleSave));
    const title = heading('h1', 'situation-title', situation.situation);
    card.append(top, title, interpretationPanel('Common first thoughts', situation.initialInterpretations, 'initial'));
    if (comparing) {
      card.append(interpretationPanel('Other ways to see it', situation.alternativePerspectives, 'alternative'));
    }
  } else {
    card.append(
      heading('h1', 'page-title', 'Your situation'),
      element('p', 'custom-situation-text', detail.text),
    );
    if (comparing) {
      card.append(interpretationPanel('Consider another explanation', detail.prompts, 'alternative'));
    } else {
      const prompt = element('section', 'interpretation-panel initial-panel');
      prompt.append(
        element('h2', 'panel-title', 'What was your first interpretation?'),
        element('p', 'prompt-copy', 'Think about what you noticed and what meaning you gave it.'),
      );
      card.append(prompt);
    }
  }

  const actions = element('nav', 'detail-actions');
  actions.setAttribute('aria-label', 'Exploration steps');
  const back = link('Back', detail.links.back, 'action action-secondary');
  const next = link(comparing ? 'Browse situations' : 'Continue', detail.links.next, 'action action-primary');
  if (!comparing) next.prepend(icon('sparkle'));
  actions.append(back, next);
  card.append(actions);
  view.append(card);
  if (detail.kind === 'catalog' && detail.total > 1) view.append(situationPagination(detail, route.scope));
  return view;
}
