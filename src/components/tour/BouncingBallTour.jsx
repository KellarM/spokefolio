import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Calendar,
  EyeOff,
  FileText,
  FolderOpen,
  History as HistoryIcon,
  PenLine,
  Sparkles,
  Volume2,
  X
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useStudioLanguage } from '@/lib/StudioLanguage';
import { speak, mascotMuted, setMascotMuted, mascotHidden, setMascotHidden } from '@/lib/speech';
import { useTour } from '@/lib/TourContext';
import VoicePicker from '@/components/tour/VoicePicker';
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

// A parked ball never sits on the page's words: probe each candidate spot
// and take the first whose footprint lands on nothing textual.
const TEXTISH = 'p,h1,h2,h3,h4,h5,h6,span,a,button,label,li,b,strong,em,img,input,textarea,svg,td,th';

const spotIsClear = (left, top) => {
  const inset = 6;
  const points = [
    [left + inset, top + inset],
    [left + BALL_SIZE - inset, top + inset],
    [left + BALL_SIZE / 2, top + BALL_SIZE / 2],
    [left + inset, top + BALL_SIZE - inset],
    [left + BALL_SIZE - inset, top + BALL_SIZE - inset]
  ];
  return points.every(([x, y]) => pointIsClear(x, y));
};

// Is this exact point free of words and controls? The caret APIs resolve
// the true text node under the point, so a padded container around text
// (the greeting pill) no longer reads as clear space - that hole is what
// parked the ball on the greeting.
const pointIsClear = (x, y) => {
  const element = document.elementFromPoint(x, y);
  if (!element) return true;
  if (element.closest && element.closest('.tour-ball-wrap')) return true;
  if (element.closest && element.closest('button, a, input, textarea, select, img, svg, label')) return false;
  try {
    let node = null;
    if (document.caretRangeFromPoint) {
      const range = document.caretRangeFromPoint(x, y);
      node = range ? range.startContainer : null;
    } else if (document.caretPositionFromPoint) {
      const position = document.caretPositionFromPoint(x, y);
      node = position ? position.offsetNode : null;
    }
    if (node && node.nodeType === Node.TEXT_NODE && node.nodeValue.trim()) return false;
  } catch {}
  return true;
};

// Center first, then the left edge, right edge last - the far right is
// Michael's least favorite spot (Oct 26). Probed with the caret check, so
// a spot only counts when nothing textual sits under the ball.
const parkPosition = () => {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const clamp = (left, top) => ({
    left: Math.max(EDGE, Math.min(left, vw - BALL_SIZE - EDGE)),
    top: Math.max(TOP_FLOOR, Math.min(top, vh - BALL_SIZE - EDGE))
  });
  const candidates = [
    [(vw - BALL_SIZE) / 2, Math.round(vh * 0.2)],
    [(vw - BALL_SIZE) / 2, Math.round(vh * 0.55)],
    [EDGE, Math.round(vh * 0.2)],
    [EDGE, Math.round(vh * 0.35)],
    [EDGE, Math.round(vh * 0.5)],
    [EDGE, Math.round(vh * 0.65)],
    [vw - BALL_SIZE - EDGE, Math.round(vh * 0.2)],
    [vw - BALL_SIZE - EDGE, Math.round(vh * 0.35)],
    [vw - BALL_SIZE - EDGE, Math.round(vh * 0.5)]
  ].map(([left, top]) => clamp(left, top));
  return candidates.find((spot) => spotIsClear(spot.left, spot.top)) || candidates[0];
};

// The journey: identity -> story (capture -> edits -> prompts -> more?) ->
// posting -> apply -> farewell. The story phase asks real questions with
// real answers; its sub-steps advance on yes/no choices and real saves.
const NEXT_STEP = {
  identity: 'story',
  story_edits: 'story_prompts',
  files: 'posting',
  files_add: 'posting',
  posting: 'apply',
  apply: 'farewell'
};
const STEP_PAGE = {
  identity: '/profile',
  story: '/history',
  story_edits: '/history',
  story_prompts: '/history',
  files: '/documents',
  files_add: '/documents',
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
  if ((step === 'files' || step === 'files_add') && pathname === '/documents' && !celebrated) {
    return document.querySelector('[data-tour="uploader"]');
  }
  // A step whose page is elsewhere anchors beside the Overview's hero
  // copy - 'tap me and I'll take you there' is spoken from clear space,
  // never parked on the greeting (Michael, Oct 26).
  if (pathname === '/') {
    return document.querySelector('[data-tour="overview-copy"]');
  }
  return null;
};

