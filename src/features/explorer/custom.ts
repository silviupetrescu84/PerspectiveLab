import { button, element, heading, link } from '../../components/elements';
import { CUSTOM_ID, exploreHref } from '../../lib/navigation';
import { draftSituation } from './model';

interface CustomOptions {
  scope: string;
  draft: string;
  onEdit: (draft: string) => void;
  onContinue: (href: string) => void;
}

export function customView({ scope, draft, onEdit, onContinue }: CustomOptions): HTMLElement {
  const view = element('div', 'shell inner-page');
  const form = element('form', 'explorer-card custom-form');
  form.noValidate = true;
  const label = element('label', 'field-label', 'Your situation');
  const input = element('textarea', 'explorer-field situation-input');
  input.id = 'custom-situation';
  input.name = 'situation';
  input.value = draft;
  input.required = true;
  input.rows = 5;
  input.setAttribute('aria-describedby', 'situation-help situation-error');
  label.htmlFor = input.id;
  const help = element('p', 'section-intro', 'Describe what happened in a sentence or two.');
  help.id = 'situation-help';
  const error = element('p', 'field-error');
  error.id = 'situation-error';
  error.hidden = true;

  const actions = element('div', 'detail-actions');
  const back = link('Back', exploreHref(scope), 'action action-secondary');
  const next = button('Continue', 'action action-primary');
  next.type = 'submit';
  actions.append(back, next);

  input.addEventListener('input', () => {
    onEdit(input.value);
    if (draftSituation(input.value)) {
      error.hidden = true;
      error.textContent = '';
      input.removeAttribute('aria-invalid');
    }
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!draftSituation(input.value)) {
      error.textContent = 'Enter a situation to continue.';
      error.hidden = false;
      input.setAttribute('aria-invalid', 'true');
      input.focus();
      return;
    }
    onEdit(input.value);
    onContinue(exploreHref(scope, CUSTOM_ID, 'situation'));
  });

  form.append(heading('h1', 'page-title', 'Write your own situation'), help, label, input, error, actions);
  view.append(form);
  return view;
}
