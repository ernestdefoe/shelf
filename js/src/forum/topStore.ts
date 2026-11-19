/**
 * Top-rated results, kept outside any component: a Bespoke widget is re-created
 * on every redraw, so a component that fetched for itself would fetch again on
 * every draw (see the bespoke_widget_remount_trap). One promise per query, for
 * the whole page; two placements of the same list are one request.
 */

/** One title in the top-rated list, as /api/shelf/top sends it. */
export interface TopItem {
  id: number;
  kind: string;
  title: string;
  year: number | null;
  poster: string | null;
  artist: string | null;
  average: number;
  count: number;
  discussionSlug: string | null;
}

export interface TopParams {
  period?: string;
  kind?: string;
  limit?: number;
}

export interface TopState {
  items: TopItem[] | null;
  failed: boolean;
}

const results = new Map<string, TopState>();

export function keyOf({ period = 'month', kind = '', limit = 10 }: TopParams = {}): string {
  return `${period}|${kind}|${limit}`;
}

/**
 * The state for a query: `{ items: null | [], failed: bool }`. Starts the
 * request the first time it is asked for and calls `redraw` once it lands.
 */
export function read(params: TopParams, load: (params: TopParams) => Promise<{ data?: TopItem[] }>, redraw: () => void): TopState {
  const key = keyOf(params);
  let state = results.get(key);

  if (!state) {
    const fresh: TopState = { items: null, failed: false };
    state = fresh;
    results.set(key, fresh);

    load(params).then(
      (response) => {
        fresh.items = response.data || [];
        redraw();
      },
      () => {
        // app.request already showed the alert; the list says it failed.
        fresh.failed = true;
        fresh.items = [];
        redraw();
      }
    );
  }

  return state;
}

/** Forget every result, so each unit test starts afresh. */
export function clear(): void {
  results.clear();
}
