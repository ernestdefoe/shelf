import app from 'flarum/forum/app';
import { extend } from 'flarum/common/extend';
import LinkButton from 'flarum/common/components/LinkButton';
import UserPage from 'flarum/forum/components/UserPage';
import IndexSidebar from 'flarum/forum/components/IndexSidebar';
import MediaHero from 'ext:ernestdefoe/marquee/forum/components/MediaHero';
import ShelfControl from './components/ShelfControl';
import registerWidgets from './widgets';
import { t } from './util';

export { default as extend } from './extend';

app.initializers.add('ernestdefoe-shelf', () => {
  // Every Marquee card: the members' stars, yours, and the shelf menu.
  extend(MediaHero.prototype, 'actionItems', function (this: MediaHero, items) {
    const media = this.attrs.link.media;
    if (media.attribute('shelf') === undefined) return;
    items.add('shelf', <ShelfControl media={media} />, 70);
  });

  extend(UserPage.prototype, 'navItems', function (this: UserPage, items) {
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
