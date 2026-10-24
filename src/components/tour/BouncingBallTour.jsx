import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Calendar,
  FileText,
  FolderOpen,
  History as HistoryIcon,
  PenLine,
  Sparkles,
  X
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useStudioLanguage } from '@/lib/StudioLanguage';
import { useTour } from '@/lib/TourContext';
import { computeNudge, dismissNudge, markNudgeShown, markNudgeTapped } from '@/lib/nudges';
import { trackEvent } from '@/lib/analytics';

// The gold companion, in two lives.
//
// The journey: a tap on "First time" walks a new client through everything
// it takes to complete ONE application - name and profile, one story told,
// one job posting saved, one application tailored. Every step waits for a
// real fact before it celebrates, and the farewell lands only when the
// first application truly exists.
//
// The launcher: whenever the ball is idle, a tap opens its menu - the nudge
// it is holding (if any), the "First time" journey, and the four header
// destinations. On the Overview it sits in the middle of the screen; on any
// other page it waits in the corner.

const BALL_SIZE = 52;
const EDGE = 16;
// Room for the speech bubble above the ball without crowding the header.
const TOP_FLOOR = 132;

// The journey: identity -> story (capture -> edits -> prompts -> more?) ->
// posting -> apply -> farewell. The story phase asks real questions with
// real answers; its sub-steps advance on yes/no choices and real saves.
const NEXT_STEP = {
  identity: 'story',
  story_edits: 'story_prompts',
  posting: 'apply',
  apply: 'farewell'
};
const STEP_PAGE = {
  identity: '/profile',
  story: '/history',
  story_edits: '/history',
  story_prompts: '/history',
  posting: '/postings',
  apply: '/postings',
  farewell: '/'
};

// The four header destinations beyond the Overview the ball lives on.
const NAV = [
  { key: 'history', labelKey: 'nav.history', to: '/history', Icon: HistoryIcon },
  { key: 'documents', labelKey: 'nav.documents', to: '/documents', Icon: FolderOpen },
  { key: 'postings', labelKey: 'nav.postings', to: '/postings', Icon: Briefcase },
  { key: 'applications', labelKey: 'nav.applications', to: '/applications', Icon: FileText }
];

const NUDGE_ICON = { interview: Calendar, draft: PenLine, posting: Briefcase };

// What the ball points at during the journey, by step and route. The
// story phase follows the work: mic before capture, the draft editor the
// moment a capture lands, the prompts panel while questions are open.
const anchorElement = (step, pathname, celebrated) => {
  const draftEditor = document.querySelector('[data-tour="draft-editor"]');
  const prompts = document.querySelector('[data-tour="prompts"]');
  if (step === 'identity' && pathname === '/profile' && !celebrated) {
    return document.getElementById('full_name');
  }
  if ((step === 'story' || step === 'story_edits') && draftEditor) return draftEditor;
  if (step === 'story_prompts' && prompts) return prompts;
  if (step === 'story' && pathname === '/history' && !celebrated) {
    return document.querySelector('[data-tour="dictation"]');
  }
  return null;
};

// The element each step should bring into view - the ball moves the
// client to the work, not just to a page. An anchor the client cannot see
// is worse than no anchor: the ball floats in the viewport pointing at
// nothing (the round-two bug - after 'more jobs? -> yes', the page sat
// scrolled at the save area while the mic lived off-screen above).
const focusElement = (step, celebrated) => {
  if (step === 'identity' && !celebrated) {
    return document.getElementById('full_name');
  }
  if (step === 'story_edits' || (step === 'story' && celebrated)) {
    return document.querySelector('[data-tour="draft-editor"]');
  }
  if (step === 'story_prompts') return document.querySelector('[data-tour="prompts"]');
  if (step === 'story' && !celebrated) {
    return document.querySelector('[data-tour="dictation"]');
  }
  return null;
};

// Where "First time" resumes: the first real gap on the road to a first
// application. A profile gap is impossible once entries exist (the gate
// sees to that), so the order is entries -> postings -> applications.
const firstJourneyStep = (studioData) => {
  if (!studioData || studioData.entries.length === 0) return 'identity';
  if (studioData.postings.length === 0) return 'posting';
  return 'apply';
};

