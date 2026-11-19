import app from 'flarum/forum/app';
import Page, { type IPageAttrs } from 'flarum/common/components/Page';
import Button from 'flarum/common/components/Button';
import Link from 'flarum/common/components/Link';
import LoadingIndicator from 'flarum/common/components/LoadingIndicator';
import Placeholder from 'flarum/common/components/Placeholder';
import Avatar from 'flarum/common/components/Avatar';
import username from 'flarum/common/helpers/username';
import type Mithril from 'mithril';
import { mediaPoster } from './Poster';
import ListEditModal from './ListEditModal';
import type { ShelfList } from '../models';
import { t, text, titleOf } from '../util';
import { updateList, deleteList } from '../api';
import { moved } from '../reorder';

/** One public list. Its owner can drag titles into order, remove them, rename or delete it. */
export default class ListPage extends Page {
  list: ShelfList | null = null;
  missing = false;
  order: MarqueeMedia[] = [];
  before: MarqueeMedia[] = [];
  dragging: number | null = null;

  oninit(vnode: Mithril.Vnode<IPageAttrs, this>) {
    super.oninit(vnode);

    app.store.find<ShelfList>('shelf-lists', m.route.param('id')).then(
      (list) => {
        this.list = list;
        this.order = (list.media() || []).filter((media): media is MarqueeMedia => !!media);
        app.setTitle(list.name());
        m.redraw();
      },
      () => {
        // app.request already showed the alert; the page says the list is gone.
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

    const own = !!this.list.user() && app.session.user === this.list.user();

    return (
      <div className="container ShelfListPage">
        {this.header(this.list, own)}
        {this.order.length ? (
          <ol className="ShelfCards ShelfCards--list">{this.order.map((media, index) => this.item(media, index, own))}</ol>
        ) : (
          <Placeholder text={t('lists.empty')} />
        )}
      </div>
    );
  }

  header(list: ShelfList, own: boolean) {
    const owner = list.user();
    const canDelete = own || app.forum.attribute<boolean>('canModerateShelf');

    return (
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
    );
  }

  item(media: MarqueeMedia, index: number, own: boolean) {
    return (
      <li
        key={media.id()}
        className={'ShelfCard' + (this.dragging === index ? ' is-dragging' : '')}
        draggable={own ? 'true' : undefined}
        ondragstart={own ? (e: DragEvent) => this.dragStart(e, index) : undefined}
        ondragover={own ? (e: DragEvent) => this.dragOver(e, index) : undefined}
        ondragend={own ? () => this.dragEnd() : undefined}
      >
        <span className="ShelfCard-rank">{index + 1}</span>
        {mediaPoster(media, titleOf(media))}
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
    );
  }

  dragStart(e: DragEvent, index: number) {
    this.dragging = index;
    this.before = this.order.slice();
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(index));
    }
  }

  dragOver(e: DragEvent, index: number) {
    e.preventDefault();
    if (this.dragging === null || this.dragging === index) return;
    this.order = moved(this.order, this.dragging, index);
    this.dragging = index;
  }

  dragEnd() {
    this.dragging = null;
    const ids = this.order.map((media) => Number(media.id()));
    if (ids.join() === this.before.map((media) => Number(media.id())).join()) return;

    this.save({ order: ids }, this.before);
  }

  removeTitle(media: MarqueeMedia) {
    const before = this.order;
    this.order = this.order.filter((item) => item !== media);
    this.save({ remove: Number(media.id()) }, before);
  }

  /** Save a change already shown; put the old order back if it fails. */
  save(attributes: Record<string, unknown>, before: MarqueeMedia[]) {
    updateList(this.list, attributes).catch(() => {
      // app.request already showed the alert.
      this.order = before;
      m.redraw();
    });
  }

  remove() {
    const list = this.list!;
    if (!confirm(text('lists.delete_confirm', { name: list.name() }))) return;
    const owner = list.user();
    deleteList(list).then(() => m.route.set(owner ? app.route('user.shelf', { username: owner.slug() }) : app.route('index')));
  }
}