// The idle ball directs, never decorates: outside a journey it anchors
// to the page's primary action and speaks the next step from there.
const idleAnchorElement = (pathname) => {
  // The Overview anchors beside the hero's body copy - the clear space to
  // its right, between the copy and the numbered step buttons, never on
  // top of the greeting (Michael, Oct 26: parked-center covered it).
  if (pathname === '/') return document.querySelector('[data-tour="overview-copy"]');
  if (pathname === '/history') return document.querySelector('[data-tour="dictation"]');
  if (pathname === '/documents') return document.querySelector('[data-tour="uploader"]');
  if (pathname === '/profile') return document.querySelector('[data-tour="voice"]');
  if (pathname === '/postings') return document.querySelector('[data-tour="job-search"]');
  return null;
};

const idleCaptionKey = (pathname) =>
  ({
    '/history': 'tour.history',
    '/documents': 'tour.idleDocuments',
    '/profile': 'tour.idleProfile',
    '/postings': 'tour.idlePostings'
  })[pathname];



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
  if ((step === 'files' || step === 'files_add') && !celebrated) {
    return document.querySelector('[data-tour="uploader"]');
  }
  return null;
};

// Where "First time" resumes: the first real gap on the road to a first
// application. A profile gap is impossible once entries exist (the gate
// sees to that), so the order is entries -> postings -> applications.
const firstJourneyStep = (studioData) => {
  if (!studioData || studioData.entries.length === 0) return 'identity';
  if (studioData.documents.length === 0) return 'files';
  if (studioData.postings.length === 0) return 'posting';
  return 'apply';
};

// The Overview's idle line names the next real step - the same gap the
// 'First time' item resumes - instead of a generic 'tap me' that never
// says what needs doing once it takes the client there (Michael, Oct 26).
// The mascot's spoken memory. A line of advice is voiced ONCE per
// session - never re-armed by re-anchoring, menu toggles or coming back
// to a page (Michael, Oct 26: 'tap me and I'll take you there' kept
// repeating). A repeat happens only two ways: the client taps the ball
// to ask for it, or the advice itself changes into a line not yet said.
// Module-level on purpose: a ref resets on remount and was still
// letting the line loose every time he came back to a page.
const spokenLines = new Set();

const homeCaptionKey = (studioData) => {
  const first = firstJourneyStep(studioData);
  return (
    {
      identity: 'tour.comeHistory',
      files: 'tour.comeFiles',
      posting: 'tour.comePosting',
      apply: 'tour.comeApply'
    }[first] || 'tour.comeAlong'
  );
};

