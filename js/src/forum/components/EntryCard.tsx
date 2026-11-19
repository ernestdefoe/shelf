import { mediaPoster } from './Poster';
import Stars from './Stars';
import type { Entry } from '../models';
import { t, verb, date, titleOf, curioHandlesCollections } from '../util';

/** One title on a member's shelf: poster, name, their stars and when they got to it. */
export default function EntryCard(entry: Entry) {
  const media = entry.media();
  if (!media) return null;

  const v = verb(media.kind());
  const status = entry.status();

  return (
    <li className="ShelfCard">
      {mediaPoster(media, titleOf(media))}
      <div className="ShelfCard-body">
        <b className="ShelfCard-title">{titleOf(media)}</b>
        {entry.rating() ? <Stars value={entry.rating()} size="small" /> : null}
        {entry.owned() && !curioHandlesCollections() ? (
          <span className="ShelfCard-status ShelfCard-status--owned">
            <i className="fas fa-box-archive" aria-hidden="true" /> {t('status.owned')}
          </span>
        ) : null}
        {status ? (
          <span className={`ShelfCard-status ShelfCard-status--${status}`}>
            {status === 'done' && entry.doneOn() ? t(`card.done_on_${v}`, { date: date(entry.doneOn()) }) : t(`status.${status}_${v}`)}
          </span>
        ) : null}
      </div>
    </li>
  );
}
