import app from 'flarum/forum/app';
import extractText from 'flarum/common/utils/extractText';

export const t = (key: string, params: Record<string, unknown> = {}) => app.translator.trans(`ernestdefoe-shelf.forum.${key}`, params);
export const text = (key: string, params: Record<string, unknown> = {}) => extractText(t(key, params));

/** What "done" and "want" are called for a kind: watched, read, played, listened. */
export const verb = (kind: string): string => ({ book: 'read', game: 'play', music: 'listen' })[kind] || 'watch';

export const canShelve = (): boolean => !!app.session.user && !!app.forum.attribute<boolean>('canUseShelf');

export const date = (value?: string | null): string | null => (value ? dayjs(value).format('LL') : null);

/** "Artist – Title (Year)", as far as each is known. */
export const formatTitle = (title: string, year?: number | null, artist?: string | null): string => {
  const name = artist ? `${artist} – ${title}` : title;
  return year ? `${name} (${year})` : name;
};

export const titleOf = (media: MarqueeMedia): string => formatTitle(media.title(), media.year(), media.artist && media.artist());

/**
 * With Curio installed, collections live there: Shelf's own "In my collection"
 * steps aside (members' earlier entries can be copied over with
 * `php flarum curio:import-shelf`).
 */
export const curioHandlesCollections = (): boolean => 'ernestdefoe-curio' in (flarum.extensions || {});
