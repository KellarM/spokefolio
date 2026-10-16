import React, { useEffect, useMemo, useState } from 'react';
import {
  Check,
  GripVertical,
  Loader2,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Wand2
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import DictateButton from '@/components/common/DictateButton';
import { matchBuiltInDetails, QUICK_TOPICS } from '@/lib/careerDetailLibrary';

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
  const [query, setQuery] = useState('Fork Truck');
  const [aiItems, setAiItems] = useState([]);
  const [aiSuggestedTitle, setAiSuggestedTitle] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);

  // Target tray state
  const [targetMode, setTargetMode] = useState(activeDraft ? 'active' : 'new');
  const [selectedEntryId, setSelectedEntryId] = useState('');
  const [entryTitle, setEntryTitle] = useState('Fork Truck & Material Handling Operator');
  const [organization, setOrganization] = useState('');
  const [dates, setDates] = useState('');
  const [droppedItems, setDroppedItems] = useState([]);
  const [customPoint, setCustomPoint] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    if (activeDraft) {
      setTargetMode('active');
    }
  }, [activeDraft?.id]);

  const builtInMatch = useMemo(() => matchBuiltInDetails(query), [query]);

  useEffect(() => {
    if (builtInMatch.matchedTitle && (!entryTitle || entryTitle === 'Fork Truck & Material Handling Operator')) {
      setEntryTitle(builtInMatch.matchedTitle);
    }
  }, [builtInMatch.matchedTitle]);

  const combinedItems = useMemo(() => {
    const seen = new Set();
    const list = [];
    for (const item of [...builtInMatch.items, ...aiItems]) {
      const key = item.text.trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      list.push(item);
    }
    return list;
  }, [builtInMatch.items, aiItems]);

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

  const generateAiDetails = async (searchWord = query) => {
    const clean = String(searchWord || '').trim();
    if (!clean) return;
    setLoadingAi(true);
    try {
      const existing = combinedItems.map((i) => i.text);
      const response = await base44.functions.invoke('suggestKeywordDetails', {
        query: clean,
        existing
      });
      const data = response.data || {};
      const newItems = (data.items || []).map((item, idx) => ({
        id: `ai-${Date.now()}-${idx}`,
        text: item.text,
        category: item.category || 'duty',
        source: 'ai'
      }));
      setAiItems((prev) => [...prev, ...newItems]);
      if (data.suggested_title) {
        setAiSuggestedTitle(data.suggested_title);
        if (!entryTitle.trim()) setEntryTitle(data.suggested_title);
      }
    } catch (error) {
      toast({
        title: 'Could not generate extra details',
        description: error?.response?.data?.error || error.message || 'Try again in a moment.',
        variant: 'destructive'
      });
    }
    setLoadingAi(false);
  };

  const handleSelectTopic = (topicQuery) => {
    setQuery(topicQuery);
    setAiItems([]);
    const match = matchBuiltInDetails(topicQuery);
    if (match.matchedTitle) {
      setEntryTitle(match.matchedTitle);
    } else {
      setEntryTitle(topicQuery);
    }
  };

  const addItemToTarget = (item) => {
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

  const handleDragStart = (event, item) => {
    event.dataTransfer.setData('application/json', JSON.stringify(item));
    event.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragOver(false);
    try {
      const raw = event.dataTransfer.getData('application/json');
      if (!raw) return;
      const item = JSON.parse(raw);
      addItemToTarget(item);
    } catch {
      // Ignore invalid drag payload
    }
  };

  const handleAddCustomPoint = (e) => {
    e.preventDefault();
    const text = customPoint.trim();
    if (!text) return;
    addItemToTarget({
      id: `custom-${Date.now()}`,
      text,
      category: 'duty',
      source: 'custom'
    });
    setCustomPoint('');
  };

  const removeDroppedItem = (text) => {
    setDroppedItems((prev) => prev.filter((item) => item.text !== text));
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

    const titleToUse = entryTitle.trim() || aiSuggestedTitle || builtInMatch.matchedTitle || query.trim() || 'Career Experience';
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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="eyebrow flex items-center gap-2 text-primary">
            <Wand2 className="h-3.5 w-3.5" /> Keyword & Drag-and-Drop Builder
          </span>
          <h2 className="mt-2 font-heading text-[22px] leading-snug">
            Type a word or skill, then drag details into your history
          </h2>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Enter equipment, a job title, or a short description (for example, “Fork Truck”) to see point-form certifications, tools, and duties you can drag and drop.
          </p>
        </div>
      </div>

      {/* Search bar + AI generator trigger */}
      <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setAiItems([]);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                generateAiDetails(query);
              }
            }}
            placeholder="e.g., Fork Truck, Clamp Truck, Warehouse Supervisor, Inventory Control…"
            className="h-10 pl-10 pr-24 text-[14.5px]"
          />
          <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
            <DictateButton
              label={null}
              onText={(spoken) => {
                setQuery(spoken);
                setAiItems([]);
              }}
            />
          </div>
        </div>
        <Button
          type="button"
          onClick={() => generateAiDetails(query)}
          disabled={loadingAi || !query.trim()}
          className="h-10 rounded-full px-5"
        >
          {loadingAi ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          {builtInMatch.items.length ? 'Generate more with AI' : 'Generate details with AI'}
        </Button>
      </div>

      {/* Quick topic chips */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-[11.5px] text-muted-foreground">Quick topics:</span>
        {QUICK_TOPICS.map((topic) => {
          const active = query.trim().toLowerCase() === topic.query.toLowerCase();
          return (
            <button
              key={topic.id}
              type="button"
              onClick={() => handleSelectTopic(topic.query)}
              className={`rounded-full border px-3 py-1 text-[12px] transition-colors ${
                active
                  ? 'border-primary bg-primary/15 text-primary font-medium'
                  : 'border-border/60 bg-background/40 text-muted-foreground hover:border-primary/50 hover:text-foreground'
              }`}
            >
              {topic.label}
            </button>
          );
        })}
      </div>

      {/* Split Drag Source (Left) and Drop Target (Right) */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_1fr]">
        {/* Left: Draggable point-form listings */}
        <div className="rounded-xl border border-border/60 bg-background/50 p-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="eyebrow">
                Point-form details {query.trim() ? `for “${query.trim()}”` : ''}
              </p>
              <p className="mt-0.5 text-[12px] text-muted-foreground">
                Drag any point into the tray on the right, or click + to add it.
              </p>
            </div>
            {combinedItems.length > 0 && (
              <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] text-muted-foreground">
                {combinedItems.length} points
              </span>
            )}
          </div>

          {combinedItems.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-border/60 px-4 py-8 text-center">
              <p className="text-[13.5px] text-muted-foreground">
                {query.trim()
                  ? `No built-in presets for “${query.trim()}” yet — click “Generate details with AI” above to create point-form listings.`
                  : 'Type a word like “Fork Truck” or pick a quick topic above to see point-form details.'}
              </p>
              {query.trim() && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => generateAiDetails(query)}
                  disabled={loadingAi}
                  className="mt-3 rounded-full"
                >
                  {loadingAi ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-2 h-3.5 w-3.5" />}
                  Generate points for “{query.trim()}”
                </Button>
              )}
            </div>
          ) : (
            <ul className="mt-3.5 max-h-[420px] space-y-2 overflow-y-auto pr-1">
              {combinedItems.map((item) => {
                const alreadyAdded = droppedSet.has(item.text.trim().toLowerCase());
                return (
                  <li
                    key={item.id}
                    draggable={!alreadyAdded}
                    onDragStart={(e) => handleDragStart(e, item)}
                    onClick={() => !alreadyAdded && addItemToTarget(item)}
                    className={`group flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-[13.5px] transition-all ${
                      alreadyAdded
                        ? 'border-primary/30 bg-primary/10 text-muted-foreground opacity-75'
                        : 'cursor-grab border-border/50 bg-card/90 text-foreground hover:border-primary/60 hover:shadow-sm active:cursor-grabbing'
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/60 group-hover:text-primary" />
                      <span className=" leading-snug">• {item.text}</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="hidden rounded-full bg-secondary/80 px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground sm:inline">
                        {CATEGORY_LABELS[item.category] || 'Detail'}
                      </span>
                      {item.source === 'ai' && (
                        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] uppercase tracking-wider text-primary">
                          AI
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!alreadyAdded) addItemToTarget(item);
                        }}
                        disabled={alreadyAdded}
                        aria-label={`Add ${item.text}`}
                        className={`flex h-6 w-6 items-center justify-center rounded-full border transition-colors ${
                          alreadyAdded
                            ? 'border-primary/40 bg-primary text-primary-foreground'
                            : 'border-border/70 text-muted-foreground hover:border-primary hover:bg-primary hover:text-primary-foreground'
                        }`}
                      >
                        {alreadyAdded ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Right: Drop Zone & Career Entry Builder */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex flex-col justify-between rounded-xl border-2 border-dashed p-4 transition-all ${
            isDragOver
              ? 'border-primary bg-primary/10 shadow-lg'
              : 'border-border/70 bg-background/40'
          }`}
        >
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="eyebrow text-primary">Drop Zone · Career Entry Tray</p>
              <div className="flex items-center gap-1 rounded-full bg-secondary/70 p-0.5 text-[11px]">
                {activeDraft && (
                  <button
                    type="button"
                    onClick={() => setTargetMode('active')}
                    className={`rounded-full px-2.5 py-1 transition-colors ${
                      targetMode === 'active'
                        ? 'bg-primary text-primary-foreground font-medium'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Open draft
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setTargetMode('new')}
                  className={`rounded-full px-2.5 py-1 transition-colors ${
                    targetMode === 'new'
                      ? 'bg-primary text-primary-foreground font-medium'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  New entry
                </button>
                {entries.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setTargetMode('existing');
                      if (!selectedEntryId && entries[0]) setSelectedEntryId(entries[0].id);
                    }}
                    className={`rounded-full px-2.5 py-1 transition-colors ${
                      targetMode === 'existing'
                        ? 'bg-primary text-primary-foreground font-medium'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Existing entry
                  </button>
                )}
              </div>
            </div>

            {targetMode === 'active' && activeDraft ? (
              <div className="mt-3 rounded-xl border border-primary/30 bg-primary/5 p-3.5">
                <p className="text-[13px] font-medium text-foreground">
                  Dropping directly into: <span className="text-primary">{activeDraft.title || 'Untitled entry'}</span>
                </p>
                <p className="mt-1 text-[12px] text-muted-foreground">
                  Every point you drag or click is immediately added to the open entry below (skills, certifications, and accomplishments).
                </p>
              </div>
            ) : targetMode === 'existing' && entries.length > 0 ? (
              <div className="mt-3 space-y-2">
                <label className="text-[11.5px] text-muted-foreground">Choose an entry to add these points to:</label>
                <select
                  value={selectedEntryId}
                  onChange={(e) => setSelectedEntryId(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-[13.5px] text-foreground"
                >
                  {entries.map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {entry.title || 'Untitled'}{entry.organization ? ` · ${entry.organization}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Role or skill title
                  </label>
                  <Input
                    value={entryTitle}
                    onChange={(e) => setEntryTitle(e.target.value)}
                    placeholder="e.g., Forklift & Material Handling Operator"
                    className="mt-1 h-9 text-[13.5px]"
                  />
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Employer (optional)
                  </label>
                  <Input
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="e.g., Five Corners Meat"
                    className="mt-1 h-9 text-[13.5px]"
                  />
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Dates (optional)
                  </label>
                  <Input
                    value={dates}
                    onChange={(e) => setDates(e.target.value)}
                    placeholder="e.g., 2021 – Present"
                    className="mt-1 h-9 text-[13.5px]"
                  />
                </div>
              </div>
            )}

            {/* Dropped items list when building a new or existing batch */}
            {targetMode !== 'active' && (
              <div className="mt-4">
                {droppedItems.length === 0 ? (
                  <div className="flex min-h-[160px] flex-col items-center justify-center rounded-xl border border-dashed border-border/60 px-4 py-6 text-center">
                    <p className="text-[13.5px] font-medium text-foreground/90">
                      Drag point-form details here
                    </p>
                    <p className="mt-1 max-w-xs text-[12px] text-muted-foreground">
                      Drop items from the left list (like Certification License, Clamp Truck, Unloading / Loading) to build your entry.
                    </p>
                  </div>
                ) : (
                  <ul className="max-h-[230px] space-y-1.5 overflow-y-auto pr-1">
                    {droppedItems.map((item) => (
                      <li
                        key={item.text}
                        className="flex items-center justify-between gap-2 rounded-lg border border-primary/30 bg-card px-3 py-2 text-[13px]"
                      >
                        <span className="leading-snug">• {item.text}</span>
                        <button
                          type="button"
                          onClick={() => removeDroppedItem(item.text)}
                          className="text-muted-foreground hover:text-destructive"
                          aria-label={`Remove ${item.text}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Add custom point inline */}
                <form onSubmit={handleAddCustomPoint} className="mt-3 flex gap-2">
                  <Input
                    value={customPoint}
                    onChange={(e) => setCustomPoint(e.target.value)}
                    placeholder="Add your own point (e.g., Propane Tank Exchange)…"
                    className="h-8 text-[12.5px]"
                  />
                  <Button type="submit" variant="secondary" size="sm" className="h-8 rounded-full px-3 text-xs">
                    <Plus className="mr-1 h-3 w-3" /> Add
                  </Button>
                </form>
              </div>
            )}
          </div>

          {targetMode !== 'active' && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border/50 pt-3.5">
              <span className="text-[12px] text-muted-foreground">
                {droppedItems.length} {droppedItems.length === 1 ? 'detail' : 'details'} in tray
              </span>
              <div className="flex flex-wrap gap-2">
                {targetMode === 'new' && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={busy || droppedItems.length === 0}
                    onClick={() => handleSaveTray(false)}
                    className="rounded-full"
                  >
                    Open in editor
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  disabled={busy || droppedItems.length === 0}
                  onClick={() => handleSaveTray(true)}
                  className="rounded-full"
                >
                  {busy ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Check className="mr-1.5 h-3.5 w-3.5" />}
                  {targetMode === 'existing' ? 'Add to entry' : 'Save to career history'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}