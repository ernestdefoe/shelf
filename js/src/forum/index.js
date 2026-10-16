import app from 'flarum/forum/app';
import { extend } from 'flarum/common/extend';
import LinkButton from 'flarum/common/components/LinkButton';
import UserPage from 'flarum/forum/components/UserPage';
import IndexSidebar from 'flarum/forum/components/IndexSidebar';
import MediaHero from 'ext:ernestdefoe/marquee/forum/components/MediaHero';
import { Entry, ShelfList } from './models';
import ShelfControl from './components/ShelfControl';
import registerWidgets from './widgets';
import { t } from './util';

app.initializers.add('ernestdefoe-shelf', () => {
  app.store.models['shelf-entries'] = Entry;
  app.store.models['shelf-lists'] = ShelfList;

  // Pages load on first visit, not with every forum page.
  app.routes['shelf.top'] = { path: '/shelf', component: () => import('./components/TopRatedPage') };
  app.routes['shelf.list'] = { path: '/shelf/lists/:id', component: () => import('./components/ListPage') };
  app.routes['user.shelf'] = { path: '/u/:username/shelf', component: () => import('./components/ShelfPage') };

  // Every Marquee card: the members' stars, yours, and the shelf menu.
  extend(MediaHero.prototype, 'actionItems', function (items) {
    const media = this.attrs.link.media;
    if (media.attribute('shelf') === undefined) return;
    items.add('shelf', <ShelfControl media={media} />, 70);
  });

  extend(UserPage.prototype, 'navItems', function (items) {
    if (!this.user) return;
    items.add(
      'shelf',
      <LinkButton href={app.route('user.shelf', { username: this.user.slug() })} icon="fas fa-layer-group">
        {t('profile.nav')}
      </LinkButton>,
      85
    );
  });

  extend(IndexSidebar.prototype, 'navItems', function (items) {
    items.add(
      'shelfTop',
      <LinkButton href={app.route('shelf.top')} icon="fas fa-ranking-star">
        {t('top.nav')}
      </LinkButton>,
      85
    );
  });

  registerWidgets();
});
