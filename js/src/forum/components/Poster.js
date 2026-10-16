import app from 'flarum/forum/app';
import Link from 'flarum/common/components/Link';
import posterUrl from 'ext:ernestdefoe/marquee/forum/utils/posterUrl';

/**
 * A title's poster, linking to the busiest discussion about it the viewer can
 * see (or to nothing). Square for albums, portrait for everything else.
 */
export default function poster({ kind, poster, title, slug, size = 'w185' }) {
  const img = poster ? (
    <img src={posterUrl(poster, size)} alt="" loading="lazy" decoding="async" />
  ) : (
    <span className="ShelfPoster-blank" aria-hidden="true" />
  );
  const className = `ShelfPoster ShelfPoster--${kind}`;

  return slug ? (
    <Link className={className} href={app.route('discussion', { id: slug })} aria-label={title}>
      {img}
    </Link>
  ) : (
    <span className={className}>{img}</span>
  );
}