export default function BouncingBallTour() {
  const tour = useTour();
  const { t } = useStudioLanguage();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const { active, step, celebrated, ready } = tour;
  // Launcher mode: the ball's idle life, whenever no journey is running.
  const idle = ready && !active;

  const [pos, setPos] = useState(null);
  const [hopKey, setHopKey] = useState(0);
  const [bubbleBelow, setBubbleBelow] = useState(false);
  const [bubbleShift, setBubbleShift] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const wrapRef = useRef(null);

  // The studio's own data: what the journey celebrates and the launcher's
  // nudges are made of.
  const [studioData, setStudioData] = useState(null);
  const [nudge, setNudge] = useState(null);
  const fetchedAt = useRef(0);

  // Position: anchored to the target element during the journey's profile
  // and story steps, centered on the Overview, cornered on every other page.
  const compute = useCallback(() => {
    if (!active && !idle) return;
    const el = active ? anchorElement(step, pathname, celebrated) : null;
    if (!el) {
      const mobile = window.innerWidth < 640;
      if (pathname === '/') {
        setPos({
          left: (window.innerWidth - BALL_SIZE) / 2,
          top: (window.innerHeight - BALL_SIZE) / 2,
          anchored: false
        });
      } else {
        setPos({
          left: window.innerWidth - BALL_SIZE - (mobile ? 18 : 26),
          top: window.innerHeight - BALL_SIZE - (mobile ? 58 : 36),
          anchored: false
        });
      }
      setBubbleBelow(false);
      setBubbleShift(false);
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
  }, [active, idle, step, pathname, celebrated]);

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
    if (active || idle) setHopKey((key) => key + 1);
  }, [step, pathname, active, idle]);

  // Every step brings its target into view: the name field, the mic, the
  // capture results, the prompts. The ball never anchors to something
  // the client cannot see - round two of the story phase starts from
  // wherever round one's save left the page scrolled, and the mic lives
  // at the top.
  useEffect(() => {
    if (!active) return;
    const el = focusElement(step, celebrated);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.bottom > window.innerHeight - 90 || rect.top < 130) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [active, step, celebrated]);

  // The farewell ends itself - animation or not - so no client is left
  // with a ball that will not leave.
  useEffect(() => {
    if (!active || step !== 'farewell') return undefined;
    const done = setTimeout(() => tour.finish(), 6400);
    return () => clearTimeout(done);
  }, [active, step, tour]);

  // Read the client's studio - applications, postings, stories - for the
  // journey's celebrations and the launcher's nudges. A failed read leaves
  // the ball silent, never guessing.
  useEffect(() => {
    if (!idle && !active) return undefined;
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
        // Nothing read, nothing said.
      }
    };
    fetchStudio();
    const interval = setInterval(fetchStudio, 120000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [idle, active, pathname]);

  // The journey's own celebrations, for the steps no page can see: a
  // posting saved, an application created.
  useEffect(() => {
    if (!active || !studioData || celebrated) return;
    if (step === 'posting' && studioData.postings.length > 0) {
      tour.announce('posting_done');
    }
    if (step === 'apply' && studioData.applications.length > 0) {
      tour.announce('apply_done');
    }
  }, [active, step, celebrated, studioData, tour]);

  // The launcher's nudge, recomputed as data or route changes.
  useEffect(() => {
    if (!idle || !studioData) {
      setNudge(null);
      return;
    }
    setNudge(computeNudge({ userId: tour.userId, pathname, ...studioData }));
  }, [idle, studioData, pathname, tour.userId]);

  useEffect(() => {
    markNudgeShown(nudge);
  }, [nudge]);

  // The menu closes on outside clicks and Escape - a client should never
  // have to hunt for a dismiss control.
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onDoc = (event) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) setMenuOpen(false);
    };
    const onKey = (event) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  // Starting a journey always closes the launcher first.
  useEffect(() => {
    if (active) setMenuOpen(false);
  }, [active]);

  if (!ready || !pos || (!active && !idle)) return null;

  const onHome = pathname === '/';
  const onProfile = pathname === '/profile';
  const onHistory = pathname === '/history';
  const onPostings = pathname === '/postings';
  const onTailor = pathname.startsWith('/tailor-application');

  // ---- Launcher mode: the menu, the journey, the four destinations ----
  if (idle) {
    const openMenu = () => {
      setMenuOpen((open) => {
        const next = !open;
        if (next) {
          trackEvent('menu_open');
          setHopKey((key) => key + 1);
        }
        return next;
      });
    };

    const go = (to) => {
      setMenuOpen(false);
      navigate(to);
    };

    const startJourney = () => {
      const first = firstJourneyStep(studioData);
      tour.start({ step: first });
      trackEvent('menu_first_time');
      setMenuOpen(false);
      navigate(STEP_PAGE[first]);
    };

    const takeNudge = () => {
      if (!nudge) return;
      markNudgeTapped(nudge);
      dismissNudge(tour.userId, nudge.id);
      setNudge(null);
      setMenuOpen(false);
      navigate(nudge.target);
    };

    const NudgeIcon = nudge ? NUDGE_ICON[nudge.kind] : null;
    const centered = !pos.anchored && onHome;

    return (
      <div
        ref={wrapRef}
        className={`tour-ball-wrap helper ${nudge ? 'has-nudge' : ''} ${centered ? 'center' : ''}`}
        style={{ top: pos.top, left: pos.left }}
      >
        <div key={hopKey} className="tour-move tour-hop">
          <span className="tour-shadow" aria-hidden="true" />
          <button
            type="button"
            className="tour-ball"
            onClick={openMenu}
            aria-label={t('nudge.idle')}
            aria-expanded={menuOpen}
          >
            <span className="tour-face" aria-hidden="true">
              <span className="tour-eye left" />
              <span className="tour-eye right" />
              <span className="tour-smile" />
            </span>
          </button>
        </div>
        {menuOpen && (
          <div className={`tour-menu ${centered ? 'below' : 'side'}`} role="menu">
            {nudge && (
              <button type="button" className="tour-menu-item nudge" onClick={takeNudge} role="menuitem">
                <NudgeIcon className="mi" aria-hidden="true" />
                <span>{t(nudge.captionKey)}</span>
              </button>
            )}
            <button type="button" className="tour-menu-item featured" onClick={startJourney} role="menuitem">
              <Sparkles className="mi" aria-hidden="true" />
              <span>{t('menu.firstTime')}</span>
            </button>
            {NAV.map(({ key, labelKey, to, Icon }) => (
              <button
                type="button"
                className="tour-menu-item"
                key={key}
                onClick={() => {
                  trackEvent(`menu_nav_${key}`);
                  go(to);
                }}
                role="menuitem"
              >
                <Icon className="mi" aria-hidden="true" />
                <span>{t(labelKey)}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ---- Journey mode: the guided walk to a first application ----
  const onApplyPage = onPostings || onTailor;

  const captionKey =
    step === 'identity'
      ? celebrated
        ? 'tour.nameDone'
        : onProfile
          ? 'tour.nameField'
          : 'tour.start'
      : step === 'story'
        ? celebrated
          ? 'tour.editsAsk'
          : onHistory
            ? 'tour.history'
            : 'tour.comeAlong'
        : step === 'story_edits'
          ? onHistory
            ? 'tour.edits'
            : 'tour.comeAlong'
          : step === 'story_prompts'
            ? celebrated
              ? 'tour.savedAsk'
              : onHistory
                ? 'tour.prompts'
                : 'tour.comeAlong'
            : step === 'posting'
          ? celebrated
            ? 'tour.postingDone'
            : onPostings
              ? 'tour.posting'
              : 'tour.postingAway'
          : step === 'apply'
            ? celebrated
              ? 'tour.applyDone'
              : onApplyPage
                ? 'tour.apply'
                : 'tour.applyAway'
            : 'tour.farewell';

  // A yes or no in the bubble: the story phase's real questions. Every
  // answer is a step transition with its own analytics.
  const choose = (choice) => {
    tour.event(`tour_tap_${step}_${choice}`);
    setHopKey((key) => key + 1);
    if (step === 'story') {
      tour.tapAdvance(choice === 'yes' ? 'story_edits' : 'story_prompts');
      return;
    }
    if (step === 'story_prompts') {
      if (choice === 'yes') {
        tour.tapAdvance('story');
        return;
      }
      tour.tapAdvance('posting');
      navigate('/postings');
    }
  };

  const handleTap = () => {
    tour.event(`tour_tap_${step}`);
    // Every tap visibly lands - the ball never sits unresponsive, even in
    // the moments where it deliberately holds its position.
    setHopKey((key) => key + 1);
    if (step === 'farewell') {
      tour.finish();
      return;
    }
    const page = STEP_PAGE[step];
    const onPage = page === pathname || (step === 'apply' && onTailor);
    if (!onPage) {
      navigate(page);
      return;
    }
    // Not there yet: the tap LEADS. If the step's target has scrolled out
    // of view - the client read the form, the prompts panel drifted off -
    // the ball brings the target back into view instead of pointing at
    // empty space. The ball directs; it never decorates.
    if (!celebrated) {
      const target = focusElement(step, celebrated);
      if (target) {
        const rect = target.getBoundingClientRect();
        if (rect.bottom > window.innerHeight - 90 || rect.top < 130) {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      return;
    }
    if (celebrated) {
      // The captured-and-saved moments advance on the bubble's answers,
      // never on a stray tap of the ball.
      if (step === 'story' || step === 'story_prompts') return;
      if (step === 'story_edits') {
        tour.tapAdvance('story_prompts');
        return;
      }
      const next = NEXT_STEP[step];
      tour.tapAdvance(next);
      navigate(STEP_PAGE[next]);
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
        >
          <span className="tour-face" aria-hidden="true">
            <span className="tour-eye left" />
            <span className="tour-eye right" />
            <span className="tour-smile" />
          </span>
        </button>
      </div>
      <div
        className={`tour-bubble ${pos.anchored ? `${bubbleBelow ? 'below ' : ''}${bubbleShift ? 'shift' : ''}` : 'side'}`}
        role="status"
      >
        {t(captionKey)}
        {celebrated && (step === 'story' || step === 'story_prompts') && (
          <div className="tour-choices">
            <button type="button" className="tour-choice" onClick={() => choose('yes')}>
              {t('tour.yes')}
            </button>
            <button type="button" className="tour-choice no" onClick={() => choose('no')}>
              {t('tour.no')}
            </button>
          </div>
        )}
        <button type="button" className="tour-x" onClick={() => tour.abandon()} aria-label={t('tour.close')}>
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
