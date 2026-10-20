import React, { useCallback, useEffect, useState } from 'react';
import { Check, Layers, Loader2, Lock, LockOpen } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import useProfile from '@/hooks/useProfile';
import DictationBox from '@/components/history/DictationBox';
import KeywordDetailBuilder from '@/components/history/KeywordDetailBuilder';
import DraftEntryEditor from '@/components/history/DraftEntryEditor';
import EntryList from '@/components/history/EntryList';
import CombineDialog from '@/components/history/CombineDialog';
import HistoryReviewDialog from '@/components/history/review/HistoryReviewDialog';
import HistoryReviewPanel from '@/components/history/review/HistoryReviewPanel';
import ClearHistoryButton from '@/components/history/ClearHistoryButton';
import { buildCombinedEntry } from '@/lib/mergeEntries';
import { sortEntriesByDate } from '@/lib/entryOrder';
import retryOnTimeout from '@/lib/retryOnTimeout';

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
  raw_text: entry.raw_text || '',
  accomplishments: entry.accomplishments || [],
  skills: entry.skills || [],
  metrics: entry.metrics || [],
  keywords: entry.keywords || [],
  duty_timeline: entry.duty_timeline || []
});

// Adds only what is genuinely new, so nothing already captured is written over.
const mergedList = (current, incoming) =>
  (incoming || []).reduce((list, item) => {
    const text = String(item || '').trim();
    if (!text || list.some((existing) => String(existing).trim().toLowerCase() === text.toLowerCase())) return list;
    return [...list, text];
  }, [...(current || [])]);

