import app from 'flarum/forum/app';
import Page from 'flarum/common/components/Page';
import Button from 'flarum/common/components/Button';
import Link from 'flarum/common/components/Link';
import LoadingIndicator from 'flarum/common/components/LoadingIndicator';
import Placeholder from 'flarum/common/components/Placeholder';
import Avatar from 'flarum/common/components/Avatar';
import username from 'flarum/common/helpers/username';
import poster from './Poster';
import ListEditModal from './ListEditModal';
import { t, text, titleOf } from '../util';
import { updateList, deleteList } from '../api';
import { moved } from '../reorder';

/** One public list. Its owner can drag titles into order, remove them, rename or delete it. */
export default class ListPage extends Page {
  oninit(vnode) {
    super.oninit(vnode);
    this.list = null;
    this.order = [];
    this.dragging = null;

    app.store.find('shelf-lists', m.route.param('id')).then(
      (list) => {
        this.list = list;
        this.order = list.media() || [];
        app.setTitle(list.name());
        m.redraw();
      },
      () => {
        this.missing = true;
        m.redraw();
      }
    );
  }

  view() {
    if (this.missing)
      return (
        <div className="container ShelfListPage">
          <Placeholder text={t('lists.missing')} />
        </div>
      );
    if (!this.list) return <LoadingIndicator display="block" />;

    const list = this.list;
    const owner = list.user();
    const own = owner && app.session.user === owner;
    const canDelete = own || app.forum.attribute('canModerateShelf');

    return (
      <div className="container ShelfListPage">
        <header className="ShelfListPage-header">
          <h1>{list.name()}</h1>
          {owner ? (
            <Link className="ShelfListPage-owner" href={app.route('user.shelf', { username: owner.slug() })}>
              <Avatar user={owner} /> {username(owner)}
            </Link>
          ) : null}
          {list.description() ? <p className="ShelfListPage-description">{list.description()}</p> : null}
          <div className="ShelfListPage-controls">
            {own ? (
              <Button className="Button" icon="fas fa-pencil-alt" onclick={() => app.modal.show(ListEditModal, { list })}>
                {t('lists.edit_button')}
              </Button>
            ) : null}
            {canDelete ? (
              <Button className="Button Button--danger" icon="far fa-trash-alt" onclick={() => this.remove()}>
                {t('lists.delete_button')}
              </Button>
            ) : null}
          </div>
          {own && this.order.length > 1 ? <p className="ShelfListPage-hint">{t('lists.drag_hint')}</p> : null}
        </header>

        {this.order.length ? (
          <ol className="ShelfCards ShelfCards--list">
            {this.order.map((media, index) => (
              <li
                key={media.id()}
                className={'ShelfCard' + (this.dragging === index ? ' is-dragging' : '')}
                draggable={own ? 'true' : undefined}
                ondragstart={own ? (e) => this.dragStart(e, index) : undefined}
                ondragover={own ? (e) => this.dragOver(e, index) : undefined}
                ondragend={own ? () => this.dragEnd() : undefined}
              >
                <span className="ShelfCard-rank">{index + 1}</span>
                {poster({ kind: media.kind(), poster: media.poster(), title: titleOf(media), slug: media.attribute('shelfSlug') })}
                <div className="ShelfCard-body">
                  <b className="ShelfCard-title">{titleOf(media)}</b>
                  {own ? (
                    <Button
                      className="Button Button--icon Button--link ShelfCard-remove"
                      icon="fas fa-times"
                      aria-label={text('lists.remove_title', { title: titleOf(media) })}
                      onclick={() => this.removeTitle(media)}
                    />
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <Placeholder text={t('lists.empty')} />
        )}
      </div>
    );
  }

  dragStart(e, index) {
    this.dragging = index;
    this.before = this.order.slice();
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  }

  dragOver(e, index) {
    e.preventDefault();
    if (this.dragging === null || this.dragging === index) return;
    this.order = moved(this.order, this.dragging, index);
    this.dragging = index;
  }

  dragEnd() {
    this.dragging = null;
    const ids = this.order.map((media) => Number(media.id()));
    if (ids.join() === this.before.map((media) => Number(media.id())).join()) return;

    const before = this.before;
    updateList(this.list, { order: ids }).catch(() => {
      this.order = before;
      m.redraw();
    });
  }

  removeTitle(media) {
    const before = this.order;
    this.order = this.order.filter((m) => m !== media);
    updateList(this.list, { remove: Number(media.id()) }).catch(() => {
      this.order = before;
      m.redraw();
    });
  }

  remove() {
    if (!confirm(text('lists.delete_confirm', { name: this.list.name() }))) return;
    const owner = this.list.user();
    deleteList(this.list).then(() => m.route.set(owner ? app.route('user.shelf', { username: owner.slug() }) : app.route('index')));
  }
}
