import { button, element, heading, icon, link } from '../../components/elements';
import type { InitialInterpretation } from '../../lib/interpretation';
import { exploreHref, type DetailRoute } from '../../lib/navigation';
import { interpretationForm } from './interpretation-form';
import type { SituationDetail } from './model';

interface ExplorerOptions {
  route: DetailRoute;
  detail: SituationDetail;
  interpretation: InitialInterpretation;
  saved: boolean;
  onToggleSave: () => boolean;
  onInterpretationChange: (update: Partial<InitialInterpretation>) => void;
  onContinue: (href: string) => void;
}

function interpretationPanel(title: string, items: readonly string[], variant: 'initial' | 'alternative'): HTMLElement {
  const panel = element('section', `interpretation-panel ${variant}-panel`);
  const panelTitle = element('h2', 'panel-title', title);
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

function explorationProgress(comparing: boolean): HTMLElement {
  const step = comparing ? 2 : 1;
  const progress = element('div', 'exploration-progress');
  const track = element('progress', 'exploration-track');
  track.max = 2;
  track.value = step;
  track.setAttribute('aria-label', 'Exploration progress');
  const label = element('span', 'progress-label', `Step ${step} of ${track.max}`);
  track.setAttribute('aria-valuetext', label.textContent ?? '');
  label.setAttribute('aria-hidden', 'true');
  progress.append(label, track);
  return progress;
}

function interpretationSummary({ text, belief }: InitialInterpretation): HTMLElement {
  const summary = element('section', 'interpretation-panel response-summary');
  summary.append(element('h2', 'panel-title', 'Your initial interpretation'));
  if (text.trim()) summary.append(element('p', 'response-text', text));
  if (belief !== null) summary.append(element('p', 'response-belief', `You rated your belief ${belief} out of 5.`));
  return summary;
}

export function explorerView(options: ExplorerOptions): HTMLElement {
  const { route, detail, interpretation, saved, onToggleSave, onInterpretationChange, onContinue } = options;
  const view = element('div', 'shell inner-page');
  const card = element('article', 'explorer-card');
  const comparing = route.step === 'perspectives';

  if (detail.kind === 'catalog') {
    const top = element('div', 'situation-meta');
    top.append(element('span', 'situation-category', detail.current.category), saveButton(saved, onToggleSave));
    card.append(top);
  }
  const title = comparing ? 'Explore other perspectives' : 'What do you think this situation means?';
  const context = element('div', 'situation-context');
  context.append(
    element('p', 'situation-category', 'Situation'),
    element('p', 'situation-context-text', detail.kind === 'catalog' ? detail.current.situation : detail.text),
  );
  card.append(heading('h1', 'page-title exploration-title', title), context);

  if (!comparing) {
    card.append(interpretationForm({
      initial: interpretation,
      backHref: detail.links.back,
      onChange: onInterpretationChange,
      onContinue: () => onContinue(detail.links.next),
    }));
  } else {
    if (interpretation.text.trim() || interpretation.belief !== null) card.append(interpretationSummary(interpretation));
    if (detail.kind === 'catalog') {
      card.append(
        interpretationPanel('Common first thoughts', detail.current.initialInterpretations, 'initial'),
        interpretationPanel('Other ways to see it', detail.current.alternativePerspectives, 'alternative'),
      );
    } else {
      card.append(interpretationPanel('Consider another explanation', detail.prompts, 'alternative'));
    }
    const actions = element('nav', 'detail-actions');
    actions.setAttribute('aria-label', 'Exploration steps');
    actions.append(
      link('Back', detail.links.back, 'action action-secondary'),
      link('Browse situations', detail.links.next, 'action action-primary'),
    );
    card.append(actions);
  }
  view.append(explorationProgress(comparing), card);
  if (detail.kind === 'catalog' && detail.total > 1) view.append(situationPagination(detail, route.scope));
  return view;
}
