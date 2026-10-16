import app from 'flarum/forum/app';
import Component from 'flarum/common/Component';
import LoadingIndicator from 'flarum/common/components/LoadingIndicator';
import poster from './Poster';
import Stars from './Stars';
import { read } from '../topStore';
import { topRated } from '../api';
import { t } from '../util';

const name = (item) => {
  const base = item.artist ? `${item.artist} – ${item.title}` : item.title;
  return item.year ? `${base} (${item.year})` : base;
};

/**
 * The best-rated titles for a period. A reader of the shared top-rated store,
 * so it is safe to re-create on every redraw.
 */
export default class TopRatedList extends Component {
  view() {
    const { period = 'month', kind = '', limit = 10, compact } = this.attrs;
    const state = read({ period, kind: kind || undefined, limit }, topRated, () => m.redraw());

    if (state.items === null) return <LoadingIndicator display="block" />;
    if (!state.items.length) return <p className="ShelfTop-empty">{t(state.failed ? 'top.failed' : `top.empty_${period}`)}</p>;

    return (
      <ol className={compact ? 'ShelfTop ShelfTop--compact' : 'ShelfTop'}>
        {state.items.map((item, index) => (
          <li className="ShelfTop-item" key={item.id}>
            <span className="ShelfTop-rank">{index + 1}</span>
            {poster({ kind: item.kind, poster: item.poster, title: name(item), slug: item.discussionSlug, size: compact ? 'w92' : 'w185' })}
            <div className="ShelfTop-body">
              {item.discussionSlug ? (
                <a className="ShelfTop-title" href={app.route('discussion', { id: item.discussionSlug })} onclick={navigate}>
                  {name(item)}
                </a>
              ) : (
                <span className="ShelfTop-title">{name(item)}</span>
              )}
              <span className="ShelfTop-score">
                <Stars value={Math.round(item.average * 2)} size="small" /> <b>{item.average.toFixed(1)}</b>{' '}
                <small>{t('card.ratings', { count: item.count, formatted: item.count })}</small>
              </span>
              {compact ? null : <span className="ShelfTop-kind">{t(`kind.${item.kind}`)}</span>}
            </div>
          </li>
        ))}
      </ol>
    );
  }
}

/** Route in-app on a plain click; let modified clicks open a tab. */
function navigate(e) {
  if (e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1) return;
  e.preventDefault();
  m.route.set(e.currentTarget.getAttribute('href'));
}
