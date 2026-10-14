import React, { useCallback, useEffect, useState } from 'react';
import { Check, Layers, Loader2, Lock, LockOpen } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import useProfile from '@/hooks/useProfile';
import DictationBox from '@/components/history/DictationBox';
import DraftEntryEditor from '@/components/history/DraftEntryEditor';
import EntryList from '@/components/history/EntryList';
import CombineDialog from '@/components/history/CombineDialog';
import HistoryReviewDialog from '@/components/history/review/HistoryReviewDialog';
import HistoryReviewPanel from '@/components/history/review/HistoryReviewPanel';
import { buildCombinedEntry } from '@/lib/mergeEntries';
import { sortEntriesByDate } from '@/lib/entryOrder';

const COMPLETE_PHRASE = /resume history is complete/i;
const DICTATION_KEY = 'resumecraft.dictation';
const DRAFT_KEY = 'resumecraft.openDraft';

const emptyFromParsed = (parsed, rawText) => ({
  entry_type: parsed.entry_type || 'work',
  title: parsed.title || 'Untitled entry',
  organization: parsed.organization || '',
  location: parsed.location || '',
  start_date: parsed.start_date || '',
  end_date: parsed.end_date || '',
  summary: parsed.summary || '',
  raw_text: rawText,
  accomplishments: parsed.accomplishments || [],
  skills: parsed.skills || [],
  metrics: parsed.metrics || [],
  keywords: parsed.keywords || [],
  suggestions: parsed.suggestions || [],
  suggestion_index: 0,
  answers: [],
  status: 'draft'
});

const editableFields = (entry) => ({
  entry_type: entry.entry_type,
  title: entry.title,
  organization: entry.organization,
  location: entry.location,
  start_date: entry.start_date,
  end_date: entry.end_date,
  summary: entry.summary,
  accomplishments: entry.accomplishments || [],
  skills: entry.skills || [],
  metrics: entry.metrics || [],
  keywords: entry.keywords || [],
  duty_timeline: entry.duty_timeline || []
});

