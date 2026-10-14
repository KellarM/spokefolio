import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import ReviewDraftEditor from '@/components/history/review/ReviewDraftEditor';
import ReviewSources from '@/components/history/review/ReviewSources';
import ReviewQuestions from '@/components/history/review/ReviewQuestions';
export default function ReviewWorkspace({ state }) {
  const { review, active, setActive, updateEntry, answers, setAnswers, applyAnswers, busy, save, apply } = state;
  const [destination, setDestination] = useState('accomplishments'); const entry = review.drafts[active];
  const locked = review.status !== 'draft';
  const add = text => updateEntry({ ...entry, [destination]: destination === 'summary' ? [entry.summary, text].filter(Boolean).join('\n') : [...(entry[destination] || []), text] });
  return <div className="space-y-5"><div className="rounded-lg border bg-secondary/40 p-3 text-sm"><strong>{review.sources.length} originals → {review.drafts.length} organized entries</strong><p className="mt-1 text-xs text-muted-foreground">Edits stay in this review until accepted. Draft edits are saved on this browser; Save review also saves them to your account. Employers and career periods remain distinct.</p></div>
    <details className="rounded-lg border p-3 text-sm"><summary className="cursor-pointer font-medium">Original entries that will be replaced</summary><ul className="mt-2 space-y-1">{review.sources.map(s => <li key={s.id}>{s.title} · {s.organization} · {[s.start_date,s.end_date].filter(Boolean).join(' – ')}</li>)}</ul></details>
    <label className="block text-sm font-medium">Editing organized entry<select className="mt-2 w-full rounded-md border bg-card p-2" value={active} onChange={e => setActive(Number(e.target.value))}>{review.drafts.map((d,i) => <option key={i} value={i}>{i+1}. {d.title} · {d.organization} · {d.start_date} – {d.end_date}</option>)}</select></label>
    {locked && <p className="text-sm text-muted-foreground">This replacement was interrupted. Resume it below, or close and restore originals from Saved reviews.</p>}
    <fieldset disabled={busy || locked} className="min-w-0 space-y-5 disabled:opacity-60">
      <div className="grid min-w-0 items-start gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]"><ReviewDraftEditor entry={entry} onChange={updateEntry} /><ReviewSources sources={review.sources} onAdd={add} destination={destination} setDestination={setDestination} /></div>
      <ReviewQuestions questions={review.questions} answers={answers} onChange={setAnswers} onApply={applyAnswers} busy={busy || locked} />
      {!!review.answers?.length && <details className="rounded-lg border p-3 text-sm"><summary className="cursor-pointer">Applied clarification answers</summary>{review.answers.map((answer,i) => <p className="mt-3 whitespace-pre-wrap" key={i}>{answer}</p>)}</details>}
    </fieldset>
    <div className="sticky bottom-0 flex flex-wrap justify-end gap-2 border-t bg-background py-4">
      {!locked && <Button variant="secondary" disabled={busy} onClick={save}>Save review & close</Button>}
      <Button disabled={busy || !review.drafts.every(d => d.title?.trim())} onClick={apply}>{busy ? 'Working…' : locked ? 'Resume replacement' : 'Accept & replace originals'}</Button>
    </div>
  </div>;
}