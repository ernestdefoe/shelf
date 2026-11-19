import app from 'flarum/forum/app';
import Page, { type IPageAttrs } from 'flarum/common/components/Page';
import Button from 'flarum/common/components/Button';
import PageStructure from 'flarum/forum/components/PageStructure';
import IndexSidebar from 'flarum/forum/components/IndexSidebar';
import extractText from 'flarum/common/utils/extractText';
import type Mithril from 'mithril';
import TopRatedList from './TopRatedList';
import { t } from '../util';

const PERIODS = ['month', 'year', 'all'];

/** /shelf: the best-rated titles this month, this year or ever, by kind. */
export default class TopRatedPage extends Page {
  period = 'month';
  kind = '';

  oninit(vnode: Mithril.Vnode<IPageAttrs, this>) {
    super.oninit(vnode);
    const period = m.route.param('period');
    this.period = PERIODS.includes(period) ? period : 'month';
    this.kind = m.route.param('kind') || '';
    this.bodyClass = 'App--shelfTop';
    app.history.push('shelf.top', extractText(t('top.title')));
  }

  oncreate(vnode: Mithril.VnodeDOM<IPageAttrs, this>) {
    super.oncreate(vnode);
    app.setTitle(extractText(t('top.title')));
  }

  /** Only the kinds this forum has tagged for Marquee. */
  kinds(): string[] {
    return [...new Set(Object.values(app.forum.attribute<Record<string, string> | null>('marqueeTags') || {}))];
  }

  view() {
    const kinds = this.kinds();

    return (
      <PageStructure className="ShelfTopPage" sidebar={() => <IndexSidebar />}>
        <div className="IndexPage-toolbar ShelfTopPage-toolbar">
          <h2 className="ShelfTopPage-title">{t(`top.heading_${this.period}`)}</h2>
          <div className="ButtonGroup" role="group" aria-label={extractText(t('top.period_label'))}>
            {PERIODS.map((period) => this.choice('period', period, t(`top.period_${period}`)))}
          </div>
          {kinds.length > 1 ? (
            <div className="ButtonGroup" role="group" aria-label={extractText(t('top.kind_label'))}>
              {this.choice('kind', '', t('top.kind_all'))}
              {kinds.map((kind) => this.choice('kind', kind, t(`kind.${kind}_plural`)))}
            </div>
          ) : null}
        </div>
        <TopRatedList period={this.period} kind={this.kind} limit={25} />
      </PageStructure>
    );
  }

  choice(key: 'period' | 'kind', value: string, label: Mithril.Children) {
    const on = this[key] === value;
    return (
      <Button
        className={on ? 'Button Button--primary' : 'Button'}
        aria-pressed={on ? 'true' : 'false'}
        onclick={() => {
          this[key] = value;
          const params: Record<string, string> = {};
          if (this.period !== 'month') params.period = this.period;
          if (this.kind) params.kind = this.kind;
          window.history.replaceState(null, '', app.route('shelf.top', params));
        }}
      >
        {label}
      </Button>
    );
  }
}
