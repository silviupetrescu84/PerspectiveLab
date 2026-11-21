import { exploreHref, type Route } from '../lib/navigation';
import { element, icon, link } from './elements';

export function siteHeader(): HTMLElement {
  const shell = element('div', 'shell header-content');
  const brand = link('', '#/', 'brand');
  const mark = element('span', 'brand-mark');
  mark.setAttribute('aria-hidden', 'true');
  mark.append(element('span'), element('span'));
  brand.append(mark, element('span', 'brand-name', 'Perspective Lab'));

  const nav = element('nav', 'site-nav');
  nav.setAttribute('aria-label', 'Main navigation');
  const home = link('Home', '#/', 'nav-link nav-home');
  home.dataset.page = 'home';
  const explore = link('Explore', exploreHref(), 'nav-link');
  explore.dataset.page = 'explore';
  const saved = link('Saved', '#/saved', 'nav-link nav-saved');
  saved.dataset.page = 'saved';
  saved.prepend(icon('bookmark-simple'));
  nav.append(home, explore, saved);
  shell.append(brand, nav);
  return shell;
}

export function highlightNavigation(header: HTMLElement, page: Route['page']) {
  for (const item of header.querySelectorAll<HTMLElement>('[data-page]')) {
    if (item.dataset.page === page) item.setAttribute('aria-current', 'page');
    else item.removeAttribute('aria-current');
  }
}
