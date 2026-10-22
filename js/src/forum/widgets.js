import app from 'flarum/forum/app';
import TopRatedList from './components/TopRatedList';
import { t } from './util';
import { read } from './topStore';
import { topRated } from './api';
import { fof, hasFofWidgets, placed } from '../common/fofWidgets';

/**
 * Offer the top-rated list to the widget hosts a forum may run: Bespoke and
 * fof/forum-widgets-core. Neither is a build dependency; each is found at run
 * time, so the bundle is the same with both, one or none installed, and a host
 * whose internals moved is skipped instead of taking the forum's JS down.
 * Registering only offers the widget: the /shelf page and its sidebar link are
 * there whether or not anybody places it.
 */
export default function registerWidgets() {
  const flarum = globalThis.flarum;
  if (!flarum || !flarum.extensions) return;

  if ('ernestdefoe-bespoke' in flarum.extensions) {
    globalThis.BespokeWidgetQueue = globalThis.BespokeWidgetQueue || [];
    globalThis.BespokeWidgetQueue.push({
      type: 'shelf-top-rated',
      // Bespoke resolves dotted keys itself, in the reader's language.
      label: 'ernestdefoe-shelf.forum.widget.label',
      icon: 'fas fa-star',
      zones: ['sidebar', 'above-list', 'below-list', 'footer'],
      schema: [
        { key: 'title', type: 'text', label: 'ernestdefoe-shelf.forum.widget.field_title', default: '' },
        {
          key: 'period',
          type: 'select',
          label: 'ernestdefoe-shelf.forum.widget.field_period',
          default: 'month',
          options: ['month', 'year', 'all'].map((value) => ({ value, label: `ernestdefoe-shelf.forum.top.period_${value}` })),
        },
        { key: 'limit', type: 'number', label: 'ernestdefoe-shelf.forum.widget.field_limit', default: 5 },
      ],
      component: {
        view(vnode) {
          const s = vnode.attrs.settings || {};
          return (
            <div className="ShelfWidget">
              <h4 className="ShelfWidget-title">{s.title || t(`top.heading_${s.period || 'month'}`)}</h4>
              <TopRatedList period={s.period || 'month'} limit={Math.max(1, Math.min(25, Number(s.limit) || 5))} compact />
            </div>
          );
        },
      },
    });
  }

  if (hasFofWidgets() && app.widgets) {
    const Widgets = fof('common/extend/Widgets');
    const WidgetBase = fof('common/components/Widget');
    if (!Widgets || !WidgetBase) return;

    class ShelfTopRatedWidget extends WidgetBase {
      className() {
        return 'ShelfWidget ShelfWidget--fof';
      }

      icon() {
        return 'fas fa-star';
      }

      title() {
        return t('top.heading_month');
      }

      content() {
        return <TopRatedList period="month" limit={5} compact />;
      }
    }

    new Widgets()
      .add({
        key: 'shelfTopRated',
        component: ShelfTopRatedWidget,
        // 🚨 Opt-in: only where the admin placed it in FoF's layout editor (see
        // common/fofWidgets.js), and only once this month's list has titles in
        // it — the same shared query TopRatedList reads, so no extra request.
        isDisabled: () =>
          !placed(app, 'ernestdefoe-shelf', 'shelfTopRated') || !read({ period: 'month', limit: 5 }, topRated, () => m.redraw()).items?.length,
        isUnique: true,
        placement: 'end',
        position: 2,
      })
      .extend(app, 'ernestdefoe-shelf');
  }
}
