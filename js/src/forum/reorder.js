/** `items` with the one at `from` moved to `to`, as a new array. */
export function moved(items, from, to) {
  const next = items.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}