export default function HistoryCapture() {
  const { toast } = useToast();
  const { profile, loadingProfile, save } = useProfile();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dictation, setDictation] = useState(() => localStorage.getItem(DICTATION_KEY) || '');
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [combining, setCombining] = useState(false);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [reviewRevision, setReviewRevision] = useState(0);

  const loadEntries = useCallback(async () => {
    const records = await base44.entities.CareerEntry.list('-created_date', 200);
    // The overview reads newest role first, not the order things were dictated in.
    setEntries(sortEntriesByDate(records || []));
    setLoading(false);
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  // Keep dictated words safe so a refresh or crash never loses them.
  useEffect(() => {
    if (dictation.trim()) localStorage.setItem(DICTATION_KEY, dictation);
    else localStorage.removeItem(DICTATION_KEY);
  }, [dictation]);

  // Reopen the entry that was open when the page reloaded.
  useEffect(() => {
    if (loading) return;
    const pendingId = localStorage.getItem(DRAFT_KEY);
    if (!pendingId) return;
    const pending = entries.find((entry) => entry.id === pendingId);
    if (pending) setDraft((current) => current || pending);
    else localStorage.removeItem(DRAFT_KEY);
  }, [loading, entries]);

  // Remember the open entry, and quietly save its edits while you type.
  useEffect(() => {
    if (!draft) {
      localStorage.removeItem(DRAFT_KEY);
      return undefined;
    }
    localStorage.setItem(DRAFT_KEY, draft.id);
    if (busy) return undefined;
    const timer = setTimeout(() => {
      base44.entities.CareerEntry.update(draft.id, editableFields(draft)).catch(() => {});
    }, 1200);
    return () => clearTimeout(timer);
  }, [draft, busy]);

  const confirmed = entries.filter((entry) => entry.status === 'confirmed');
  const historyComplete = !!profile.history_complete;
  const selectedEntries = entries.filter((entry) => selectedIds.includes(entry.id));

  const reportError = (title, error) => {
    toast({ title, description: error?.response?.data?.error || error.message, variant: 'destructive' });
  };

  const capture = async () => {
    const text = dictation.trim();
    if (!text) return;
    if (COMPLETE_PHRASE.test(text)) {
      setDictation('');
      await lockHistory();
      return;
    }
    setBusy(true);
    try {
      const response = await base44.functions.invoke('parseCareerEntry', { raw_text: text });
      const created = await base44.entities.CareerEntry.create(emptyFromParsed(response.data || {}, text));
      setDictation('');
      setDraft(created);
      await loadEntries();
    } catch (error) {
      reportError('Could not capture that entry', error);
    }
    setBusy(false);
  };

  const persistDraft = async (values, extra = {}) => {
    const updated = await base44.entities.CareerEntry.update(values.id, { ...editableFields(values), ...extra });
    setDraft(updated);
    await loadEntries();
    return updated;
  };

  const answerSuggestion = async ({ decision, comment }) => {
    if (!draft) return;
    const suggestions = draft.suggestions || [];
    const index = draft.suggestion_index || 0;
    const suggestion = suggestions[index] || '';
    const nextIndex = index + 1;
    setBusy(true);
    try {
      if (decision === 'yes') {
        const response = await base44.functions.invoke('applySuggestionAnswer', {
          suggestion,
          comment: comment || '',
          entry: editableFields(draft)
        });
        const merged = response.data || {};
        await persistDraft(draft, {
          accomplishments: merged.accomplishments || draft.accomplishments || [],
          skills: merged.skills || draft.skills || [],
          metrics: merged.metrics || draft.metrics || [],
          keywords: merged.keywords || draft.keywords || [],
          summary: merged.summary || draft.summary,
          answers: [...(draft.answers || []), `${suggestion} → yes: ${comment}`],
          suggestion_index: nextIndex
        });
        if (merged.change_note) toast({ title: merged.change_note });
      } else {
        await persistDraft(draft, {
          answers: [...(draft.answers || []), `${suggestion} → ${decision === 'no' ? 'no' : 'passed'}`],
          suggestion_index: nextIndex
        });
      }
    } catch (error) {
      reportError('That answer could not be merged in', error);
    }
    setBusy(false);
  };

  const saveEntry = async () => {
    if (!draft) return;
    setBusy(true);
    try {
      await persistDraft(draft, { status: 'confirmed' });
      setDraft(null);
      toast({ title: 'Entry saved to your history' });
    } catch (error) {
      reportError('That entry could not be saved', error);
    }
    setBusy(false);
  };

  const discardDraft = async () => {
    if (!draft) return;
    setBusy(true);
    try {
      await base44.entities.CareerEntry.delete(draft.id);
      setDraft(null);
      await loadEntries();
    } catch (error) {
      reportError('That entry could not be discarded', error);
    }
    setBusy(false);
  };

  const editEntry = async (entry) => {
    if (draft && draft.id !== entry.id) await persistDraft(draft);
    setDraft(entry);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteEntry = async (entry) => {
    if (!window.confirm(`Delete “${entry.title}”?`)) return;
    await base44.entities.CareerEntry.delete(entry.id);
    if (draft && draft.id === entry.id) setDraft(null);
    await loadEntries();
  };

  const prepareReview = async () => {
    if (draft) await persistDraft(draft);
    setDraft(null);
    setSelectedIds([]);
  };
  const openReview = async (entry) => {
    try { await prepareReview(); setReviewTarget({ anchor: entry }); }
    catch (error) { reportError('Could not open review', error); }
  };
  const openSavedReview = async (review) => {
    await prepareReview(); setReviewTarget({ initialReview: review });
  };
  const reviewChanged = async () => {
    await loadEntries(); setReviewRevision(value => value + 1);
  };
  const restoreReview = async (review) => {
    await prepareReview();
    await base44.functions.invoke('commitCareerReview', { review_id: review.id, action: 'restore' });
    await reviewChanged();
    toast({ title: 'Original career entries restored' });
  };

  const toggleSelected = (entry) => {
    setSelectedIds((prev) => (prev.includes(entry.id) ? prev.filter((id) => id !== entry.id) : [...prev, entry.id]));
  };

  const combinePositions = async (values) => {
    const merged = buildCombinedEntry(selectedEntries, values);
    const count = selectedEntries.length;
    setBusy(true);
    try {
      await base44.entities.CareerEntry.create(merged);
      await Promise.all(selectedEntries.map((entry) => base44.entities.CareerEntry.delete(entry.id)));
      setSelectedIds([]);
      setCombining(false);
      setDraft(null);
      await loadEntries();
      toast({
        title: `Combined into ${merged.organization || 'one employer'}`,
        description: `${count} positions now sit inside a single employer block.`
      });
    } catch (error) {
      reportError('Those positions could not be combined', error);
    }
    setBusy(false);
  };

  const lockHistory = async () => {
    if (!confirmed.length) {
      toast({ title: 'Nothing to lock in yet', description: 'Capture and save at least one entry first.' });
      return;
    }
    setBusy(true);
    try {
      const response = await base44.functions.invoke('finalizeHistory', { entries: confirmed });
      const data = response.data || {};
      await save({
        history_complete: true,
        master_summary: data.master_summary || profile.master_summary || '',
        core_skills: data.core_skills || [],
        target_titles: data.target_titles || []
      });
      toast({ title: 'Career history complete', description: 'Your master history is locked in and ready to tailor.' });
    } catch (error) {
      reportError('The history could not be locked in', error);
    }
    setBusy(false);
  };

  const unlockHistory = async () => {
    await save({ history_complete: false });
    toast({ title: 'History unlocked', description: 'Add more entries whenever you like.' });
  };

  return (
    <div className="animate-rise">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <p className="eyebrow">Step one</p>
          <h1 className="mt-3 font-heading text-[30px] leading-tight tracking-tight sm:text-[36px]">Capture your career history</h1>
          <p className="mt-3 text-[14.5px] leading-relaxed text-muted-foreground">
            One entry at a time. I will ask follow-up questions you can accept with a detail, pass on, or skip.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {historyComplete ? (
            <Button variant="secondary" className="rounded-full" onClick={unlockHistory}>
              <LockOpen className="mr-2 h-4 w-4" /> Unlock history
            </Button>
          ) : (
            <Button variant="secondary" className="rounded-full" onClick={lockHistory} disabled={busy || !confirmed.length}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
              History is complete
            </Button>
          )}
        </div>
      </header>

      {historyComplete && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-accent/25 bg-accent/5 px-5 py-4">
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" strokeWidth={2} />
          <p className="text-[13.5px] leading-relaxed text-foreground/90">
            Your master history is locked in with {confirmed.length} confirmed entries. You can still add or edit entries here,
            and re-lock the history when you are done.
          </p>
        </div>
      )}

      {!historyComplete && !loadingProfile && (
        <div className="mt-6">
          <DictationBox value={dictation} onChange={setDictation} onSubmit={capture} busy={busy} />
        </div>
      )}

      {draft && (
        <div className="mt-6">
          <DraftEntryEditor
            entry={draft}
            busy={busy}
            onChange={(patch) => setDraft((prev) => ({ ...prev, ...patch }))}
            onAnswer={answerSuggestion}
            onSave={saveEntry}
            onDiscard={discardDraft}
          />
        </div>
      )}

      <section className="mt-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Master history</p>
            <h2 className="mt-2 font-heading text-[22px]">
              {loading ? 'Loading…' : `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'} captured`}
            </h2>
          </div>
          {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
        {!loading && entries.length > 1 && (
          <p className="mt-2 text-[13px] text-muted-foreground">
            Tick the positions that overlap in time to combine them into one employer block.
          </p>
        )}
        {selectedEntries.length > 0 && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-accent/30 bg-accent/5 px-5 py-3">
            <p className="text-[13.5px] text-foreground/90">
              {selectedEntries.length} {selectedEntries.length === 1 ? 'position' : 'positions'} selected
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full text-muted-foreground"
                onClick={() => setSelectedIds([])}
              >
                Clear
              </Button>
              <Button
                size="sm"
                className="rounded-full"
                disabled={selectedEntries.length < 2 || busy}
                onClick={() => setCombining(true)}
              >
                <Layers className="mr-2 h-3.5 w-3.5" /> Combine into one employer
              </Button>
            </div>
          </div>
        )}
        <div className="mt-5">
          <EntryList
            entries={entries}
            activeId={draft && draft.id}
            selectedIds={selectedIds}
            onToggle={toggleSelected}
            onEdit={editEntry}
            onDelete={deleteEntry}
            onReview={openReview}
          />
        </div>
        <HistoryReviewPanel revision={reviewRevision} onOpen={openSavedReview} onRestore={restoreReview} />
        {reviewTarget && <HistoryReviewDialog {...reviewTarget} onChanged={reviewChanged} onClose={() => { setReviewTarget(null); setReviewRevision(value => value + 1); }} />}
        {combining && (
          <CombineDialog
            entries={selectedEntries}
            busy={busy}
            onClose={() => setCombining(false)}
            onConfirm={combinePositions}
          />
        )}
      </section>
    </div>
  );
}