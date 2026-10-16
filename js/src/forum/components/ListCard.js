import app from 'flarum/forum/app';
import Link from 'flarum/common/components/Link';
import posterUrl from 'ext:ernestdefoe/marquee/forum/utils/posterUrl';
import { t } from '../util';

/** A list as a card: up to four posters fanned out, its name and size. */
export default function ListCard(list) {
  const preview = list.preview() || [];

  return (
    <li className="ShelfListCard">
      <Link href={app.route('shelf.list', { id: list.id() })}>
        <span className="ShelfListCard-stack" aria-hidden="true">
          {preview.length ? (
            preview.map((p) => (p.poster ? <img src={posterUrl(p.poster, 'w92')} alt="" loading="lazy" decoding="async" /> : <span />))
          ) : (
            <span className="ShelfListCard-empty" />
          )}
        </span>
        <b>{list.name()}</b>
        <small>{t('lists.items', { count: list.itemCount() })}</small>
      </Link>
    </li>
  );
}
