import heroUrl from '../../assets/perspective-glass.webp';
import { categoryCard } from '../../components/category-card';
import { element, heading, icon, link } from '../../components/elements';
import { categories } from '../../lib/catalog';
import { exploreHref } from '../../lib/navigation';

export function homeView(): DocumentFragment {
  const hero = element('section', 'hero');
  const layout = element('div', 'shell hero-layout');
  const copy = element('div', 'hero-copy');
  const title = heading('h1', 'hero-title', 'See things');
  title.append(' ', element('em', '', 'differently.'));
  const start = link('Start Exploring', exploreHref(), 'action action-primary');
  start.prepend(icon('compass'));
  copy.append(
    title,
    element('p', 'hero-intro', 'The same situation can tell more than one story. Explore everyday moments and discover what changes when you look at them from another angle.'),
    start,
  );

  const art = element('div', 'hero-art');
  const image = element('img');
  image.src = heroUrl;
  image.alt = '';
  image.width = 1200;
  image.height = 800;
  image.fetchPriority = 'high';
  art.append(image);
  layout.append(copy, art);
  hero.append(layout);

  const library = element('section', 'shell category-section');
  library.setAttribute('aria-labelledby', 'categories-heading');
  const libraryTitle = heading('h2', 'section-title', 'Explore by category');
  libraryTitle.id = 'categories-heading';
  const grid = element('ul', 'category-grid');
  grid.setAttribute('role', 'list');
  grid.append(...categories.map(categoryCard));
  library.append(
    libraryTitle,
    element('p', 'section-intro', 'Pick a part of life you’d like to see from a new angle.'),
    grid,
  );

  const content = document.createDocumentFragment();
  content.append(hero, library);
  return content;
}
