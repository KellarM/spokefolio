import React, { useEffect, useMemo, useState } from 'react';
import { GripVertical, Loader2, Plus, Search, Sparkles, Wand2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import DictateButton from '@/components/common/DictateButton';
import KeywordDropTray from '@/components/history/KeywordDropTray';
import { matchBuiltInDetails } from '@/lib/careerDetailLibrary';

const CATEGORY_LABELS = {
  certification: 'License / Cert',
  equipment: 'Equipment / Tool',
  duty: 'Operation / Duty',
  compliance: 'Log / Safety',
  accomplishment: 'Resume Bullet'
};

export default function KeywordDetailBuilder({
  activeDraft,
  entries = [],
  busy = false,
  onAddToDraft,
  onCreateEntryFromTray,
  onAppendToExistingEntry
}) {
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [generatedItems, setGeneratedItems] = useState([]);
  const [checkedIds, setCheckedIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchedQuery, setSearchedQuery] = useState('');

  // Target tray state
  const [targetMode, setTargetMode] = useState(activeDraft ? 'active' : 'new');
  const [selectedEntryId, setSelectedEntryId] = useState('');
  const [entryTitle, setEntryTitle] = useState('');
  const [organization, setOrganization] = useState('');
  const [dates, setDates] = useState('');
  const [droppedItems, setDroppedItems] = useState([]);

  useEffect(() => {
    if (activeDraft) {
      setTargetMode('active');
    }
  }, [activeDraft?.id]);

  const droppedSet = useMemo(() => {
    if (targetMode === 'active' && activeDraft) {
      const allDraftText = [
        ...(activeDraft.accomplishments || []),
        ...(activeDraft.skills || []),
        ...(activeDraft.keywords || [])
      ].map((t) => String(t).trim().toLowerCase());
      return new Set(allDraftText);
    }
    return new Set(droppedItems.map((i) => i.text.trim().toLowerCase()));
  }, [targetMode, activeDraft, droppedItems]);

  const handleGenerate = async (rawInput = query) => {
    const clean = String(rawInput || '').trim();
    if (!clean) return;

    setLoading(true);
    setSearchedQuery(clean);
    setCheckedIds([]);

    // Start with any instant built-in library matches for this term
    const builtIn = matchBuiltInDetails(clean);
    if (builtIn.items.length > 0) {
      setGeneratedItems(builtIn.items);
      if (!entryTitle.trim() && builtIn.matchedTitle) {
        setEntryTitle(builtIn.matchedTitle);
      }
    } else {
      setGeneratedItems([]);
    }

    try {
      const existingTexts = builtIn.items.map((i) => i.text);
      const response = await base44.functions.invoke('suggestKeywordDetails', {
        query: clean,
        existing: existingTexts
      });
      const data = response.data || {};
      const aiList = (data.items || []).map((item, idx) => ({
        id: `ai-${Date.now()}-${idx}`,
        text: item.text,
        category: item.category || 'duty'
      }));

      // Combine built-in and AI items without duplicates
      const seen = new Set();
      const merged = [];
      for (const item of [...builtIn.items, ...aiList]) {
        const key = String(item.text || '').trim().toLowerCase();
        if (!key || seen.has(key)) continue;
        seen.add(key);
        merged.push(item);
      }
      setGeneratedItems(merged);

      if (!entryTitle.trim()) {
        setEntryTitle(data.suggested_title || builtIn.matchedTitle || clean);
      }
    } catch (error) {
      if (!builtIn.items.length) {
        toast({
          title: 'Could not generate details',
          description: error?.response?.data?.error || error.message || 'Please try again.',
          variant: 'destructive'
        });
      }
    }
    setLoading(false);
  };

  const addSingleItem = (item) => {
    if (!item || !item.text) return;
    if (targetMode === 'active' && activeDraft && onAddToDraft) {
      onAddToDraft(item);
      return;
    }
    setDroppedItems((prev) => {
      if (prev.some((existing) => existing.text.toLowerCase() === item.text.toLowerCase())) {
        return prev;
      }
      return [...prev, item];
    });
  };

  const toggleCheck = (itemId) => {
    setCheckedIds((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  const selectableItems = useMemo(
    () => generatedItems.filter((item) => !droppedSet.has(item.text.trim().toLowerCase())),
    [generatedItems, droppedSet]
  );

  const toggleSelectAll = () => {
    if (checkedIds.length === selectableItems.length) {
      setCheckedIds([]);
    } else {
      setCheckedIds(selectableItems.map((i) => i.id));
    }
  };

  const handleAddChecked = () => {
    const selected = generatedItems.filter(
      (item) => checkedIds.includes(item.id) && !droppedSet.has(item.text.trim().toLowerCase())
    );
    if (!selected.length) return;

    if (targetMode === 'active' && activeDraft && onAddToDraft) {
      selected.forEach((item) => onAddToDraft(item));
      setCheckedIds([]);
      return;
    }

    setDroppedItems((prev) => {
      const next = [...prev];
      for (const item of selected) {
        if (!next.some((existing) => existing.text.toLowerCase() === item.text.toLowerCase())) {
          next.push(item);
        }
      }
      return next;
    });
    setCheckedIds([]);
  };

  const handleDragStart = (event, item) => {
    event.dataTransfer.setData('application/json', JSON.stringify(item));
    event.dataTransfer.effectAllowed = 'copy';
  };

  const handleSaveTray = async (asConfirmed = true) => {
    if (!droppedItems.length) {
      toast({ title: 'Drag or add at least one detail first' });
      return;
    }

    if (targetMode === 'existing' && selectedEntryId && onAppendToExistingEntry) {
      await onAppendToExistingEntry(selectedEntryId, droppedItems);
      setDroppedItems([]);
      return;
    }

    const titleToUse = entryTitle.trim() || searchedQuery || query.trim() || 'Career Experience';
    await onCreateEntryFromTray({
      title: titleToUse,
      organization: organization.trim(),
      start_date: dates.trim(),
      items: droppedItems,
      confirmImmediately: asConfirmed
    });
    setDroppedItems([]);
  };

  return (
    <div className="paper animate-rise rounded-2xl p-5 sm:p-6">
      <div>
        <span className="eyebrow flex items-center gap-2 text-primary">
          <Wand2 className="h-3.5 w-3.5" /> Keyword & Detail Builder
        </span>
        <h2 className="mt-2 font-heading text-[22px] leading-snug">
          Enter a word or description to generate career details
        </h2>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Type any equipment, job title, skill, or short description. Point-form details will appear so you can drag and drop them or tick the checkboxes and click Add.
        </p>
      </div>

      {/* Input + Generate button */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleGenerate(query);
        }}
        className="mt-5 flex flex-col gap-2.5 sm:flex-row"
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a word, tool, role, or short description…"
            className="h-10 pl-10 pr-12 text-[14.5px]"
          />
          <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
            <DictateButton
              label={null}
              onText={(spoken) => {
                setQuery(spoken);
                handleGenerate(spoken);
              }}
            />
          </div>
        </div>
        <Button
          type="submit"
          disabled={loading || !query.trim()}
          className="h-10 rounded-full px-5"
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          Generate details
        </Button>
      </form>

      {/* Split Generated Details (Left) and Drop Tray (Right) */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_1fr]">
        <div className="flex flex-col justify-between rounded-xl border border-border/60 bg-background/50 p-4">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="eyebrow">
                  {searchedQuery ? `Details for “${searchedQuery}”` : 'Generated point-form details'}
                </p>
                <p className="mt-0.5 text-[12px] text-muted-foreground">
                  Drag items into the tray, or tick the checkboxes and click Add selected.
                </p>
              </div>
              {selectableItems.length > 0 && (
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="text-[12px] text-primary hover:underline"
                >
                  {checkedIds.length === selectableItems.length ? 'Uncheck all' : 'Check all'}
                </button>
              )}
            </div>

            {loading && generatedItems.length === 0 ? (
              <div className="mt-4 flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-border/60 px-4 py-8 text-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="mt-2.5 text-[13.5px] text-muted-foreground">
                  Generating point-form details for “{searchedQuery}”…
                </p>
              </div>
            ) : generatedItems.length === 0 ? (
              <div className="mt-4 flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-border/60 px-4 py-8 text-center">
                <p className="text-[13.5px] text-muted-foreground">
                  Enter a word or description above and click <span className="text-foreground font-medium">Generate details</span> to see point-form items here.
                </p>
              </div>
            ) : (
              <ul className="mt-3.5 max-h-[380px] space-y-2 overflow-y-auto pr-1">
                {generatedItems.map((item) => {
                  const alreadyAdded = droppedSet.has(item.text.trim().toLowerCase());
                  const isChecked = checkedIds.includes(item.id);
                  return (
                    <li
                      key={item.id}
                      draggable={!alreadyAdded}
                      onDragStart={(e) => handleDragStart(e, item)}
                      onClick={() => !alreadyAdded && toggleCheck(item.id)}
                      className={`group flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-[13.5px] transition-all ${
                        alreadyAdded
                          ? 'border-primary/30 bg-primary/10 text-muted-foreground opacity-65'
                          : isChecked
                          ? 'cursor-grab border-primary bg-primary/15 text-foreground'
                          : 'cursor-grab border-border/50 bg-card/90 text-foreground hover:border-primary/60 active:cursor-grabbing'
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <Checkbox
                          checked={alreadyAdded || isChecked}
                          disabled={alreadyAdded}
                          onCheckedChange={() => !alreadyAdded && toggleCheck(item.id)}
                          onClick={(e) => e.stopPropagation()}
                          aria-label={`Select ${item.text}`}
                          className="shrink-0"
                        />
                        <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/60 group-hover:text-primary" />
                        <span className="leading-snug">• {item.text}</span>
                      </div>
                      <span className="hidden shrink-0 rounded-full bg-secondary/80 px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground sm:inline">
                        {alreadyAdded ? 'Added' : CATEGORY_LABELS[item.category] || 'Detail'}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {generatedItems.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border/50 pt-3.5">
              <span className="text-[12px] text-muted-foreground">
                {checkedIds.length} {checkedIds.length === 1 ? 'item' : 'items'} checked
              </span>
              <Button
                type="button"
                size="sm"
                disabled={checkedIds.length === 0}
                onClick={handleAddChecked}
                className="rounded-full"
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Add selected ({checkedIds.length})
              </Button>
            </div>
          )}
        </div>

        <KeywordDropTray
          activeDraft={activeDraft}
          entries={entries}
          busy={busy}
          targetMode={targetMode}
          setTargetMode={setTargetMode}
          selectedEntryId={selectedEntryId}
          setSelectedEntryId={setSelectedEntryId}
          entryTitle={entryTitle}
          setEntryTitle={setEntryTitle}
          organization={organization}
          setOrganization={setOrganization}
          dates={dates}
          setDates={setDates}
          droppedItems={droppedItems}
          onRemoveDropped={(text) => setDroppedItems((prev) => prev.filter((i) => i.text !== text))}
          onAddCustomPoint={(text) =>
            addSingleItem({ id: `custom-${Date.now()}`, text, category: 'duty' })
          }
          onDropItem={addSingleItem}
          onSaveTray={handleSaveTray}
        />
      </div>
    </div>
  );
}