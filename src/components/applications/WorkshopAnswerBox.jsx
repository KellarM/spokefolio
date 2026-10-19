import React, { useEffect, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import DictateButton from '@/components/common/DictateButton';
import { appendLine } from '@/hooks/useDictation';

// The workshop's third answer: the candidate's own, typed or dictated, kept with the
// question so it is still there next time they open the session.
export default function WorkshopAnswerBox({ value, initialDraft = '', saving, onSave }) {
  const stored = String(value || '').trim();
  const [draft, setDraft] = useState(stored || String(initialDraft || ''));

  useEffect(() => {
    setDraft(String(value || '') || String(initialDraft || ''));
  }, [value, initialDraft]);

  const unchanged = draft.trim() === stored;

  return (
    <div className="rounded-xl border border-border/70 px-4 py-3">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        Answer 3 · your own
      </span>
      <Textarea
        rows={4}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder="Use the two above as a guide, then say it your way, from what you actually remember doing…"
        className="text-[13.5px]"
      />
      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <DictateButton label={null} onText={(transcript) => setDraft((prev) => appendLine(prev, transcript))} />
        <Button
          size="sm"
          variant={unchanged && stored ? 'ghost' : 'default'}
          className="rounded-full"
          onClick={() => onSave(draft.trim())}
          disabled={saving || !draft.trim() || unchanged}
        >
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : unchanged && stored ? <Check className="mr-2 h-4 w-4" /> : null}
          {saving ? 'Reading your answer…' : unchanged && stored ? 'Saved' : stored ? 'Update my answer' : 'Save my answer'}
        </Button>
        <span className="ml-auto text-[11.5px] text-muted-foreground">
          Answers 1 and 2 use only what your history records for that experience.
        </span>
      </div>
    </div>
  );
}