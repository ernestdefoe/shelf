import app from 'flarum/forum/app';
import UserPage, { type IUserPageAttrs } from 'flarum/forum/components/UserPage';
import Button from 'flarum/common/components/Button';
import LoadingIndicator from 'flarum/common/components/LoadingIndicator';
import Placeholder from 'flarum/common/components/Placeholder';
import type User from 'flarum/common/models/User';
import type Mithril from 'mithril';
import EntryCard from './EntryCard';
import ListCard from './ListCard';
import ListEditModal from './ListEditModal';
import type { Entry, ShelfList } from '../models';
import { t, curioHandlesCollections } from '../util';

const FILTERS = ['all', 'rated', 'done', 'want', 'owned'];

/** The collection filter steps aside when Curio holds collections. */
const filters = () => (curioHandlesCollections() ? FILTERS.filter((key) => key !== 'owned') : FILTERS);
const PAGE = 24;

/** A member's shelf: their lists, then everything they rated or logged. */
export default class ShelfPage extends UserPage {
  filter = 'all';
  entries: Entry[] = [];
  lists: ShelfList[] | null = null;
  loading = true;
  more = false;
  shownFor: string | null = null;

  oninit(vnode: Mithril.Vnode<IUserPageAttrs, this>) {
    super.oninit(vnode);
    this.loadUser(m.route.param('username'));
  }

  show(user: User) {
    super.show(user);

    if (this.shownFor === user.id()) return;
    this.shownFor = user.id() ?? null;

    app.store.find<ShelfList[]>('shelf-lists', { filter: { user: user.id()! }, page: { limit: 50 } }).then(
      (lists) => {
        this.lists = lists;
        m.redraw();
      },
      () => {
        // app.request already showed the alert; stop the spinner.
        this.lists = [];
        m.redraw();
      }
    );
    this.load(true);
  }

  load(reset: boolean) {
    if (reset) {
      this.entries = [];
      this.more = false;
    }
    this.loading = true;

    const filter: Record<string, string> = { user: this.user!.id()! };
    if (this.filter !== 'all') filter.status = this.filter;

    return app.store.find<Entry[]>('shelf-entries', { filter, page: { offset: this.entries.length, limit: PAGE } }).then(
      (entries) => {
        this.entries.push(...entries);
        this.more = !!entries.payload?.links?.next;
        this.loading = false;
        m.redraw();
      },
      () => {
        // app.request already showed the alert; stop the spinner.
        this.loading = false;
        m.redraw();
      }
    );
  }

  content() {
    const own = app.session.user === this.user;

    return (
      <div className="ShelfPage">
        {this.listsSection(own)}
        {this.entriesSection(own)}
      </div>
    );
  }

  listsSection(own: boolean) {
    return (
      <section className="ShelfPage-lists">
        <div className="ShelfPage-heading">
          <h2>{t('profile.lists_heading')}</h2>
          {own && app.forum.attribute<boolean>('canUseShelf') ? (
            <Button
              className="Button"
              icon="fas fa-plus"
              onclick={() => app.modal.show(ListEditModal, { onsave: (list: ShelfList) => m.route.set(app.route('shelf.list', { id: list.id() })) })}
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
    );
  }

  entriesSection(own: boolean) {
    return (
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
    );
  }
}
