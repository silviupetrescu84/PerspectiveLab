import './styles/fonts.css';
import './styles/base.css';
import './styles/components.css';
import './features/home/home.css';
import './features/explorer/explorer.css';
import './features/saved/saved.css';
import { highlightNavigation, siteHeader } from './components/header';
import { explorerView } from './features/explorer/view';
import { homeView } from './features/home/view';
import { savedView } from './features/saved/view';
import { exploreHref, getExploration, readRoute } from './lib/navigation';
import { browserStorage, createPreferences, STORAGE_KEY } from './lib/preferences';

const header = document.querySelector<HTMLElement>('#site-header')!;
const main = document.querySelector<HTMLElement>('#main')!;
const announcement = document.querySelector<HTMLElement>('#announcement')!;
const storage = browserStorage();
const preferences = createPreferences(storage);

header.append(siteHeader());
document.querySelector('.skip-link')?.addEventListener('click', (event) => {
  event.preventDefault();
  main.focus();
});

function renderSaved() {
  const view = savedView(preferences.savedIds(), (id, index) => {
    preferences.toggleSaved(id);
    renderSaved();
    const remaining = main.querySelectorAll<HTMLButtonElement>('.remove-button');
    const focus = remaining[Math.min(index, remaining.length - 1)] ?? main.querySelector('h1');
    focus?.focus();
    announcement.textContent = 'Situation removed from Saved.';
  });
  main.replaceChildren(view);
}

function render(focusHeading = false) {
  const route = readRoute(window.location.hash);
  highlightNavigation(header, route.page);
  announcement.textContent = '';
  if (route.page === 'home') {
    document.title = 'Perspective Lab';
    main.replaceChildren(homeView());
    if (route.section === 'categories') {
      const categories = main.querySelector<HTMLElement>('#categories-heading');
      if (focusHeading) categories?.focus({ preventScroll: true });
      categories?.scrollIntoView({ block: 'start' });
      return;
    }
  } else if (route.page === 'saved') {
    document.title = 'Saved situations | Perspective Lab';
    renderSaved();
  } else {
    const { scope, id } = route;
    const selection = getExploration(scope, id, preferences.lastViewed(scope));
    const current = selection.current;
    if (current) {
      const canonical = exploreHref(scope, current.id);
      if (window.location.hash !== canonical) window.history.replaceState(null, '', canonical);
      preferences.remember(scope, current.id);
    }
    document.title = `${selection.category?.name ?? 'Explore'} | Perspective Lab`;
    main.replaceChildren(explorerView({
      scope,
      selection,
      saved: current !== undefined && preferences.isSaved(current.id),
      onToggleSave: () => {
        if (!current) return false;
        const saved = preferences.toggleSaved(current.id);
        announcement.textContent = saved ? 'Situation added to Saved.' : 'Situation removed from Saved.';
        return saved;
      },
    }));
  }
  if (focusHeading) {
    window.scrollTo({ top: 0, behavior: 'instant' });
    main.querySelector('h1')?.focus({ preventScroll: true });
  }
}

window.addEventListener('hashchange', () => render(true));
window.addEventListener('storage', (event) => {
  if (event.storageArea !== storage || (event.key !== null && event.key !== STORAGE_KEY)) return;
  preferences.refresh();
  const route = readRoute(window.location.hash);
  if (route.page === 'saved') {
    const focused = main.contains(document.activeElement);
    renderSaved();
    if (focused) main.querySelector('h1')?.focus({ preventScroll: true });
  } else if (route.page === 'explore' && route.id) {
    const save = main.querySelector<HTMLButtonElement>('.save-button');
    save?.setAttribute('aria-pressed', String(preferences.isSaved(route.id)));
  }
});
render();
