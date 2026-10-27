import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, MessageSquare, Mic, RotateCcw, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import DictateButton from '@/components/common/DictateButton';
import { appendLine } from '@/hooks/useDictation';
import { useToast } from '@/components/ui/use-toast';
import AnswerWorkshop from '@/components/applications/AnswerWorkshop';
import InterviewVoice from '@/components/applications/InterviewVoice';
import DeleteSessionButton from '@/components/applications/DeleteSessionButton';

// The Interview section: the app plays the hiring company's HR interviewer for this
// specific role. Answers can be typed or spoken with the dictate button. Every drill
// is kept on the application record, so past sessions and their readiness reports
// stay with the job. A side panel shows the prep material: proof points, known gaps,
// company notes, and questions worth asking them.
export default function InterviewPanel({ application, onApplicationUpdate }) {
  const { toast } = useToast();
  const [answer, setAnswer] = useState('');
  const [busy, setBusy] = useState(null); // 'start' | 'answer' | 'next' | 'finish' | null
  const [workshopDone, setWorkshopDone] = useState(false);

  const sessions = Array.isArray(application.mock_interviews) ? application.mock_interviews : [];
  const active = sessions.find((s) => s.status === 'active') || null;
  const finished = sessions.filter((s) => s.status === 'finished');
  const prep = application.interview_prep || null;

  const isWorkshop = active?.session_type === 'answers';

  // Voice mode for the drill: the interviewer asks out loud, the candidate
  // answers out loud. It activates with the session itself (Michael, Oct
  // 26) and can be stopped or restarted from the drill panel at any time.
  const [voiceOn, setVoiceOn] = useState(false);
  const [askNonce, setAskNonce] = useState(0);
  useEffect(() => {
    if (active && !isWorkshop) setVoiceOn(true);
  }, [active?.id, isWorkshop]); // deps: a new practice session turns the voice on

  const pendingQuestion = useMemo(() => {
    if (!active || isWorkshop || !Array.isArray(active.turns)) return null;
    return active.turns.find((t) => !String(t.answer || '').trim()) || null;
  }, [active, isWorkshop]);

  // Only the most recent answered question can be reopened: the questions after it were
  // asked in response to how it was answered.
  const lastAnsweredIndex = useMemo(() => {
    const list = Array.isArray(active?.turns) ? active.turns : [];
    for (let i = list.length - 1; i >= 0; i -= 1) {
      if (String(list[i]?.answer || '').trim()) return i;
    }
    return -1;
  }, [active]);

  // The open question, with its turn index, for the voice loop.
  const voiceQuestion = useMemo(() => {
    if (!pendingQuestion || !active?.turns) return null;
    const index = active.turns.indexOf(pendingQuestion);
    return index >= 0 ? { index, question: pendingQuestion.question } : null;
  }, [active?.turns, pendingQuestion]);

  // The newest graded answer, spoken once by the voice loop.
  const voiceFeedback = useMemo(() => {
    if (!active?.turns || lastAnsweredIndex < 0) return null;
    const turn = active.turns[lastAnsweredIndex];
    const fb = turn?.feedback;
    if (!fb || (!fb.landed && !fb.improve)) return null;
    const text = [fb.landed, fb.improve ? `To improve: ${fb.improve}` : ''].filter(Boolean).join(' ');
    return { index: lastAnsweredIndex, text };
  }, [active?.turns, lastAnsweredIndex]);

  const call = async (mode, extra = {}) => {
    setBusy(mode);
    try {
      const response = await base44.functions.invoke('runMockInterview', {
        application_id: application.id,
        mode,
        ...extra
      });
      const data = response?.data || {};
      if (data.mock_interviews) onApplicationUpdate({ mock_interviews: data.mock_interviews });
      if (mode === 'answer') {
        setAnswer('');
        if (data.done) {
          toast({ title: 'Interviewer has what they need', description: 'Wrap up whenever you are ready for the readiness report.' });
        }
      }
      if (mode === 'start' || mode === 'next') {
        setWorkshopDone(Boolean(data.done));
        if (mode === 'next' && data.done) {
          toast({ title: 'The posting has been covered', description: 'End the session when you are ready.' });
        }
      }
      return data;
    } catch (error) {
      toast({
        title: 'The interview drill hit a snag',
        description: error?.response?.data?.error || error?.message,
        variant: 'destructive'
      });
      return null;
    } finally {
      setBusy(null);
    }
  };

  // Second chance on a question: their answer and its grade are cleared and the question
  // comes back open with what they wrote, so they can say it better.
  const redo = async (turn, index) => {
    setAskNonce((n) => n + 1); // the reopened question is asked out loud again
    const data = await call('redo', { turn_index: index });
    if (data) setAnswer(String(turn?.answer || ''));
  };

  // Drop one saved session: the drill and its readiness report go with it.
  const deleteSession = async (sessionId) => {
    const remaining = sessions.filter((session) => session.id !== sessionId);
    await base44.entities.JobApplication.update(application.id, { mock_interviews: remaining });
    onApplicationUpdate({ mock_interviews: remaining });
    toast({ title: 'Session deleted', description: 'That mock interview and its report are gone.' });
  };

  const askCount = active?.turns?.length || 0;

  return (
    <section className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      {/* Drill column */}
      <div className="rounded-2xl border border-border/70 bg-card p-5">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <h2 className="eyebrow">Interview</h2>
        </div>
        <p className="mt-1.5 text-[15px] font-medium">
          {active
            ? isWorkshop
              ? 'Answer workshop in progress'
              : 'Drill in progress'
            : `Practice with ${application.company || 'the hiring company'}'s HR`}
        </p>
        <p className="mt-1 text-[13px] text-muted-foreground">
          {isWorkshop
            ? 'The interviewer asks one question at a time, then shows two answers you could give, each from a different experience in your history. Borrow either one, or write your own in the third box and the interviewer will tell you how it landed.'
            : active
              ? 'Answer out loud or type it. The interviewer grades each answer honestly, then asks the next question.'
              : 'Two ways to prepare for this exact posting. Practice: you answer, the interviewer grades you and shows the answer to give. Answers: the interviewer asks, then shows you two answers you could give.'}
        </p>

        {!active && (
          <div className="mt-4 flex flex-wrap gap-2">
            <Button className="rounded-full" onClick={() => call('start', { session_type: 'practice' })} disabled={busy === 'start'}>
              {busy === 'start' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              {busy === 'start' ? 'The interviewer is getting ready…' : 'Mock interview'}
            </Button>
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => call('start', { session_type: 'answers' })}
              disabled={busy === 'start'}
            >
              {busy === 'start' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              {busy === 'start' ? 'The interviewer is getting ready…' : 'Mock interview / Answers'}
            </Button>
          </div>
        )}

        {active && isWorkshop && (
          <AnswerWorkshop session={active} busy={busy} atEnd={workshopDone} onCall={call} />
        )}

        {active && !isWorkshop && (
          <div className="mt-4 space-y-4">
            <InterviewVoice
              active={voiceOn}
              greeting={active.greeting}
              pendingQuestion={voiceQuestion}
              feedback={voiceFeedback}
              askNonce={askNonce}
              onAnswer={(text) => call('answer', { answer: text })}
              onNext={() => call('next')}
              onExit={() => setVoiceOn(false)}
            />
            {!voiceOn && (
              <Button type="button" variant="secondary" className="dictate-voice rounded-full" onClick={() => setVoiceOn(true)}>
                <Mic className="mr-2 h-4 w-4" /> Voice mode
              </Button>
            )}
            <p className="rounded-xl bg-muted/50 px-4 py-3 text-[14px] italic text-muted-foreground">
              {active.greeting}
            </p>

            {active.turns?.map((turn, index) => (
              <div key={index} className="space-y-2.5">
                <div className="rounded-xl border border-border/70 bg-muted/40 px-4 py-3 text-[14px]">
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Interviewer
                  </span>
                  {turn.question}
                </div>
                {String(turn.answer || '').trim() && (
                  <>
                    <div className="flex justify-end">
                      <div className="max-w-[85%] rounded-xl bg-primary px-4 py-3 text-[14px] text-primary-foreground">
                        {turn.answer}
                      </div>
                    </div>
                    {turn.feedback && (
                      <div className="rounded-xl border border-border/70 px-4 py-3 text-[13px]">
                        <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          How that landed
                        </span>
                        {turn.feedback.landed && <p>{turn.feedback.landed}</p>}
                        {turn.feedback.improve && (
                          <p className="mt-1.5 text-muted-foreground">To improve: {turn.feedback.improve}</p>
                        )}
                        {turn.feedback.model_answer && (
                          <div className="mt-3 rounded-lg border border-accent/40 bg-accent/5 px-3.5 py-3">
                            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-accent">
                              The answer to give
                            </span>
                            <p>{turn.feedback.model_answer}</p>
                          </div>
                        )}
                        {index === lastAnsweredIndex && (
                          <div className="mt-3 flex justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="rounded-full text-muted-foreground"
                              onClick={() => redo(turn, index)}
                              disabled={busy === 'redo'}
                            >
                              {busy === 'redo' ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <RotateCcw className="mr-2 h-4 w-4" />
                              )}
                              {busy === 'redo' ? 'Reopening the question…' : 'Redo this answer'}
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}

            {pendingQuestion ? (
              <div>
                <Textarea
                  rows={4}
                  value={answer}
                  onChange={(event) => setAnswer(event.target.value)}
                  placeholder="Answer the way you would in the room…"
                  className="text-[14px]"
                />
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <DictateButton label={null} onText={(transcript) => setAnswer((prev) => appendLine(prev, transcript))} />
                  <Button
                    className="rounded-full"
                    onClick={() => call('answer', { answer })}
                    disabled={busy === 'answer' || !answer.trim()}
                  >
                    {busy === 'answer' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {busy === 'answer' ? 'Interviewer is thinking…' : 'Send answer'}
                  </Button>
                  <Button
                    variant="ghost"
                    className="rounded-full text-muted-foreground"
                    onClick={() => call('finish')}
                    disabled={busy === 'finish'}
                  >
                    {busy === 'finish' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Wrap up and get my report
                  </Button>
                  <span className="ml-auto text-[12px] text-muted-foreground">Question {askCount}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button className="rounded-full" onClick={() => call('finish')} disabled={busy === 'finish'}>
                  {busy === 'finish' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Wrap up and get my report
                </Button>
              </div>
            )}
          </div>
        )}

        {finished.length > 0 && (
          <div className="mt-6 space-y-3 border-t border-border/60 pt-5">
            <p className="eyebrow">Past sessions</p>
            {finished.map((session) => (
              <details key={session.id} className="rounded-xl border border-border/70 px-4 py-3">
                <summary className="cursor-pointer text-[13px] font-medium">
                  {new Date(session.started_at).toLocaleDateString('en-CA', { dateStyle: 'medium' })}
                  {' · '}
                  {session.turns?.length || 0} questions
                </summary>
                <div className="mt-3 space-y-3 text-[13px]">
                  <div className="flex justify-end">
                    <DeleteSessionButton onDelete={() => deleteSession(session.id)} />
                  </div>
                  {session.session_type === 'answers' && session.turns?.length > 0 && (
                    <ol className="list-decimal space-y-1.5 pl-4">
                      {session.turns.map((turn, i) => (
                        <li key={i}>
                          {turn.question}
                          {String(turn.answer || '').trim() && (
                            <span className="mt-0.5 block text-muted-foreground">My answer: {turn.answer}</span>
                          )}
                          {turn.feedback?.improve && (
                            <span className="mt-0.5 block text-muted-foreground">To improve: {turn.feedback.improve}</span>
                          )}
                        </li>
                      ))}
                    </ol>
                  )}
                  {session.summary?.readiness && (
                    <p className="text-[13.5px]">{session.summary.readiness}</p>
                  )}
                  {session.summary?.strengths?.length > 0 && (
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">What landed</p>
                      <ul className="mt-1 list-disc pl-4">
                        {session.summary.strengths.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {session.summary?.rehearse?.length > 0 && (
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Rehearse before the real one</p>
                      <ul className="mt-1 list-disc pl-4">
                        {session.summary.rehearse.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {session.summary?.best_proof_points?.length > 0 && (
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Say these out loud in the real interview</p>
                      <ul className="mt-1 list-disc pl-4">
                        {session.summary.best_proof_points.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </details>
            ))}
          </div>
        )}
      </div>

      {/* Prep column */}
      <div className="space-y-4">
        {prep?.proof_points?.length > 0 && (
          <div className="rounded-2xl border border-border/70 bg-card p-5">
            <p className="eyebrow">Your proof points</p>
            <ul className="mt-3 space-y-2.5 text-[13px]">
              {prep.proof_points.map((point, i) => (
                <li key={i}>
                  <span className="font-medium">{point.requirement}</span>
                  <span className="mt-0.5 block text-muted-foreground">Say: {point.evidence}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {application.gaps?.length > 0 && (
          <div className="rounded-2xl border border-border/70 bg-card p-5">
            <p className="eyebrow">Known gaps</p>
            <ul className="mt-3 list-disc space-y-1.5 pl-4 text-[13px]">
              {application.gaps.map((gap, i) => (
                <li key={i}>{gap}</li>
              ))}
            </ul>
          </div>
        )}

        {prep?.likely_questions?.length > 0 && (
          <div className="rounded-2xl border border-border/70 bg-card p-5">
            <p className="eyebrow">Questions to expect</p>
            <ul className="mt-3 list-disc space-y-1.5 pl-4 text-[13px]">
              {prep.likely_questions.map((question, i) => (
                <li key={i}>{question}</li>
              ))}
            </ul>
          </div>
        )}

        {prep?.questions_to_ask?.length > 0 && (
          <div className="rounded-2xl border border-border/70 bg-card p-5">
            <p className="eyebrow">Worth asking them</p>
            <ul className="mt-3 list-disc space-y-1.5 pl-4 text-[13px]">
              {prep.questions_to_ask.map((question, i) => (
                <li key={i}>{question}</li>
              ))}
            </ul>
          </div>
        )}

        {!prep && (
          <div className="rounded-2xl border border-dashed border-border/70 bg-card p-5 text-[13px] text-muted-foreground">
            <Mic className="mb-2 h-4 w-4" />
            Proof points, gaps, and likely questions appear here once a tailored résumé exists and the package has been
            generated, or after your first drill. Tailor the résumé first to get the most out of practice.
          </div>
        )}
      </div>
    </section>
  );
}