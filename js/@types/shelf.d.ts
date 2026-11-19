import type Model from 'flarum/common/Model';

// What Shelf knows of Marquee's titles, and Bespoke's widget queue.

declare global {
  /** A Marquee title, as the forum store holds it. */
  interface MarqueeMedia extends Model {
    kind(): string;
    title(): string;
    year(): number | null;
    poster(): string | null;
    artist?: () => string | null;
  }

  /** Bespoke's widget queue, read when Bespoke boots (absent without Bespoke). */
  var BespokeWidgetQueue: unknown[] | undefined;
}
