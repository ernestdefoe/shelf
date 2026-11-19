/**
 * Ratings are stored as half stars: 1 = ½★ … 10 = ★★★★★. These helpers are
 * pure so they can be tested without a browser.
 */

/** The members' rating of a title, and the viewer's own entry, as the card gets them. */
export interface Shelf {
  average: number | null;
  count: number;
  mine: MyEntry | null;
}

/** The viewer's own entry for a title, as plain fields. */
export interface MyEntry {
  id?: string;
  rating?: number | null;
  status?: 'want' | 'done' | null;
  owned?: boolean;
  doneOn?: string | null;
}

/** The rating under a pointer `x` pixels into a `width`-pixel row of five stars. */
export function ratingAt(x: number, width: number): number {
  if (!(width > 0)) return 0;
  return Math.min(10, Math.max(1, Math.ceil((x / width) * 10)));
}

/** "4.5" for 9, "4" for 8. */
export function starsLabel(rating: number): string {
  return String(rating / 2);
}

/**
 * The members' average after the viewer's own rating changes from `before` to
 * `after` (either may be null), without asking the server again.
 */
export function reaverage<S extends Pick<Shelf, 'average' | 'count'>>(shelf: S, before?: number | null, after?: number | null): S {
  const count = shelf.count || 0;
  let total = (shelf.average || 0) * 2 * count;

  if (before) total -= before;
  if (after) total += after;

  const next = count - (before ? 1 : 0) + (after ? 1 : 0);

  return { ...shelf, count: next, average: next ? Math.round((total / next / 2) * 100) / 100 : null };
}
