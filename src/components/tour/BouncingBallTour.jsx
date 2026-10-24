import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useStudioLanguage } from '@/lib/StudioLanguage';
import { useTour } from '@/lib/TourContext';
import { computeNudge, dismissNudge, markNudgeShown, markNudgeTapped } from '@/lib/nudges';

// The gold companion. It leads the first-time walkthrough (tap to move, it
// waits, it celebrates real completion), and after the farewell it stays as
// a quiet helper in the corner: it only speaks when the studio gives it
// something real to say - an interview coming up, a story half-told, a
// posting never tailored - and never repeats a nudge the client already
// dismissed that day.

const BALL_SIZE = 52;
const EDGE = 16;
// Room for the speech bubble above the ball without crowding the header.
const TOP_FLOOR = 132;

// What the ball points at during the walkthrough, by step and route.
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
  // Helper mode: the ball's second life, after (or without) the walkthrough.
  const helper = ready && !active;

  const [pos, setPos] = useState(null);
  const [hopKey, setHopKey] = useState(0);
  const [bubbleBelow, setBubbleBelow] = useState(false);
  const [bubbleShift, setBubbleShift] = useState(false);

  // Helper state: the studio's own data, the nudge it produced, and the
  // quiet "all caught up" reply a tap earns when nothing needs the client.
  const [studioData, setStudioData] = useState(null);
  const [nudge, setNudge] = useState(null);
  const [quiet, setQuiet] = useState(false);
  const fetchedAt = useRef(0);

  // Position: anchored to the target element during the walkthrough, parked
  // in the lower right corner otherwise. Recomputed on scroll and resize,
  // plus settle beats after a route change while entrance animations finish.
  const compute = useCallback(() => {
    if (!active && !helper) return;
    const el = active ? anchorElement(step, pathname, celebrated) : null;
    if (!el) {
      const left = window.innerWidth - BALL_SIZE - 26;
      setPos({ left, top: window.innerHeight - BALL_SIZE - 30, anchored: false });
      setBubbleBelow(false);
      setBubbleShift(left + BALL_SIZE > window.innerWidth - 180);
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
  }, [active, helper, step, pathname, celebrated]);

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
    if (active || helper) setHopKey((key) => key + 1);
  }, [step, pathname, active, helper]);

  // The farewell ends itself - animation or not - so no client is left
  // with a ball that will not leave.
  useEffect(() => {
    if (!active || step !== 'farewell') return undefined;
    const done = setTimeout(() => tour.finish(), 6400);
    return () => clearTimeout(done);
  }, [active, step, tour]);

  // Helper mode: read the client's own studio - applications, postings,
  // stories - and only speak when there is something real to say.
  useEffect(() => {
    if (!helper) return undefined;
    let cancelled = false;
    const fetchStudio = async () => {
      const now = Date.now();
      if (now - fetchedAt.current < 30000) return;
      fetchedAt.current = now;
      try {
        const [applications, postings, entries] = await Promise.all([
          base44.entities.JobApplication.list('-created_date', 100),
          base44.entities.JobPosting.list('-created_date', 100),
          base44.entities.CareerEntry.list('-created_date', 200)
        ]);
        if (!cancelled) {
          setStudioData({
            applications: applications || [],
            postings: postings || [],
            entries: entries || []
          });
        }
      } catch {
        // A silent helper is allowed: nothing read, nothing said.
      }
    };
    fetchStudio();
    const interval = setInterval(fetchStudio, 120000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [helper, pathname]);

  // The nudge itself, recomputed as data or route changes.
  useEffect(() => {
    if (!helper || !studioData) {
      setNudge(null);
      return;
    }
    setNudge(computeNudge({ userId: tour.userId, pathname, ...studioData }));
  }, [helper, studioData, pathname, tour.userId]);

  useEffect(() => {
    markNudgeShown(nudge);
  }, [nudge]);

  // The quiet reply closes itself; a client who taps an idle ball should
  // not have to dismiss anything.
  useEffect(() => {
    if (!quiet) return undefined;
    const done = setTimeout(() => setQuiet(false), 4200);
    return () => clearTimeout(done);
  }, [quiet]);

  if (!ready || !pos || (!active && !helper)) return null;

  const handleHelperTap = () => {
    if (nudge) {
      markNudgeTapped(nudge);
      dismissNudge(tour.userId, nudge.id);
      setNudge(null);
      navigate(nudge.target);
      return;
    }
    setQuiet(true);
  };

  // ---- Helper mode: small, corner, speaks only on real facts ----
  if (helper) {
    const helperCaption = nudge ? t(nudge.captionKey) : quiet ? t('nudge.quiet') : null;
    return (
      <div
        className={`tour-ball-wrap helper ${nudge ? 'has-nudge' : ''}`}
        style={{ top: pos.top, left: pos.left }}
      >
        <div key={hopKey} className="tour-move tour-hop">
          <span className="tour-shadow" aria-hidden="true" />
          <button
            type="button"
            className="tour-ball"
            onClick={handleHelperTap}
            aria-label={helperCaption || t('nudge.idle')}
          />
        </div>
        {helperCaption && (
          <div
            className={`tour-bubble ${bubbleBelow ? 'below' : ''} ${bubbleShift ? 'shift' : ''}`}
            role="status"
          >
            {helperCaption}
            {nudge && (
              <button
                type="button"
                className="tour-x"
                onClick={() => {
                  dismissNudge(tour.userId, nudge.id);
                  setNudge(null);
                }}
                aria-label={t('tour.close')}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // ---- Walkthrough mode: the guided journey ----
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
