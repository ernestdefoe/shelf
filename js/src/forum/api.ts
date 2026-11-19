import app from 'flarum/forum/app';
import type { MyEntry } from './rating';
import type { Entry, ShelfList } from './models';
import type { TopItem, TopParams } from './topStore';

/** The viewer's entry as a store model, whether or not the store holds it yet. */
function entryModel(id: string): Entry | null {
  return app.store.getById<Entry>('shelf-entries', id) || app.store.pushObject<Entry>({ type: 'shelf-entries', id, attributes: {} });
}

/**
 * Write the viewer's entry for a title. The server keeps one per member and
 * title, so a new record both creates and updates. Returns the entry's plain
 * fields, or null once it is removed.
 */
export function saveEntry(media: MarqueeMedia, mine: MyEntry | null, changes: Partial<MyEntry>): Promise<MyEntry | null> {
  const next = { rating: mine?.rating ?? null, status: mine?.status ?? null, doneOn: mine?.doneOn ?? null, owned: !!mine?.owned, ...changes };

  if (!next.rating && !next.status && !next.owned) {
    const entry = mine?.id ? entryModel(mine.id) : null;
    return entry ? entry.delete().then(() => null) : Promise.resolve(null);
  }

  return app.store
    .createRecord<Entry>('shelf-entries')
    .save({
      rating: next.rating,
      status: next.status,
      owned: next.owned,
      doneOn: next.status === 'done' ? next.doneOn : null,
      relationships: { media },
    })
    .then((entry) => ({ id: entry.id(), rating: entry.rating(), status: entry.status(), owned: entry.owned(), doneOn: entry.doneOn() }));
}

/** Add a title to one of the viewer's lists, or make a new list holding it. */
export function addToList(list: ShelfList | null, media: MarqueeMedia, name?: string): Promise<ShelfList> {
  return updateList(list, list ? { add: Number(media.id()) } : { name, add: Number(media.id()) });
}

/** Make a list, or change one: its name, description, or which titles it holds and in what order. */
export function updateList(list: ShelfList | null, attributes: Record<string, unknown>): Promise<ShelfList> {
  return (list || app.store.createRecord<ShelfList>('shelf-lists')).save(attributes);
}

export function deleteList(list: ShelfList): Promise<void> {
  return list.delete();
}

export function myLists(): Promise<ShelfList[]> {
  return app.store.find<ShelfList[]>('shelf-lists', { filter: { user: app.session.user!.id()! }, page: { limit: 50 } });
}

/** The top-rated titles: a computed list, not a resource, so it is fetched as is. */
export function topRated(params: TopParams): Promise<{ data?: TopItem[] }> {
  return app.request<{ data?: TopItem[] }>({ method: 'GET', url: `${app.forum.attribute('apiUrl')}/shelf/top`, params });
}
