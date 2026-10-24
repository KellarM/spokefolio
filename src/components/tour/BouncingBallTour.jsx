import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { useStudioLanguage } from '@/lib/StudioLanguage';
import { useTour } from '@/lib/TourContext';

// The gold companion itself. One ball, always fixed to the viewport: parked
// in the lower right while traveling, anchored beside the very thing it is
// pointing at (the name field, the dictation box) when the client is on the
// right page. It never moves until it is tapped, and never covers what it
// points at - it sits beside it.

const BALL_SIZE = 52;
const EDGE = 16;
// Room for the speech bubble above the ball without crowding the header.
const TOP_FLOOR = 132;

// What the ball points at, by step and route. Anchored only while the step
// is still in progress - a celebrated step means "tap me", not "look here".
const anchorElement = (step, pathname, celebrated) => {
  if (step === 'identity' && pathname === '/profile' && !celebrated) {
    return document.getElementById('full_name');
  }
  if (step === 'history' && pathname === '/history' && !celebrated) {
    return document.querySelector('[data-tour="dictation"]');
  }
  return null;
};

export default function BouncingBallTour() {
  const tour = useTour();
  const { t } = useStudioLanguage();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const { active, step, celebrated, ready } = tour;
  const [pos, setPos] = useState(null);
  const [hopKey, setHopKey] = useState(0);
  const [bubbleBelow, setBubbleBelow] = useState(false);
  const [bubbleShift, setBubbleShift] = useState(false);

  // Position: anchored to the target element when there is one, parked in
  // the lower right corner when there is not. Recomputed on scroll and
  // resize, plus settle beats after a route change while the page's own
  // entrance animations finish.
  const compute = useCallback(() => {
    if (!active) return;
    const el = anchorElement(step, pathname, celebrated);
    if (!el) {
      setPos({
        left: window.innerWidth - BALL_SIZE - 26,
        top: window.innerHeight - BALL_SIZE - 30,
        anchored: false
      });
      setBubbleBelow(false);
      setBubbleShift(window.innerWidth - BALL_SIZE - 26 > window.innerWidth - 170);
      return;
    }
    const rect = el.getBoundingClientRect();
    let left = rect.right + 14;
    let top = rect.top + rect.height / 2 - BALL_SIZE / 2;
    if (left + BALL_SIZE > window.innerWidth - EDGE) left = rect.left - BALL_SIZE - 14;
    left = Math.max(EDGE, Math.min(left, window.innerWidth - BALL_SIZE - EDGE));
    top = Math.max(TOP_FLOOR, Math.min(top, window.innerHeight - BALL_SIZE - EDGE));
    setPos({ left, top, anchored: true });
    setBubbleBelow(top <= TOP_FLOOR + 30);
    setBubbleShift(left + BALL_SIZE > window.innerWidth - 180);
  }, [active, step, pathname, celebrated]);

  useEffect(() => {
    compute();
    let raf = 0;
    const recompute = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(compute);
    };
    window.addEventListener('scroll', recompute, { passive: true });
    window.addEventListener('resize', recompute);
    const settles = [setTimeout(compute, 180), setTimeout(compute, 700), setTimeout(compute, 1600)];
    return () => {
      window.removeEventListener('scroll', recompute);
      window.removeEventListener('resize', recompute);
      cancelAnimationFrame(raf);
      settles.forEach(clearTimeout);
    };
  }, [compute]);

  // A fresh hop every time the ball arrives somewhere new.
  useEffect(() => {
    if (active) setHopKey((key) => key + 1);
  }, [step, pathname, active]);

  // The farewell ends itself - animation or not - so no client is left
  // with a ball that will not leave.
  useEffect(() => {
    if (!active || step !== 'farewell') return undefined;
    const done = setTimeout(() => tour.finish(), 6400);
    return () => clearTimeout(done);
  }, [active, step, tour]);

  if (!ready || !active || !pos) return null;

  const onProfile = pathname === '/profile';
  const onHome = pathname === '/';
  const onHistory = pathname === '/history';

  const captionKey =
    step === 'identity'
      ? celebrated
        ? 'tour.nameDone'
        : onProfile
          ? 'tour.nameField'
          : 'tour.start'
      : step === 'studio'
        ? onHome
          ? 'tour.studio'
          : 'tour.studioAway'
        : step === 'history'
          ? celebrated
            ? 'tour.entryDone'
            : onHistory
              ? 'tour.history'
              : 'tour.comeAlong'
          : 'tour.farewell';

  const handleTap = () => {
    tour.event(`tour_tap_${step}`);
    if (step === 'identity') {
      if (!onProfile) navigate('/profile');
      else if (celebrated) {
        tour.tapAdvance('studio');
        navigate('/');
      }
    } else if (step === 'studio') {
      if (!onHome) navigate('/');
      else {
        tour.tapAdvance('history');
        navigate('/history');
      }
    } else if (step === 'history') {
      if (!onHistory) navigate('/history');
      else if (celebrated) {
        tour.tapAdvance('farewell');
        navigate('/');
      }
    } else {
      tour.finish();
    }
  };

  const moveClass = step === 'farewell' ? 'tour-farewell' : celebrated ? 'tour-celebrate' : 'tour-hop';

  return (
    <div className="tour-ball-wrap" style={{ top: pos.top, left: pos.left }}>
      <div key={hopKey} className={`tour-move ${moveClass}`}>
        <span className="tour-shadow" aria-hidden="true" />
        <button
          type="button"
          className="tour-ball"
          onClick={handleTap}
          aria-label={t(captionKey)}
        />
      </div>
      <div
        className={`tour-bubble ${bubbleBelow ? 'below' : ''} ${bubbleShift ? 'shift' : ''}`}
        role="status"
      >
        {t(captionKey)}
        <button type="button" className="tour-x" onClick={() => tour.abandon()} aria-label={t('tour.close')}>
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
