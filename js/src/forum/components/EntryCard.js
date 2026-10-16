import poster from './Poster';
import Stars from './Stars';
import { t, verb, date, titleOf } from '../util';

/** One title on a member's shelf: poster, name, their stars and when they got to it. */
export default function EntryCard(entry) {
  const media = entry.media();
  if (!media) return null;

  const v = verb(media.kind());

  return (
    <li className="ShelfCard">
      {poster({ kind: media.kind(), poster: media.poster(), title: titleOf(media), slug: media.attribute('shelfSlug') })}
      <div className="ShelfCard-body">
        <b className="ShelfCard-title">{titleOf(media)}</b>
        {entry.rating() ? <Stars value={entry.rating()} size="small" /> : null}
        {entry.owned() ? (
          <span className="ShelfCard-status ShelfCard-status--owned">
            <i className="fas fa-box-archive" aria-hidden="true" /> {t('status.owned')}
          </span>
        ) : null}
        {entry.status() ? (
          <span className={`ShelfCard-status ShelfCard-status--${entry.status()}`}>
            {entry.status() === 'done' && entry.doneOn()
              ? t(`card.done_on_${v}`, { date: date(entry.doneOn()) })
              : t(`status.${entry.status()}_${v}`)}
          </span>
        ) : null}
      </div>
    </li>
  );
}
