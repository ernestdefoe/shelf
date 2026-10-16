import app from 'flarum/forum/app';
import Page from 'flarum/common/components/Page';
import Button from 'flarum/common/components/Button';
import PageStructure from 'flarum/forum/components/PageStructure';
import IndexSidebar from 'flarum/forum/components/IndexSidebar';
import extractText from 'flarum/common/utils/extractText';
import TopRatedList from './TopRatedList';
import { t } from '../util';

const PERIODS = ['month', 'year', 'all'];

/** /shelf: the best-rated titles this month, this year or ever, by kind. */
export default class TopRatedPage extends Page {
  oninit(vnode) {
    super.oninit(vnode);
    this.period = PERIODS.includes(m.route.param('period')) ? m.route.param('period') : 'month';
    this.kind = m.route.param('kind') || '';
    this.bodyClass = 'App--shelfTop';
    app.history.push('shelf.top', extractText(t('top.title')));
  }

  oncreate(vnode) {
    super.oncreate(vnode);
    app.setTitle(extractText(t('top.title')));
  }

  /** Only the kinds this forum has tagged for Marquee. */
  kinds() {
    return [...new Set(Object.values(app.forum.attribute('marqueeTags') || {}))];
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

  choice(key, value, label) {
    const on = this[key] === value;
    return (
      <Button
        className={on ? 'Button Button--primary' : 'Button'}
        aria-pressed={on ? 'true' : 'false'}
        onclick={() => {
          this[key] = value;
          const params = {};
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
