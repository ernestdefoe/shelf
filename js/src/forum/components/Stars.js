import Component from 'flarum/common/Component';
import classList from 'flarum/common/utils/classList';
import { ratingAt, starsLabel } from '../rating';

/**
 * Five stars in half steps. Read-only, or an input: a transparent range input
 * lies over the stars, so pointer, touch and keyboard all work and screen
 * readers get a real slider. `value` is 1-10 (or null), `onchange` gets 1-10,
 * or null when the rating is cleared with 0.
 */
export default class Stars extends Component {
  oninit(vnode) {
    super.oninit(vnode);
    this.hover = null;
  }

  view() {
    const { value, onchange, label, className, size } = this.attrs;
    const shown = this.hover ?? value ?? 0;

    return (
      <span
        className={classList('ShelfStars', className, size && `ShelfStars--${size}`, { 'ShelfStars--input': onchange, 'ShelfStars--empty': !shown })}
        style={{ '--shelf-fill': `${shown * 10}%` }}
        title={value ? starsLabel(value) : undefined}
      >
        <span className="ShelfStars-row" aria-hidden="true">
          ★★★★★
        </span>
        {onchange ? (
          <input
            type="range"
            className="ShelfStars-input"
            min="0"
            max="10"
            step="1"
            value={value || 0}
            aria-label={label}
            aria-valuetext={value ? starsLabel(value) : '0'}
            onpointermove={(e) => (this.hover = ratingAt(e.offsetX, e.currentTarget.clientWidth))}
            onpointerleave={() => (this.hover = null)}
            onclick={(e) => {
              // A click is a deliberate pick: the half star under the pointer.
              const picked = e.detail ? ratingAt(e.offsetX, e.currentTarget.clientWidth) : Number(e.currentTarget.value);
              e.currentTarget.value = picked;
              onchange(picked === value ? null : picked);
            }}
            onkeyup={(e) => {
              if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'].includes(e.key)) return;
              const picked = Number(e.currentTarget.value);
              onchange(picked || null);
            }}
          />
        ) : null}
      </span>
    );
  }
}
