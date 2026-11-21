export function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className = '',
  content?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.className = className;
  if (content !== undefined) node.textContent = content;
  return node;
}

export function icon(name: string, className = ''): HTMLElement {
  const node = element('span', `ph ph-${name} ${className}`.trim());
  node.setAttribute('aria-hidden', 'true');
  return node;
}

export function link(text: string, href: string, className = ''): HTMLAnchorElement {
  const node = element('a', className, text);
  node.href = href;
  return node;
}

export function button(text: string, className = ''): HTMLButtonElement {
  const node = element('button', className, text);
  node.type = 'button';
  return node;
}

export function heading(tag: 'h1' | 'h2', className: string, text: string): HTMLHeadingElement {
  const node = element(tag, className, text);
  node.tabIndex = -1;
  return node;
}
