import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { trackEvent } from '@/lib/analytics';

// The bouncing ball walkthrough: a client taps the gold ball, it takes them
// to the next place (profile, overview, career history), waits while they
// look or act, and moves on when they tap again. Completion is detected,
// never asked for: the ball celebrates the moment the real thing exists -
// a completed profile, a first entry - and the farewell ends the tour.
//
// Steps, in the order every client meets them:
//   identity - the profile page; completes when the profile passes its gate
//   studio   - the overview, shown and explained; advances on tap
//   history  - career history; completes when a first entry exists
//   farewell - the overview again; two hops, a goodbye, and gone
//
// State persists per account in localStorage, so closing the tab mid-tour
// brings the ball back exactly where it was. Preview runs (summoned from
// the overview pill by an account that has already been through it) fire
// no analytics so demo taps never pollute the real funnel numbers.

const TourContext = createContext(null);

export const TOUR_START_STEP = 'identity';

const storageKey = (userId) => `sf_tour:${userId || 'anon'}`;

const readRecord = (userId) => {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writeRecord = (userId, record) => {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(record));
  } catch {
    // Private mode: the tour simply does not survive the visit. Harmless.
  }
};

export function TourProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.id;

  // undefined = still reading storage, null = no record, {} = saved record.
  const [record, setRecord] = useState(undefined);
  const recordRef = useRef(undefined);

  useEffect(() => {
    const saved = readRecord(userId);
    recordRef.current = saved;
    setRecord(saved);
  }, [userId]);

  const persist = (next) => {
    recordRef.current = next;
    setRecord(next);
    writeRecord(userId, next);
  };

  const api = useMemo(() => {
    const active = !!record && record.step !== 'done';

    return {
      // The record is only trustworthy once storage has been read for this
      // account; pages hold their auto-start decisions until then.
      ready: record !== undefined,
      userId,
      active,
      step: active ? record.step : null,
      preview: active ? !!record.preview : false,
      celebrated: active ? !!record.celebrated : false,
      hasRecord: !!record,

      start({ preview = false, step = TOUR_START_STEP } = {}) {
        const current = recordRef.current;
        if (current && current.step !== 'done') return; // already running
        persist({ step, preview, celebrated: false });
        if (!preview) trackEvent('tour_started');
      },

      // A page reports a real-world fact; the ball only reacts when that
      // fact is the one its current step is waiting for.
      announce(signal) {
        const current = recordRef.current;
        if (!current || current.step === 'done' || current.celebrated) return;
        const expects = {
          identity: 'name_done',
          story: 'entry_done',
          story_prompts: 'entry_saved'
        }[current.step];
        if (signal !== expects) return;
        persist({ ...current, celebrated: true });
        if (!current.preview) trackEvent(`tour_done_${current.step}`);
      },

      tapAdvance(nextStep) {
        const current = recordRef.current;
        if (!current || current.step === 'done') return;
        persist({ ...current, step: nextStep, celebrated: false });
      },

      abandon() {
        const current = recordRef.current;
        if (!current || current.step === 'done') return;
        persist({ step: 'done' });
        if (!current.preview) trackEvent('tour_abandoned', current.step);
      },

      finish() {
        const current = recordRef.current;
        if (!current || current.step === 'done') return;
        persist({ step: 'done' });
        if (!current.preview) trackEvent('tour_complete');
      },

      // Guarded event tap for the ball: preview runs stay silent.
      event(name) {
        const current = recordRef.current;
        if (!current || current.preview) return;
        trackEvent(name);
      }
    };
  }, [record, userId]);

  return <TourContext.Provider value={api}>{children}</TourContext.Provider>;
}

export const useTour = () => useContext(TourContext);
