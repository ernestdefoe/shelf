import app from 'flarum/forum/app';
import UserPage from 'flarum/forum/components/UserPage';
import Button from 'flarum/common/components/Button';
import LoadingIndicator from 'flarum/common/components/LoadingIndicator';
import Placeholder from 'flarum/common/components/Placeholder';
import EntryCard from './EntryCard';
import ListCard from './ListCard';
import ListEditModal from './ListEditModal';
import { t, curioHandlesCollections } from '../util';

const FILTERS = ['all', 'rated', 'done', 'want', 'owned'];

/** The collection filter steps aside when Curio holds collections. */
const filters = () => (curioHandlesCollections() ? FILTERS.filter((key) => key !== 'owned') : FILTERS);
const PAGE = 24;

/** A member's shelf: their lists, then everything they rated or logged. */
export default class ShelfPage extends UserPage {
  oninit(vnode) {
    super.oninit(vnode);
    this.filter = 'all';
    this.entries = [];
    this.lists = null;
    this.loading = true;
    this.more = false;

    this.loadUser(m.route.param('username'));
  }

  show(user) {
    super.show(user);

    if (this.shownFor === user.id()) return;
    this.shownFor = user.id();

    app.store.find('shelf-lists', { filter: { user: user.id() }, page: { limit: 50 } }).then((lists) => {
      this.lists = lists;
      m.redraw();
    });
    this.load(true);
  }

  load(reset) {
    if (reset) {
      this.entries = [];
      this.more = false;
    }
    this.loading = true;

    const filter = { user: this.user.id() };
    if (this.filter !== 'all') filter.status = this.filter;

    return app.store.find('shelf-entries', { filter, page: { offset: this.entries.length, limit: PAGE } }).then((entries) => {
      this.entries.push(...entries);
      this.more = !!(entries.payload && entries.payload.links && entries.payload.links.next);
      this.loading = false;
      m.redraw();
    });
  }

  content() {
    const own = app.session.user === this.user;

    return (
      <div className="ShelfPage">
        <section className="ShelfPage-lists">
          <div className="ShelfPage-heading">
            <h2>{t('profile.lists_heading')}</h2>
            {own && app.forum.attribute('canUseShelf') ? (
              <Button
                className="Button"
                icon="fas fa-plus"
                onclick={() => app.modal.show(ListEditModal, { onsave: (list) => m.route.set(app.route('shelf.list', { id: list.id() })) })}
              >
                {t('lists.new_button')}
              </Button>
            ) : null}
          </div>
          {this.lists === null ? (
            <LoadingIndicator display="block" />
          ) : this.lists.length ? (
            <ul className="ShelfListCards">{this.lists.map(ListCard)}</ul>
          ) : (
            <p className="ShelfPage-none">{t(own ? 'profile.no_lists_own' : 'profile.no_lists')}</p>
          )}
        </section>

        <section className="ShelfPage-entries">
          <div className="ShelfPage-heading">
            <h2>{t('profile.shelf_heading')}</h2>
            <div className="ButtonGroup ShelfPage-filters" role="group">
              {filters().map((key) => (
                <Button
                  className={this.filter === key ? 'Button Button--primary' : 'Button'}
                  aria-pressed={this.filter === key ? 'true' : 'false'}
                  onclick={() => {
                    if (this.filter === key) return;
                    this.filter = key;
                    this.load(true);
                  }}
                >
                  {t(`profile.filter_${key}`)}
                </Button>
              ))}
            </div>
          </div>

          {this.entries.length ? <ul className="ShelfCards">{this.entries.map(EntryCard)}</ul> : null}
          {this.loading ? (
            <LoadingIndicator display="block" />
          ) : !this.entries.length ? (
            <Placeholder text={t(own ? 'profile.empty_own' : 'profile.empty')} />
          ) : this.more ? (
            <div className="ShelfPage-more">
              <Button className="Button" onclick={() => this.load(false)}>
                {t('profile.load_more')}
              </Button>
            </div>
          ) : null}
        </section>
      </div>
    );
  }
}