// Prompts already answered stay answered when the words are read again.
const unansweredPrompts = (prompts, answers) => {
  const asked = new Set((answers || []).map((answer) => String(answer).split(' → ')[0]));
  return (prompts || []).filter((prompt) => !asked.has(prompt));
};

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
      retryOnTimeout(() => base44.entities.CareerEntry.update(draft.id, editableFields(draft))).catch(() => {});
    }, 1200);
    return () => clearTimeout(timer);
  }, [draft, busy]);

  const confirmed = entries.filter((entry) => entry.status === 'confirmed');
  const openDrafts = entries.filter((entry) => entry.status !== 'confirmed');
  const historyComplete = !!profile.history_complete;
  const selectedEntries = entries.filter((entry) => selectedIds.includes(entry.id));

  const reportError = (title, error) => {
    const raw = error?.response?.data?.error || error.message || '';
    toast({
      title,
      description: /timed out|timeout/i.test(raw)
        ? 'The save service took too long to answer. Nothing you wrote is lost — try that button once more.'
        : raw,
      variant: 'destructive'
    });
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

  // Confirms the entry on the server actually holds what we tried to save, so a lost reply is
  // never reported as a lost entry.
  const serverHas = (record, payload) =>
    !!record &&
    Object.entries(payload).every(([key, value]) =>
      JSON.stringify(record[key] ?? null) === JSON.stringify(value ?? null)
    );

  const persistDraft = async (values, extra = {}) => {
    const payload = { ...editableFields(values), ...extra };
    let updated;
    try {
      updated = await retryOnTimeout(() => base44.entities.CareerEntry.update(values.id, payload));
    } catch (error) {
      const saved = await base44.entities.CareerEntry.get(values.id).catch(() => null);
      if (!serverHas(saved, payload)) throw error;
      updated = saved;
    }
    setDraft(updated);
    // A slow list refresh must not report a save that already landed as a failure.
    await loadEntries().catch(() => {});
    return updated;
  };

  // Save the entry without confirming it, so it waits in the list to be finished later.
  const pauseDraft = async () => {
    if (!draft) return;
    setBusy(true);
    try {
      await persistDraft(draft, { status: 'draft' });
      setDraft(null);
      toast({ title: 'Saved for later', description: 'Find it in your master history and continue whenever you like.' });
    } catch (error) {
      reportError('That entry could not be saved', error);
    }
    setBusy(false);
  };

  // Read the original words again after more were added, and fold the new detail into the entry.
  const refreshFromWords = async () => {
    if (!draft) return;
    setBusy(true);
    try {
      const response = await base44.functions.invoke('parseCareerEntry', { raw_text: draft.raw_text || '' });
      const parsed = response.data || {};
      const patch = {
        entry_type: parsed.entry_type || draft.entry_type,
        title: parsed.title || draft.title,
        organization: parsed.organization || draft.organization,
        location: parsed.location || draft.location,
        start_date: parsed.start_date || draft.start_date,
        end_date: parsed.end_date || draft.end_date,
        summary: parsed.summary || draft.summary,
        accomplishments: mergedList(draft.accomplishments, parsed.accomplishments),
        skills: mergedList(draft.skills, parsed.skills),
        metrics: mergedList(draft.metrics, parsed.metrics),
        keywords: mergedList(draft.keywords, parsed.keywords)
      };
      const prompts = unansweredPrompts(parsed.suggestions, draft.answers);
      if (prompts.length) {
        patch.suggestions = prompts;
        patch.suggestion_index = 0;
      }
      await persistDraft(draft, patch);
      toast({ title: 'Entry updated from your words' });
    } catch (error) {
      reportError('Those words could not be added to the entry', error);
    }
    setBusy(false);
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
        const response = await retryOnTimeout(() => base44.functions.invoke('applySuggestionAnswer', {
          suggestion,
          comment: comment || '',
          entry: editableFields(draft)
        }));
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

  // Testing account only: once the entries are gone, this page goes back to a blank slate.
  const clearLocalHistory = async () => {
    setDraft(null);
    setSelectedIds([]);
    setDictation('');
    await save({
      history_complete: false,
      master_summary: '',
      core_skills: [],
      target_titles: [],
      experience_order: []
    });
    await loadEntries();
  };

  const addDetailToDraft = (item) => {
    if (!draft || !item?.text) return;
    const text = item.text.trim();
    setDraft((prev) => {
      if (!prev) return prev;
      const nextAccomplishments = mergedList(prev.accomplishments, [text]);
      const nextSkills =
        item.category === 'equipment' || item.category === 'certification'
          ? mergedList(prev.skills, [text])
          : prev.skills || [];
      const nextKeywords =
        text.split(/\s+/).length <= 6 ? mergedList(prev.keywords, [text]) : prev.keywords || [];
      return {
        ...prev,
        accomplishments: nextAccomplishments,
        skills: nextSkills,
        keywords: nextKeywords
      };
    });
    toast({ title: `Added “${text}” to ${draft.title || 'open entry'}` });
  };

  const createEntryFromTray = async ({ title, organization, start_date, items, confirmImmediately }) => {
    const texts = (items || []).map((i) => String(i.text || '').trim()).filter(Boolean);
    if (!texts.length) return;
    const skills = (items || [])
      .filter((i) => i.category === 'equipment' || i.category === 'certification')
      .map((i) => i.text);
    const keywords = texts.filter((t) => t.split(/\s+/).length <= 6);

    setBusy(true);
    try {
      const created = await base44.entities.CareerEntry.create({
        entry_type: 'work',
        title: title || 'Career Experience',
        organization: organization || '',
        location: '',
        start_date: start_date || '',
        end_date: '',
        summary: `${title || 'Hands-on experience'} covering ${texts.slice(0, 4).join(', ')}.`,
        raw_text: texts.join('\n'),
        accomplishments: texts,
        skills,
        metrics: [],
        keywords,
        suggestions: [],
        suggestion_index: 0,
        answers: [],
        status: confirmImmediately ? 'confirmed' : 'draft'
      });
      await loadEntries();
      if (!confirmImmediately) {
        setDraft(created);
        toast({ title: 'Opened in editor', description: 'Add any extra details or dates and save when ready.' });
      } else {
        toast({ title: 'Saved to your career history', description: `Added “${created.title}” with ${texts.length} details.` });
      }
    } catch (error) {
      reportError('Could not save those details', error);
    }
    setBusy(false);
  };

  const appendToExistingEntry = async (entryId, items) => {
    const target = entries.find((e) => e.id === entryId);
    if (!target) return;
    const texts = (items || []).map((i) => String(i.text || '').trim()).filter(Boolean);
    const newSkills = (items || [])
      .filter((i) => i.category === 'equipment' || i.category === 'certification')
      .map((i) => i.text);
    const newKeywords = texts.filter((t) => t.split(/\s+/).length <= 6);

    setBusy(true);
    try {
      const updated = await base44.entities.CareerEntry.update(target.id, {
        accomplishments: mergedList(target.accomplishments, texts),
        skills: mergedList(target.skills, newSkills),
        keywords: mergedList(target.keywords, newKeywords)
      });
      if (draft && draft.id === target.id) {
        setDraft(updated);
      }
      await loadEntries();
      toast({
        title: `Added ${texts.length} ${texts.length === 1 ? 'detail' : 'details'} to “${target.title}”`
      });
    } catch (error) {
      reportError('Could not add details to that entry', error);
    }
    setBusy(false);
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
        <div className="flex flex-wrap items-center gap-3">
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
          <ClearHistoryButton entries={entries.length} disabled={busy || loading} onCleared={clearLocalHistory} />
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

      {!loadingProfile && (
        <div className="mt-6">
          <KeywordDetailBuilder
            activeDraft={draft}
            entries={entries}
            busy={busy}
            onAddToDraft={addDetailToDraft}
            onCreateEntryFromTray={createEntryFromTray}
            onAppendToExistingEntry={appendToExistingEntry}
          />
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
            onPause={pauseDraft}
            onRefresh={refreshFromWords}
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
        {!loading && openDrafts.length > 0 && (
          <p className="mt-2 text-[13px] text-muted-foreground">
            {openDrafts.length === 1 ? 'One entry is still in progress' : `${openDrafts.length} entries are still in progress`}
            {' — open it and carry on where you left off.'}
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