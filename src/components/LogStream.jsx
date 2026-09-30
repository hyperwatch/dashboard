import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import LogEntry from './LogEntry';

const atBottom = (el) => el.scrollTop + el.clientHeight >= el.scrollHeight - 20;

// A key for each entry, kept as the list moves: when a line is added, only
// that line is rendered, and the one dropped at the top removed
const keys = new WeakMap();
let lastKey = 0;
function keyOf(entry, index) {
  if (typeof entry !== 'object' || entry === null) return `line-${index}`;
  if (!keys.has(entry)) keys.set(entry, ++lastKey);
  return keys.get(entry);
}

const reducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// How far behind the latest line the view trails while lines slide in, in
// milliseconds: more is steadier on a busy stream, and shows lines later
const TRAIL = 300;
// A slide starts at a speed, then slows down to a stop: on a stream that
// keeps coming, slides restart before slowing. With this easing, a slide
// starting at `speed` (pixels per millisecond) lasts 4 × distance / speed.
const EASING = 'cubic-bezier(0.25, 1, 0.5, 1)';
const FADE = { duration: TRAIL, easing: 'ease-out' };

// How far down the lines currently are, in a slide under way
const offsetOf = (list) =>
  new DOMMatrixReadOnly(getComputedStyle(list).transform).m42;

// Log lines, the latest at the bottom like a terminal. Like Hyperwatch's log
// streams, the view follows new lines while scrolled to the bottom and stops
// when scrolled up, and a ↓ button jumps to the latest lines while they are
// below the view. Unlike them, it opens on the latest lines (it has a height
// of its own, where a page opens on its top), and new lines slide and fade in
// instead of jumping a line at a time. Both are animations of transform and
// opacity, which browsers run off the main thread: they stay smooth while
// the page renders.
// className: padding and text size of the scrolling area.
export default function LogStream({ entries, connected, className = '' }) {
  const scrollRef = useRef(null);
  const listRef = useRef(null);
  const followRef = useRef(true);
  const [following, setFollowing] = useState(true);
  const slideRef = useRef(null);
  // The speed the last slide started at, in pixels per millisecond
  const speedRef = useRef(0);
  const previousRef = useRef([]);

  function setFollow(follow) {
    followRef.current = follow;
    setFollowing(follow);
  }

  // To the latest lines at once, without a slide
  function toBottom() {
    slideRef.current?.cancel();
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }

  useEffect(() => () => slideRef.current?.cancel(), []);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    const list = listRef.current;
    const previous = previousRef.current;
    previousRef.current = entries;
    const index =
      previous.length > 0
        ? entries.lastIndexOf(previous[previous.length - 1])
        : -1;
    // Another list (the first logs, another stream, a cleared one): no slide
    if (index === -1 || !list) {
      if (followRef.current) toBottom();
      return;
    }
    const added = entries.length - 1 - index;
    const removed = previous.length + added - entries.length;
    const lineHeight = list.firstElementChild?.offsetHeight || 0;
    if (!followRef.current) {
      // A full list drops its oldest lines as new ones come, which moves the
      // others up: the view moves with them, so that lines stay where they
      // are on screen (done here for every browser: see overflow-anchor)
      if (removed > 0) el.scrollTop -= removed * lineHeight;
      return;
    }
    if (added === 0) return;
    // The view goes to the latest lines at once, and the lines are moved
    // down by as much as that moved them up (none, while they don't fill the
    // view), so that nothing has moved yet: from there, together with what is
    // left of a slide under way, they slide up to their place
    const before = el.scrollTop;
    el.scrollTop = el.scrollHeight;
    const underWay = offsetOf(list);
    const offset = underWay + removed * lineHeight + el.scrollTop - before;
    slideRef.current?.cancel();
    // More than a screen behind: catching up would scroll too fast to read
    if (offset > el.clientHeight || reducedMotion()) {
      return;
    }
    if (offset > 0.5) {
      // The speed that covers the distance in TRAIL. Logs come in bursts:
      // while a slide is under way, the speed only goes part of the way to
      // it, so that lines flow at an even pace instead of speeding up with
      // each burst (within limits, to still catch up)
      const wanted = offset / TRAIL;
      const eased = speedRef.current + (wanted - speedRef.current) / 4;
      const speed =
        underWay > 0.5
          ? Math.min(Math.max(eased, wanted / 2), wanted * 2)
          : wanted;
      speedRef.current = speed;
      slideRef.current = list.animate(
        [{ transform: `translateY(${offset}px)` }, { transform: 'none' }],
        { duration: (4 * offset) / speed, easing: EASING }
      );
    }
    // On a quiet stream (or a list shorter than the view, which doesn't
    // slide), new lines fade in. On a busy one they come in from under the
    // edge, where a fade wouldn't be seen.
    if (offset <= 2 * lineHeight) {
      for (const line of [...list.children].slice(-added)) {
        line.animate([{ opacity: 0 }, { opacity: 1 }], FADE);
      }
    }
  }, [entries]);

  function handleScroll() {
    setFollow(atBottom(scrollRef.current));
  }

  // Scrolling up stops following at once, before new lines pull the view
  // back down (scroll events only come with the next frame)
  function handleWheel(event) {
    if (event.deltaY < 0) {
      setFollow(false);
    }
  }

  function toLatest() {
    setFollow(true);
    toBottom();
  }

  return (
    <div className="relative flex-1 min-h-0 flex flex-col">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        onWheel={handleWheel}
        className={`flex-1 min-h-0 overflow-auto [overflow-anchor:none] ${className}`}
      >
        {entries.length === 0 ? (
          <div className="text-text-dim text-center py-6">
            {connected ? 'Waiting for logs…' : 'Connecting…'}
          </div>
        ) : (
          // Clipped, so that lines sliding in don't stretch the scrolling
          // area
          <div className="overflow-y-clip">
            <div ref={listRef} className="will-change-transform">
              {entries.map((entry, i) => (
                <div key={keyOf(entry, i)} className="leading-5 text-text">
                  <LogEntry entry={entry} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {!following && (
        <button
          onClick={toLatest}
          title="Jump to the latest logs"
          className="absolute right-6 bottom-4 w-8 h-8 rounded-full border border-border bg-bg-card hover:bg-bg-card-hover text-base leading-none cursor-pointer"
        >
          ↓
        </button>
      )}
    </div>
  );
}
