import React from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import WorkshopAnswerBox from '@/components/applications/WorkshopAnswerBox';

// Mock interview, answers type: the interviewer asks one question at a time and shows
// two answers the candidate could give, each built from a different experience in
// their history, with room underneath for their own third answer.
export default function AnswerWorkshop({ session, busy, atEnd, onCall }) {
  const turns = Array.isArray(session.turns) ? session.turns : [];

  return (
    <div className="mt-4 space-y-4">
      <p className="rounded-xl bg-muted/50 px-4 py-3 text-[14px] italic text-muted-foreground">{session.greeting}</p>

      {turns.map((turn, index) => (
        <div key={index} className="space-y-2.5">
          <div className="rounded-xl border border-border/70 bg-muted/40 px-4 py-3 text-[14px]">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Interviewer · question {index + 1}
            </span>
            {turn.question}
          </div>

          {Array.isArray(turn.examples) && turn.examples.length > 0 && (
            <div className="grid gap-2.5 sm:grid-cols-2">
              {turn.examples.map((example, i) => (
                <div key={i} className="rounded-xl border border-accent/40 bg-accent/5 px-4 py-3 text-[13.5px]">
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-accent">
                    Answer {i + 1}
                    {example.story ? ` · ${example.story}` : ''}
                  </span>
                  <p>{example.answer}</p>
                </div>
              ))}
            </div>
          )}

          <WorkshopAnswerBox
            value={turn.answer}
            saving={busy === 'answer'}
            onSave={(text) => onCall('answer', { answer: text, turn_index: index })}
          />
        </div>
      ))}

      <div className="flex flex-wrap items-center gap-2">
        {!atEnd && (
          <Button className="rounded-full" onClick={() => onCall('next')} disabled={busy === 'next'}>
            {busy === 'next' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {busy === 'next' ? 'Writing two more answers…' : 'Next question'}
          </Button>
        )}
        <Button
          variant="ghost"
          className="rounded-full text-muted-foreground"
          onClick={() => onCall('finish')}
          disabled={busy === 'finish'}
        >
          {busy === 'finish' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          End session
        </Button>
        <span className="ml-auto text-[12px] text-muted-foreground">
          {turns.length} question{turns.length === 1 ? '' : 's'}
        </span>
      </div>

      {atEnd && (
        <p className="text-[12.5px] text-muted-foreground">
          The interviewer has covered the posting. End the session when you are ready.
        </p>
      )}
    </div>
  );
}