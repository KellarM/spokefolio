import React, { useEffect, useRef } from 'react';
import { Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import useInterviewVoice from '@/hooks/useInterviewVoice';

// The spoken half of the mock interview drill. While voice mode is on, the
// interviewer asks each question out loud, the microphone opens for the
// answer, the feedback is spoken, and the loop advances on its own. Typing
// still works the whole time - voice never removes the written path.

// Spoken exits: saying one of these instead of an answer closes voice mode.
const CLOSERS = ['close', 'stop', "that's all", 'thats all', "that's it", 'thats it', 'goodbye', 'end session', 'leave the interview'];
const escapeRe = (word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const isCloser = (text) => {
  const lower = ' ' + String(text || '').toLowerCase() + ' ';
  return CLOSERS.some((word) => new RegExp('(^|[^a-zà-ÿ0-9])' + escapeRe(word) + '([^a-zà-ÿ0-9]|$)').test(lower));
};

const PHASE_LABEL = {
  speaking: 'Interviewer is speaking…',
  listening: 'Your turn - answer out loud',
  thinking: 'Interviewer is thinking…'
};

export default function InterviewVoice({ active, greeting, pendingQuestion, feedback, askNonce = 0, onAnswer, onNext, onExit }) {
  const { phase, setPhase, heard, setHeard, say, listenOnce, stopAll } = useInterviewVoice();

  // The loop is driven by the question index and the feedback index - stable
  // numbers, so a re-render (busy spinners, toasts) never restarts a run or
  // cancels a live microphone. The latest props ride along in this ref.
  const latestRef = useRef({ greeting, pendingQuestion, feedback, onAnswer, onNext, onExit });
  latestRef.current = { greeting, pendingQuestion, feedback, onAnswer, onNext, onExit };

  // Bookkeeping for what has already been spoken, so a re-render never
  // repeats a question or a piece of feedback.
  const spokenRef = useRef({ greeted: false, q: -1, fb: -1 });
  const prevActiveRef = useRef(false);
  const nonceRef = useRef(askNonce);

  const qIndex = pendingQuestion ? pendingQuestion.index : -1;
  const fbIndex = feedback ? feedback.index : -1;

  useEffect(() => {
    if (!active) {
      prevActiveRef.current = false;
      stopAll();
      return;
    }
    // Activation: reset the bookkeeping so the current question is spoken,
    // but stale feedback from before voice mode stays unsaid.
    if (!prevActiveRef.current) {
      prevActiveRef.current = true;
      nonceRef.current = askNonce;
      spokenRef.current = { greeted: false, q: -1, fb: latestRef.current.feedback ? latestRef.current.feedback.index : -1 };
    }
    // A redo reopens a question that was already asked: ask it again.
    if (nonceRef.current !== askNonce) {
      nonceRef.current = askNonce;
      spokenRef.current.q = -1;
    }

    let cancelled = false;
    const stop = () => { cancelled = true; stopAll(); };

    (async () => {
      const { greeting: hi, pendingQuestion: q, feedback: fb, onAnswer: answer, onNext: next, onExit: exit } = latestRef.current;

      if (!spokenRef.current.greeted && hi) {
        spokenRef.current.greeted = true;
        setPhase('speaking');
        await say(hi, { bargeable: false });
        if (cancelled) return;
      }

      // A question waiting for its answer: ask it out loud, then listen.
      if (q && spokenRef.current.q !== q.index) {
        spokenRef.current.q = q.index;
        setPhase('speaking');
        await say(q.question); // bargeable: heard enough? talk over it
        if (cancelled) return;
        setHeard('');

        let text = '';
        for (let attempt = 0; attempt < 2 && !text; attempt++) {
          text = await listenOnce();
          if (cancelled) return;
        }
        if (!text) {
          // Two silent passes: hand the question back to the keyboard.
          setPhase('speaking');
          await say("I didn't catch that. Type your answer below, or tap voice mode to try again.", { bargeable: false });
          if (!cancelled) exit();
          return;
        }
        setHeard(text);
        if (isCloser(text)) {
          setPhase('speaking');
          await say('Closing the interview. Your answers so far are saved on screen.', { bargeable: false });
          if (!cancelled) exit();
          return;
        }
        setPhase('thinking');
        const data = await answer(text);
        if (cancelled) return;
        if (data?.done) {
          setPhase('speaking');
          await say("That's everything I need. Open the readiness report whenever you're ready.", { bargeable: false });
          if (!cancelled) exit();
          return;
        }
        // Not done: the panel just recorded the answer and its feedback;
        // the feedback effect below picks it up on this run's next pass.
        const done = latestRef.current.feedback;
        if (done && spokenRef.current.fb !== done.index) {
          spokenRef.current.fb = done.index;
          setPhase('speaking');
          await say(done.text, { bargeable: false });
          if (cancelled) return;
          setPhase('thinking');
          const nextData = await next();
          if (cancelled) return;
          if (nextData?.done) {
            setPhase('speaking');
            await say("That covers the posting. End the session when you're ready.", { bargeable: false });
            if (!cancelled) exit();
            return;
          }
        }
        setPhase('idle');
        return;
      }

      // No question pending, but new feedback exists (e.g. the candidate
      // typed the answer): speak it once, then advance.
      if (!q && fb && spokenRef.current.fb !== fb.index) {
        spokenRef.current.fb = fb.index;
        setPhase('speaking');
        await say(fb.text, { bargeable: false });
        if (cancelled) return;
        setPhase('thinking');
        const data = await next();
        if (cancelled) return;
        if (data?.done) {
          setPhase('speaking');
          await say("That covers the posting. End the session when you're ready.", { bargeable: false });
          if (!cancelled) exit();
          return;
        }
        setPhase('idle');
        return;
      }

      setPhase('idle');
    })();

    return stop;
  }, [active, qIndex, fbIndex, askNonce, greeting, say, listenOnce, setPhase, setHeard, stopAll]);

  if (!active) return null;

  return (
    <div role="status" aria-live="polite" className="rounded-xl border border-accent/40 bg-accent/5 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[13.5px] font-medium text-accent">
          {phase !== 'idle' ? PHASE_LABEL[phase] || 'Voice interview' : 'Voice interview on hold'}
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="rounded-full text-muted-foreground"
          onClick={onExit}
        >
          <Square className="mr-2 h-3 w-3" /> Stop voice mode
        </Button>
      </div>
      {heard && (
        <p className="mt-1.5 text-[12px] italic text-muted-foreground">&ldquo;{heard}&rdquo;</p>
      )}
      <p className="mt-1 text-[11.5px] text-muted-foreground">
        The interviewer asks, you answer out loud, and the mic stops when you pause. Say &ldquo;close&rdquo; to stop. You can also type at any time.
      </p>
    </div>
  );
}
