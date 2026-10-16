/**
 * Top-rated results, kept outside any component: a Bespoke widget is re-created
 * on every redraw, so a component that fetched for itself would fetch again on
 * every draw (see the bespoke_widget_remount_trap). One promise per query, for
 * the whole page; two placements of the same list are one request.
 */
const results = new Map();

export function keyOf({ period = 'month', kind = '', limit = 10 } = {}) {
  return `${period}|${kind}|${limit}`;
}

/**
 * The state for a query: `{ items: null | [], failed: bool }`. Starts the
 * request the first time it is asked for and calls `redraw` once it lands.
 */
export function read(params, fetch, redraw) {
  const key = keyOf(params);
  let state = results.get(key);

  if (!state) {
    state = { items: null, failed: false };
    results.set(key, state);

    fetch(params).then(
      (response) => {
        state.items = response.data || [];
        redraw();
      },
      () => {
        state.failed = true;
        state.items = [];
        redraw();
      }
    );
  }

  return state;
}

/** Forget everything, e.g. after the viewer rates something. */
export function clear() {
  results.clear();
}
