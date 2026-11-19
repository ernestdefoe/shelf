import app from 'flarum/forum/app';
import Link from 'flarum/common/components/Link';
import posterUrl from 'ext:ernestdefoe/marquee/forum/utils/posterUrl';

export interface PosterOptions {
  kind: string;
  poster: string | null;
  title: string;
  slug?: string | null;
  size?: string;
}

/**
 * A title's poster, linking to the busiest discussion about it the viewer can
 * see (or to nothing). Square for albums, portrait for everything else.
 */
export default function poster({ kind, poster, title, slug, size = 'w185' }: PosterOptions) {
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

/** A title's poster from the store's model. */
export function mediaPoster(media: MarqueeMedia, title: string) {
  return poster({ kind: media.kind(), poster: media.poster(), title, slug: media.attribute<string | null>('shelfSlug') });
}
