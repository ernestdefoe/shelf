import app from 'flarum/forum/app';
import Component from 'flarum/common/Component';
import Dropdown from 'flarum/common/components/Dropdown';
import Button from 'flarum/common/components/Button';
import Separator from 'flarum/common/components/Separator';
import abbreviateNumber from 'flarum/common/utils/abbreviateNumber';
import Stars from './Stars';
import { saveEntry } from '../api';
import { reaverage } from '../rating';
import { t, text, verb, canShelve, date } from '../util';

/**
 * On a Marquee card: the members' average, the viewer's own stars, and the
 * shelf menu (want to …, log it with a date, add to a list, remove).
 */
export default class ShelfControl extends Component {
  oninit(vnode) {
    super.oninit(vnode);
    this.saving = false;
  }

  shelf() {
    return this.attrs.media.attribute('shelf') || { average: null, count: 0, mine: null };
  }

  /** Apply a change now, save it, and put things back if the save fails. */
  change(changes) {
    const media = this.attrs.media;
    const before = this.shelf();
    const mine = before.mine;
    const optimistic = { ...(mine || {}), ...changes };
    const after = 'rating' in changes ? reaverage(before, mine?.rating, changes.rating) : before;

    media.pushAttributes({ shelf: { ...after, mine: optimistic.rating || optimistic.status || optimistic.owned ? optimistic : null } });
    this.saving = true;

    return saveEntry(media.id(), mine, changes)
      .then(
        (saved) => media.pushAttributes({ shelf: { ...this.shelf(), mine: saved } }),
        () => media.pushAttributes({ shelf: before })
      )
      .finally(() => {
        this.saving = false;
        m.redraw();
      });
  }

  view() {
    const { media } = this.attrs;
    const shelf = this.shelf();
    const mine = shelf.mine;
    const kind = media.kind();
    const v = verb(kind);

    return (
      <div className="ShelfControl">
        {shelf.count ? (
          <span className="ShelfControl-average" title={text('card.average_title', { count: shelf.count })}>
            <i className="fas fa-star" aria-hidden="true" /> <b>{shelf.average.toFixed(1)}</b>{' '}
            <small>{t('card.ratings', { count: shelf.count, formatted: abbreviateNumber(shelf.count) })}</small>
          </span>
        ) : null}

        {canShelve() ? <Stars value={mine?.rating} label={text('card.rate_label')} onchange={(rating) => this.change({ rating })} /> : null}

        {canShelve() ? (
          <Dropdown
            className="ShelfControl-menu"
            buttonClassName={mine?.status || mine?.owned ? 'Button ShelfControl-button is-on' : 'Button ShelfControl-button'}
            icon={
              mine?.status === 'done'
                ? 'fas fa-check'
                : mine?.status === 'want'
                  ? 'fas fa-bookmark'
                  : mine?.owned
                    ? 'fas fa-box-archive'
                    : 'fas fa-layer-group'
            }
            label={mine?.status ? t(`status.${mine.status}_${v}`) : mine?.owned ? t('status.owned') : t('card.add_to_shelf')}
            accessibleToggleLabel={text('card.add_to_shelf')}
          >
            {this.menuItems(mine, v)}
          </Dropdown>
        ) : null}
      </div>
    );
  }

  menuItems(mine, v) {
    const media = this.attrs.media;
    const items = [
      <Button
        icon={mine?.status === 'want' ? 'fas fa-check' : 'far fa-bookmark'}
        onclick={() => this.change({ status: mine?.status === 'want' ? null : 'want' })}
      >
        {t(`menu.want_${v}`)}
      </Button>,
      <Button
        icon={mine?.status === 'done' ? 'fas fa-check' : 'far fa-calendar-check'}
        onclick={() =>
          app.modal.show(() => import('./LogModal'), { media, entry: mine, onsave: (doneOn) => this.change({ status: 'done', doneOn }) })
        }
      >
        {mine?.status === 'done' && mine.doneOn ? t(`menu.done_on_${v}`, { date: date(mine.doneOn) }) : t(`menu.log_${v}`)}
      </Button>,
      <Button icon={mine?.owned ? 'fas fa-check' : 'fas fa-box-archive'} onclick={() => this.change({ owned: !mine?.owned })}>
        {t('menu.collection')}
      </Button>,
      <Button icon="fas fa-list" onclick={() => app.modal.show(() => import('./AddToListModal'), { media })}>
        {t('menu.add_to_list')}
      </Button>,
    ];

    if (mine) {
      items.push(
        <Separator />,
        <Button icon="fas fa-times" onclick={() => this.change({ rating: null, status: null, doneOn: null, owned: false })}>
          {t('menu.remove')}
        </Button>
      );
    }

    return items;
  }
}
