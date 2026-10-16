/**
 * Ratings are stored as half stars: 1 = ½★ … 10 = ★★★★★. These helpers are
 * pure so they can be tested without a browser.
 */

/** The rating under a pointer `x` pixels into a `width`-pixel row of five stars. */
export function ratingAt(x, width) {
  if (!(width > 0)) return 0;
  return Math.min(10, Math.max(1, Math.ceil((x / width) * 10)));
}

/** "4.5" for 9, "4" for 8. */
export function starsLabel(rating) {
  return String(rating / 2);
}

/**
 * The members' average after the viewer's own rating changes from `before` to
 * `after` (either may be null), without asking the server again.
 */
export function reaverage(shelf, before, after) {
  const count = shelf.count || 0;
  let total = (shelf.average || 0) * 2 * count;

  if (before) total -= before;
  if (after) total += after;

  const next = count - (before ? 1 : 0) + (after ? 1 : 0);

  return { ...shelf, count: next, average: next ? Math.round((total / next / 2) * 100) / 100 : null };
}
