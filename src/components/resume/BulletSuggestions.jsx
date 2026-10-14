import React, { useState } from 'react';
import { Loader2, Plus, Sparkles, X } from 'lucide-react';

// The "+" on a job block: asks for extra lines built from the candidate's own history and
// aimed at this posting. They are offered one at a time and only land on the résumé when
// the candidate picks them, so nothing is ever added behind their back.
export default function BulletSuggestions({ role, onSuggest, onAdd }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  const load = async () => {
    setOpen(true);
    setLoading(true);
    setError('');
    try {
      const next = await onSuggest(role);
      setSuggestions(next);
      if (!next.length) {
        setError('No extra detail came back for this job. Add more to it in your history and try again.');
      }
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || 'Could not reach the writer just now.');
    }
    setLoading(false);
  };

  const dismiss = (index) => setSuggestions((prev) => prev.filter((_, i) => i !== index));

  return (
    <div className="mt-1 pl-4">
      <button
        type="button"
        onClick={open ? () => setOpen(false) : load}
        className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[11.5px] font-medium text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground"
      >
        {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
        {open ? 'Hide suggestions' : 'Suggest more lines for this job'}
      </button>

      {open && (
        <div className="mt-2 space-y-2 rounded-xl border border-accent/25 bg-accent/5 p-3">
          {loading && <p className="text-[12.5px] text-muted-foreground">Reading your history for this job and the posting…</p>}
          {error && <p className="text-[12.5px] text-muted-foreground">{error}</p>}

          {suggestions.map((line, index) => (
            <div key={index} className="group flex items-start gap-2">
              <button
                type="button"
                onClick={() => {
                  onAdd(line);
                  dismiss(index);
                }}
                className="mt-0.5 rounded-md p-1 text-accent transition-colors hover:bg-accent/10"
                aria-label="Add this line to the résumé"
                title="Add this line"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
              <p className="flex-1 text-[13.5px] leading-relaxed text-foreground/90">{line}</p>
              <button
                type="button"
                onClick={() => dismiss(index)}
                className="mt-0.5 rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                aria-label="Dismiss this line"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}

          {!loading && !error && suggestions.length > 0 && (
            <button
              type="button"
              onClick={load}
              className="text-[11.5px] text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline"
            >
              Suggest different lines
            </button>
          )}
        </div>
      )}
    </div>
  );
}