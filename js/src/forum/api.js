import app from 'flarum/forum/app';

const url = (path) => `${app.forum.attribute('apiUrl')}/${path}`;

/**
 * Write the viewer's entry for a title. The server keeps one per member and
 * title, so this both creates and updates. Returns the entry's plain fields,
 * or null once it is removed.
 */
export function saveEntry(mediaId, mine, changes) {
  const next = { rating: mine?.rating ?? null, status: mine?.status ?? null, doneOn: mine?.doneOn ?? null, owned: !!mine?.owned, ...changes };

  if (!next.rating && !next.status && !next.owned) {
    if (!mine) return Promise.resolve(null);
    return app.request({ method: 'DELETE', url: url(`shelf-entries/${mine.id}`) }).then(() => {
      const cached = app.store.getById('shelf-entries', mine.id);
      if (cached) app.store.remove(cached);
      return null;
    });
  }

  return app
    .request({
      method: 'POST',
      url: url('shelf-entries'),
      body: {
        data: {
          type: 'shelf-entries',
          attributes: { rating: next.rating, status: next.status, owned: next.owned, doneOn: next.status === 'done' ? next.doneOn : null },
          relationships: { media: { data: { type: 'marquee-media', id: String(mediaId) } } },
        },
      },
    })
    .then((payload) => {
      const entry = app.store.pushPayload(payload);
      return { id: entry.id(), rating: entry.rating(), status: entry.status(), owned: entry.owned(), doneOn: entry.doneOn() };
    });
}

/** Add a title to one of the viewer's lists, or make a new list holding it. */
export function addToList(list, mediaId, name) {
  const body = list
    ? { data: { type: 'shelf-lists', id: list.id(), attributes: { add: Number(mediaId) } } }
    : { data: { type: 'shelf-lists', attributes: { name, add: Number(mediaId) } } };

  return app
    .request({ method: list ? 'PATCH' : 'POST', url: url(list ? `shelf-lists/${list.id()}` : 'shelf-lists'), body })
    .then((payload) => app.store.pushPayload(payload));
}

export function updateList(list, attributes) {
  return app
    .request({ method: 'PATCH', url: url(`shelf-lists/${list.id()}`), body: { data: { type: 'shelf-lists', id: list.id(), attributes } } })
    .then((payload) => app.store.pushPayload(payload));
}

export function deleteList(list) {
  return app.request({ method: 'DELETE', url: url(`shelf-lists/${list.id()}`) }).then(() => app.store.remove(list));
}

export function myLists() {
  return app.store.find('shelf-lists', { filter: { user: app.session.user.id() }, page: { limit: 50 } });
}

export function topRated(params) {
  return app.request({ method: 'GET', url: url('shelf/top'), params });
}
