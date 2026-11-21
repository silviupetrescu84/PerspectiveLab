import { button, element, link } from '../../components/elements';
import { BELIEF_RATINGS, interpretationErrors, type InitialInterpretation } from '../../lib/interpretation';

interface InterpretationFormOptions {
  initial: InitialInterpretation;
  backHref: string;
  onChange: (update: Partial<InitialInterpretation>) => void;
  onContinue: () => void;
}

function fieldError(id: string): HTMLParagraphElement {
  const error = element('p', 'field-error');
  error.id = id;
  error.hidden = true;
  return error;
}

function showError(control: HTMLElement, error: HTMLParagraphElement, message: string) {
  error.textContent = message;
  error.hidden = !message;
  if (message) control.setAttribute('aria-invalid', 'true');
  else control.removeAttribute('aria-invalid');
}

export function interpretationForm({ initial, backHref, onChange, onContinue }: InterpretationFormOptions): HTMLFormElement {
  const form = element('form', 'interpretation-form');
  form.noValidate = true;
  const label = element('label', 'field-label', 'Your initial interpretation');
  const text = element('textarea', 'explorer-field situation-input interpretation-input');
  text.id = 'interpretation-text';
  text.name = 'interpretation';
  text.rows = 4;
  text.required = true;
  text.value = initial.text;
  label.htmlFor = text.id;
  const textError = fieldError('interpretation-error');
  text.setAttribute('aria-describedby', textError.id);

  const ratingGroup = element('fieldset', 'belief-group');
  const legend = element('legend', 'field-label', 'How strongly do you believe this interpretation?');
  const choices = element('div', 'belief-choices');
  const scale = element('div', 'belief-scale');
  const beliefError = fieldError('belief-error');
  scale.setAttribute('aria-hidden', 'true');
  scale.append(element('span', '', 'Not at all'), element('span', '', 'Very strongly'));
  ratingGroup.setAttribute('aria-describedby', beliefError.id);

  const radios = BELIEF_RATINGS.map((rating) => {
    const option = element('label', 'belief-option');
    const radio = element('input', 'visually-hidden');
    radio.type = 'radio';
    radio.name = 'belief';
    radio.value = String(rating);
    radio.required = true;
    radio.checked = initial.belief === rating;
    if (rating === 1) radio.setAttribute('aria-label', '1, Not at all');
    if (rating === 5) radio.setAttribute('aria-label', '5, Very strongly');
    option.append(radio, element('span', 'belief-number', String(rating)));
    choices.append(option);
    return { radio, rating };
  });
  ratingGroup.append(legend, choices, scale, beliefError);

  const actions = element('div', 'detail-actions');
  const next = button('Continue', 'action action-primary');
  next.type = 'submit';
  actions.append(link('Back', backHref, 'action action-secondary'), next);

  let attempted = false;
  const current = (): InitialInterpretation => ({
    text: text.value,
    belief: radios.find(({ radio }) => radio.checked)?.rating ?? null,
  });

  function showErrors(value: InitialInterpretation) {
    const errors = interpretationErrors(value);
    showError(text, textError, errors.text);
    showError(ratingGroup, beliefError, errors.belief);
    return errors;
  }

  text.addEventListener('input', () => {
    const value = current();
    onChange({ text: value.text });
    if (attempted) showErrors(value);
  });
  ratingGroup.addEventListener('change', () => {
    const value = current();
    onChange({ belief: value.belief });
    if (attempted) showErrors(value);
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    attempted = true;
    const value = current();
    const errors = showErrors(value);
    if (errors.text || errors.belief) {
      if (errors.text) text.focus();
      else radios[0]?.radio.focus();
      return;
    }
    onChange(value);
    onContinue();
  });

  form.append(label, text, textError, ratingGroup, actions);
  return form;
}
