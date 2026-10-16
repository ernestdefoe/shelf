import app from 'flarum/forum/app';
import extractText from 'flarum/common/utils/extractText';

export const t = (key, params) => app.translator.trans(`ernestdefoe-shelf.forum.${key}`, params);
export const text = (key, params) => extractText(t(key, params));

/** What "done" and "want" are called for a kind: watched, read, played, listened. */
export const verb = (kind) => ({ book: 'read', game: 'play', music: 'listen' })[kind] || 'watch';

export const canShelve = () => !!app.session.user && app.forum.attribute('canUseShelf');

export const date = (value) => (value ? dayjs(value).format('LL') : null);

export const titleOf = (media) => {
  const artist = media.artist && media.artist();
  const name = artist ? `${artist} – ${media.title()}` : media.title();
  return media.year() ? `${name} (${media.year()})` : name;
};