export default function BouncingBallTour() {
  const tour = useTour();
  const { t } = useStudioLanguage();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const { active, step, celebrated, ready } = tour;
  // Launcher mode: the ball's idle life, whenever no journey is running.
  const idle = ready && !active;

  // Turned off in preferences means turned off everywhere: the launcher
  // and the guided walk both stand down (Michael, Oct 29).
  const [hidden, setHidden] = useState(() => mascotHidden());
  useEffect(() => {
    const sync = () => setHidden(mascotHidden());
    window.addEventListener('spokefolio:mascotPrefs', sync);
    return () => window.removeEventListener('spokefolio:mascotPrefs', sync);
  }, []);

  const [pos, setPos] = useState(null);
  const [hopKey, setHopKey] = useState(0);
  const [bubbleBelow, setBubbleBelow] = useState(false);
  const [bubbleShift, setBubbleShift] = useState(false);
  // Pic 2's look: the bubble beside the ball, tail pointing at it,
  // when the ball sits next to the action it is announcing.
  const [bubbleSide, setBubbleSide] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [manual, setManual] = useState(null);
  const [retreat, setRetreat] = useState(false);
  const wrapRef = useRef(null);
  const anchorElRef = useRef(null);
  const lastInsideRef = useRef(0);
  const dragRef = useRef(null);
  const dragMovedRef = useRef(false);

  // The studio's own data: what the journey celebrates and the launcher's
  // nudges are made of.
  const [studioData, setStudioData] = useState(null);
  const [nudge, setNudge] = useState(null);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const fetchedAt = useRef(0);

  // Position: anchored to the target element during the journey's profile
  // and story steps, centered on the Overview, cornered on every other page.
  const compute = useCallback(() => {
    if (!active && !idle) return;
    // The client's own placement wins: once dragged, the ball stays
    // exactly where they put it until the route changes.
    if (manual) {
      anchorElRef.current = null;
      setPos({ left: manual.left, top: manual.top, anchored: false });
      setBubbleBelow(false);
      setBubbleShift(false);
      setBubbleSide(false);
      return;
    }
    // The Overview has one spot and only one spot (Michael, Oct 26): right
    // of the hero copy, just above the numbered steps, bubble to its left.
    // Not the far right of the screen, not on the copy - THE spot, every
    // time, in every mode. No probing, no fallback.
    if (pathname === '/' && !retreat) {
      const copy = document.querySelector('[data-tour="overview-copy"]');
      const steps = document.querySelector('[data-tour="overview-steps"]');
      if (copy && steps) {
        anchorElRef.current = copy;
        const copyRect = copy.getBoundingClientRect();
        const stepsRect = steps.getBoundingClientRect();
        const left = Math.min(Math.round(copyRect.right) + 18, window.innerWidth - BALL_SIZE - EDGE);
        const top = Math.max(TOP_FLOOR, Math.round(stepsRect.top) - BALL_SIZE - 14);
        setPos({ left, top, anchored: true });
        setBubbleBelow(false);
        setBubbleShift(false);
        setBubbleSide(false);
        return;
      }
    }
    // Career History's spot (Michael, Oct 26): beside the action itself.
    // When the dictation is the next action - idle, or the journey's story
    // step before capture - the ball sits immediately left of the Tap to
    // Talk row, level with the button, bubble pointing at it (Pic 2).
    if (pathname === '/history' && !retreat && (!active || (step === 'story' && !celebrated))) {
      const action = document.querySelector('[data-tour="dictation"]');
      if (action) {
        anchorElRef.current = action;
        const actionRect = action.getBoundingClientRect();
        const left = Math.max(EDGE, Math.round(actionRect.left) - BALL_SIZE - 14);
        const top = Math.max(TOP_FLOOR, Math.round(actionRect.top + actionRect.height / 2 - BALL_SIZE / 2));
        setPos({ left, top, anchored: true });
        setBubbleBelow(false);
        setBubbleShift(false);
        // Side bubble only when the left margin actually has room for it;
        // otherwise the bubble sits above the ball as everywhere else.
        setBubbleSide(left > 300);
        return;
      }
    }
    const el = active ? anchorElement(step, pathname, celebrated) : idleAnchorElement(pathname);
    anchorElRef.current = el || null;
    // Retreat: the client activated the action the ball was pointing at,
    // so the ball moves away until that action ends - it never hovers over
    // work in progress.
    if (!el || retreat) {
      // Parked: center-high when that space is clear, otherwise the first
      // clear spot the page offers - the ball never covers the copy. The
      // menu opens below the ball and stays reachable (Michael, Oct 23:
      // the corner dropped the dropdown off the bottom of the screen).
      setPos({ ...parkPosition(), anchored: false });
      setBubbleBelow(false);
      setBubbleShift(false);
      setBubbleSide(false);
      return;
    }
    const rect = el.getBoundingClientRect();
    let left = rect.right + 14;
    let top = rect.top + rect.height / 2 - BALL_SIZE / 2;
    if (left + BALL_SIZE > window.innerWidth - EDGE) left = rect.left - BALL_SIZE - 14;
    left = Math.max(EDGE, Math.min(left, window.innerWidth - BALL_SIZE - EDGE));
    top = Math.max(TOP_FLOOR, Math.min(top, window.innerHeight - BALL_SIZE - EDGE));
    if (!spotIsClear(left, top)) {
      // Never on top of the words: a collision at the anchored spot
      // steps aside to a clear position instead.
      setPos({ ...parkPosition(), anchored: false });
      setBubbleBelow(false);
      setBubbleShift(false);
      setBubbleSide(false);
      return;
    }
    setPos({ left, top, anchored: true });
    setBubbleBelow(top <= TOP_FLOOR + 30);
    setBubbleShift(left + BALL_SIZE > window.innerWidth - 180);
    setBubbleSide(false);
  }, [active, idle, step, pathname, celebrated, manual, retreat]);

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

  // ---- Draggable: the client places the ball wherever they want it ----
  // A press that moves more than a few pixels is a drag, not a tap: the
  // ball follows the finger or cursor and stays there (page default
  // returns on the next route).
  const onBallPointerDown = (event) => {
    if (event.button !== undefined && event.button !== 0) return;
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch {}
    dragRef.current = {
      id: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      baseLeft: pos ? pos.left : 0,
      baseTop: pos ? pos.top : 0,
      moved: false
    };
  };

  const onBallPointerMove = (event) => {
    const drag = dragRef.current;
    if (!drag || event.pointerId !== drag.id || !pos) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (!drag.moved && Math.hypot(dx, dy) < 6) return;
    drag.moved = true;
    dragMovedRef.current = true;
    const left = Math.max(EDGE, Math.min(drag.baseLeft + dx, window.innerWidth - BALL_SIZE - EDGE));
    const top = Math.max(TOP_FLOOR, Math.min(drag.baseTop + dy, window.innerHeight - BALL_SIZE - EDGE));
    setManual({ left, top });
  };

  const onBallPointerUp = (event) => {
    const drag = dragRef.current;
    if (!drag || event.pointerId !== drag.id) return;
    dragRef.current = null;
  };

  // ---- Retreat: activate the action, the ball steps aside ----
  // Pointer down inside the anchored action starts the retreat; the ball
  // returns only when the action is truly over - focus left the action,
  // no recording is running, and the client's last touch inside it was
  // more than a moment ago.
  useEffect(() => {
    const onDown = (event) => {
      const anchor = anchorElRef.current;
      if (!anchor) return;
      if (event.target.closest && event.target.closest('.tour-ball-wrap')) return;
      if (anchor.contains(event.target)) {
        lastInsideRef.current = Date.now();
        setRetreat(true);
      }
    };
    document.addEventListener('pointerdown', onDown, true);
    return () => document.removeEventListener('pointerdown', onDown, true);
  }, []);

  useEffect(() => {
    if (!retreat) return undefined;
    const watcher = setInterval(() => {
      const anchor = anchorElRef.current;
      const focusInside = anchor && anchor.contains(document.activeElement);
      const busyInside =
        anchor && anchor.querySelector('.dictate-live, .dictate-voice-live, button[aria-pressed="true"]');
      const quiet = Date.now() - lastInsideRef.current > 2500;
      if (!focusInside && !busyInside && quiet) setRetreat(false);
    }, 700);
    return () => clearInterval(watcher);
  }, [retreat]);

  // A new page brings the default placement back - the client re-places
  // the ball per page, the program's position leads each time.
  useEffect(() => {
    setManual(null);
    setRetreat(false);
    setVoiceOpen(false);
  }, [pathname]);

  // An anchor can appear after the first pass (the page is still loading
  // its data, the hero is not rendered yet): keep looking briefly instead
  // of parking on the copy for the rest of the visit.
  useEffect(() => {
    if (!active && !idle) return undefined;
    let tries = 0;
    const poll = setInterval(() => {
      tries += 1;
      if (anchorElRef.current || tries > 14 || (active ? false : manual)) {
        clearInterval(poll);
        return;
      }
      compute();
    }, 700);
    return () => clearInterval(poll);
  }, [active, idle, compute, pathname, manual]);

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
        const [applications, postings, entries, documents] = await Promise.all([
          base44.entities.JobApplication.list('-created_date', 100),
          base44.entities.JobPosting.list('-created_date', 100),
          base44.entities.CareerEntry.list('-created_date', 200),
          base44.entities.SupportingDocument.list('-created_date', 100)
        ]);
        if (!cancelled) {
          setStudioData({
            applications: applications || [],
            postings: postings || [],
            entries: entries || [],
            documents: documents || []
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
    // The apply step celebrates only the truth: a status of 'applied',
    // not merely a tailored application sitting at 'ready'.
    if (step === 'apply' && studioData.applications.some((a) => a.status === 'applied')) {
      tour.announce('apply_done');
    }
    if (step === 'files' && studioData.documents.length > 0) {
      tour.announce('files_done');
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

  const onHome = pathname === '/';
  const onProfile = pathname === '/profile';
  const onHistory = pathname === '/history';
  const onPostings = pathname === '/postings';
  const onDocuments = pathname === '/documents';
  const onTailor = pathname.startsWith('/tailor-application');

  // ---- The caption and the mascot's voice, computed before the idle
  // return so every hook stays unconditional ----
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
            : step === 'files'
              ? celebrated
                ? 'tour.filesDone'
                : onDocuments
                  ? 'tour.filesAsk'
                  : 'tour.filesAway'
            : step === 'files_add'
              ? celebrated
                ? 'tour.filesDone'
                : 'tour.filesAdd'
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

  // The idle bubble's line - a data-driven nudge first, otherwise the
  // page's own next step. On the Overview that next step is the client's
  // first real gap, so the ball says what to do, not just 'tap me'.
  const idleKey = nudge
    ? nudge.captionKey
    : pathname === '/' && studioData
      ? homeCaptionKey(studioData)
      : idleCaptionKey(pathname);

  // ---- The mascot talks: its bubble is spoken aloud in its own voice,
  // a different voice from the working engine's. Tap a bubble to mute. ----
  const bubbleText = idle
    ? pos && pos.anchored && idleKey && !menuOpen
      ? t(idleKey)
      : ''
    : t(captionKey);

  const toggleMute = () => {
    const next = !mascotMuted();
    setMascotMuted(next);
    if (next) {
      try { window.speechSynthesis.cancel(); } catch {}
    } else if (bubbleText) {
      speak(bubbleText, { profile: 'mascot' });
    }
  };

  // A line is spoken exactly once per session. The bubble text flips to
  // '' and back whenever the menu opens, the retreat ends, or the anchor
  // probe re-settles - no flip ever re-voices a line already said. The
  // bubble still SHOWS the guidance; the voice just stops repeating it.
  useEffect(() => {
    if (!bubbleText || mascotMuted()) return;
    if (spokenLines.has(bubbleText)) return; // said it - the bubble carries it now
    // A beat after arrival, in its own voice - and never over the top of
    // the working engine mid-sentence.
    const timer = setTimeout(() => {
      spokenLines.add(bubbleText);
      speak(bubbleText, { profile: 'mascot' });
    }, 250);
    return () => clearTimeout(timer);
  }, [bubbleText]);

  if (hidden || !ready || !pos || (!active && !idle)) return null;

  // ---- Launcher mode: the menu, the journey, the four destinations ----
  if (idle) {
    const openMenu = () => {
      if (dragMovedRef.current) {
        dragMovedRef.current = false;
        return;
      }
      setMenuOpen((open) => {
        const next = !open;
        if (next) {
          trackEvent('menu_open');
          setHopKey((key) => key + 1);
          setVoiceOpen(false);
        }
        return next;
      });
      // Tap me = ask me: the one repeat the client controls. Opening the
      // menu re-voices the line on demand instead of on a timer.
      if (bubbleText && !mascotMuted()) speak(bubbleText, { profile: 'mascot' });
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
    // What the idle ball says at its anchor: a data-driven nudge first,
    // otherwise the page's own next step.
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
            className="tour-ball cursor-grab active:cursor-grabbing"
            style={{ touchAction: 'none' }}
            onClick={openMenu}
            onPointerDown={onBallPointerDown}
            onPointerMove={onBallPointerMove}
            onPointerUp={onBallPointerUp}
            aria-label={t('nudge.idle')}
            aria-expanded={menuOpen}
          >
            <span className="tour-face" aria-hidden="true">
              <svg viewBox="0 0 64 64" aria-hidden="true">
                <g className="tour-eyes">
                  <ellipse cx="23" cy="27" rx="9.5" ry="11" fill="#ffffff" />
                  <ellipse cx="41" cy="27" rx="9.5" ry="11" fill="#ffffff" />
                  <circle cx="24.5" cy="29" r="3.4" fill="#1a1408" />
                  <circle cx="39.5" cy="29" r="3.4" fill="#1a1408" />
                  <g stroke="#1a1408" strokeWidth="1.7" strokeLinecap="round">
                    <line x1="23" y1="15.5" x2="23" y2="11" />
                    <line x1="17.5" y1="18" x2="14.5" y2="15" />
                    <line x1="28.5" y1="18" x2="31.5" y2="15" />
                    <line x1="41" y1="15.5" x2="41" y2="11" />
                    <line x1="46.5" y1="18" x2="49.5" y2="15" />
                    <line x1="35.5" y1="18" x2="32.5" y2="15" />
                  </g>
                </g>
                <path d="M 24 42 Q 32 49 40 42" fill="none" stroke="#1a1408" strokeWidth="2.6" strokeLinecap="round" />
              </svg>
            </span>
          </button>
        </div>
        {pos.anchored && idleKey && !menuOpen && (
          <div
            role="button"
            tabIndex={-1}
            title={t('mascot.voiceHint')}
            onClick={toggleMute}
            className={`tour-bubble cursor-pointer ${bubbleSide ? 'side' : `${bubbleBelow ? 'below ' : ''}${bubbleShift ? 'shift' : ''}`}`}
          >
            {t(idleKey)}
          </div>
        )}
        {menuOpen && voiceOpen && (
          <VoicePicker onClose={() => setVoiceOpen(false)} />
        )}
        {menuOpen && !voiceOpen && (
          <div className="tour-menu below" role="menu">
            {nudge && (
              <button type="button" className="tour-menu-item nudge" onClick={takeNudge} role="menuitem">
                <NudgeIcon className="mi" aria-hidden="true" />
                <span>{t(nudge.captionKey)}</span>
              </button>
            )}
            <button
              type="button"
              className="tour-menu-item"
              onClick={() => {
                trackEvent('menu_hide_mascot');
                setMascotHidden(true);
                setHidden(true);
                setMenuOpen(false);
              }}
              role="menuitem"
            >
              <EyeOff className="mi" aria-hidden="true" />
              <span>{t('menu.hideMascot')}</span>
            </button>
            <button type="button" className="tour-menu-item featured" onClick={startJourney} role="menuitem">
              <Sparkles className="mi" aria-hidden="true" />
              <span>{t('menu.firstTime')}</span>
            </button>
            <button
              type="button"
              className="tour-menu-item"
              onClick={() => {
                trackEvent('menu_voice_settings');
                setVoiceOpen(true);
              }}
              role="menuitem"
            >
              <Volume2 className="mi" aria-hidden="true" />
              <span>{t('voice.settings')}</span>
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
      tour.tapAdvance('files');
      navigate('/documents');
    }
    if (step === 'files') {
      if (choice === 'yes') {
        tour.tapAdvance('files_add');
        return;
      }
      // No files to add: straight to the job hunt - reference files are an
      // enhancement, never a gate.
      tour.tapAdvance('posting');
      navigate('/postings');
    }
  };

  const handleTap = () => {
    if (dragMovedRef.current) {
      dragMovedRef.current = false;
      return;
    }
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

  if (hidden) return null;

  return (
    <div className="tour-ball-wrap" style={{ top: pos.top, left: pos.left }}>
      <div key={hopKey} className={`tour-move ${moveClass}`}>
        <span className="tour-shadow" aria-hidden="true" />
        <button
          type="button"
          className="tour-ball cursor-grab active:cursor-grabbing"
          style={{ touchAction: 'none' }}
          onClick={handleTap}
          onPointerDown={onBallPointerDown}
          onPointerMove={onBallPointerMove}
          onPointerUp={onBallPointerUp}
          aria-label={t(captionKey)}
        >
          <span className="tour-face" aria-hidden="true">
            <svg viewBox="0 0 64 64" aria-hidden="true">
              <g className="tour-eyes">
                <ellipse cx="23" cy="27" rx="9.5" ry="11" fill="#ffffff" />
                <ellipse cx="41" cy="27" rx="9.5" ry="11" fill="#ffffff" />
                <circle cx="24.5" cy="29" r="3.4" fill="#1a1408" />
                <circle cx="39.5" cy="29" r="3.4" fill="#1a1408" />
                <g stroke="#1a1408" strokeWidth="1.7" strokeLinecap="round">
                  <line x1="23" y1="15.5" x2="23" y2="11" />
                  <line x1="17.5" y1="18" x2="14.5" y2="15" />
                  <line x1="28.5" y1="18" x2="31.5" y2="15" />
                  <line x1="41" y1="15.5" x2="41" y2="11" />
                  <line x1="46.5" y1="18" x2="49.5" y2="15" />
                  <line x1="35.5" y1="18" x2="32.5" y2="15" />
                </g>
              </g>
              <path d="M 24 42 Q 32 49 40 42" fill="none" stroke="#1a1408" strokeWidth="2.6" strokeLinecap="round" />
            </svg>
          </span>
        </button>
      </div>
      <div
        className={`tour-bubble ${bubbleSide ? 'side' : pos.anchored ? `${bubbleBelow ? 'below ' : ''}${bubbleShift ? 'shift' : ''}` : 'side'}`}
        role="status"
        title={t('mascot.voiceHint')}
        onClick={(event) => {
          if (event.target.closest('button')) return; // choices are choices, not the mute
          toggleMute();
        }}
      >
        {t(captionKey)}
        {(step === 'files' && !celebrated && onDocuments) && (
          <div className="tour-choices">
            <button type="button" className="tour-choice" onClick={() => choose('yes')}>
              {t('tour.yes')}
            </button>
            <button type="button" className="tour-choice no" onClick={() => choose('no')}>
              {t('tour.no')}
            </button>
          </div>
        )}
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
