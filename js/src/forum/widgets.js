import app from 'flarum/forum/app';
import TopRatedList from './components/TopRatedList';
import { t } from './util';

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

  if ('fof-forum-widgets-core' in flarum.extensions) {
    const widgetsMod = flarum.reg?.get?.('fof-forum-widgets-core', 'common/extend/Widgets');
    const widgetMod = flarum.reg?.get?.('fof-forum-widgets-core', 'common/components/Widget');
    const Widgets = widgetsMod?.default ?? widgetsMod;
    const WidgetBase = widgetMod?.default ?? widgetMod;
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
      .add({ key: 'shelfTopRated', component: ShelfTopRatedWidget, isDisabled: false, isUnique: true, placement: 'end', position: 2 })
      .extend(app, 'ernestdefoe-shelf');
  }
}
