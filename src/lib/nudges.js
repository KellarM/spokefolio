// The helper side of the gold ball. After the walkthrough ends, the ball stays
// in the corner as a quiet helper: it only speaks when the studio gives it
// something real to say, and it never repeats a nudge it already made that
// day. Every trigger is a real-world fact read from the client's own data -
// an interview on the calendar, a story left half-told, a posting saved but
// never tailored - never a guess, never a schedule-for-the-sake-of-it.

import { trackEvent } from '@/lib/analytics';

const DISMISSED_KEY = (userId, id) => `sf_nudge:${userId}:${id}`;

const today = () => new Date().toISOString().slice(0, 10);

const wasDismissedToday = (userId, id) => {
  try {
    return localStorage.getItem(DISMISSED_KEY(userId, id)) === today();
  } catch {
    return false; // Private mode: the nudge simply repeats next visit.
  }
};

export const dismissNudge = (userId, id) => {
  try {
    localStorage.setItem(DISMISSED_KEY(userId, id), today());
  } catch {
    // Private mode: the dismissal does not survive. Harmless.
  }
};

// An interview that already started still counts for its whole day - the
// client may still want to rehearse right up to the door.
const INTERVIEW_WINDOW_DAYS = 7;
const TERMINAL_STATUSES = ['declined', 'not_hired', 'rejected'];

// Priority order: an interview beats a draft, a draft beats a posting.
// A nudge for the page the client is already on never shows - the ball
// defers to the next real thing instead.
export function computeNudge({ userId, pathname, applications, postings, entries }) {
  const now = Date.now();
  const candidates = [];

  // 1. An interview within the week - the highest-stakes moment a client
  // faces, and the one the studio can actually help with.
  const interview = (applications || []).find(
    (application) =>
      application.interview_at &&
      !TERMINAL_STATUSES.includes(application.status) &&
      new Date(application.interview_at).getTime() < now + INTERVIEW_WINDOW_DAYS * 86400000 &&
      new Date(application.interview_at).getTime() > now - 86400000
  );
  if (interview) {
    candidates.push({
      id: `interview:${interview.id}`,
      kind: 'interview',
      captionKey: 'nudge.interview',
      target: '/applications'
    });
  }

  // 2. A story left half-told. Hidden entries never nag - they are excluded
  // from everything the resume touches, this included.
  const draft = (entries || []).find((entry) => entry.status === 'draft' && !entry.hidden);
  if (draft) {
    candidates.push({
      id: `draft:${draft.id}`,
      kind: 'draft',
      captionKey: 'nudge.draft',
      target: '/history'
    });
  }

  // 3. A posting saved but never turned into an application - the gap
  // between "I found something" and "I applied".
  const tailored = new Set(
    (applications || []).map((application) => application.posting_id).filter(Boolean)
  );
  const posting = (postings || []).find((item) => !tailored.has(item.id));
  if (posting) {
    candidates.push({
      id: `posting:${posting.id}`,
      kind: 'posting',
      captionKey: 'nudge.posting',
      target: '/postings'
    });
  }

  const firstEligible = candidates.find(
    (candidate) => candidate.target !== pathname && !wasDismissedToday(userId, candidate.id)
  );
  return firstEligible || null;
}

// Shown fires once per nudge id - a nudge sitting on screen never re-fires
// as data refreshes underneath it.
let lastShownId = null;

export const markNudgeShown = (nudge) => {
  if (!nudge || lastShownId === nudge.id) return false;
  lastShownId = nudge.id;
  trackEvent(`nudge_shown_${nudge.kind}`);
  return true;
};

export const markNudgeTapped = (nudge) => {
  if (!nudge) return;
  trackEvent(`nudge_tapped_${nudge.kind}`);
};
