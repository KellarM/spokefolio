import React, { useState } from 'react';
import { Check, Loader2, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function KeywordDropTray({
  activeDraft,
  entries = [],
  busy = false,
  targetMode,
  setTargetMode,
  selectedEntryId,
  setSelectedEntryId,
  entryTitle,
  setEntryTitle,
  organization,
  setOrganization,
  dates,
  setDates,
  droppedItems,
  onRemoveDropped,
  onAddCustomPoint,
  onDropItem,
  onSaveTray
}) {
  const [customPoint, setCustomPoint] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

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
      onDropItem(item);
    } catch {
      // Ignore invalid drag payload
    }
  };

  const submitCustom = (e) => {
    e.preventDefault();
    const text = customPoint.trim();
    if (!text) return;
    onAddCustomPoint(text);
    setCustomPoint('');
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex flex-col justify-between rounded-xl border-2 border-dashed p-4 transition-all ${
        isDragOver ? 'border-primary bg-primary/10 shadow-lg' : 'border-border/70 bg-background/40'
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
              Adding directly into: <span className="text-primary">{activeDraft.title || 'Untitled entry'}</span>
            </p>
            <p className="mt-1 text-[12px] text-muted-foreground">
              Every detail you drag or add via checkbox is placed straight into your open entry below.
            </p>
          </div>
        ) : targetMode === 'existing' && entries.length > 0 ? (
          <div className="mt-3 space-y-2">
            <label className="text-[11.5px] text-muted-foreground">Choose an entry to receive these details:</label>
            <select
              value={selectedEntryId}
              onChange={(e) => setSelectedEntryId(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-[13.5px] text-foreground"
            >
              {entries.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.title || 'Untitled'}
                  {entry.organization ? ` · ${entry.organization}` : ''}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Role or skill title</label>
              <Input
                value={entryTitle}
                onChange={(e) => setEntryTitle(e.target.value)}
                placeholder="Filled automatically from your search, or type your own"
                className="mt-1 h-9 text-[13.5px]"
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Employer (optional)</label>
              <Input
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="Company or workplace"
                className="mt-1 h-9 text-[13.5px]"
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Dates (optional)</label>
              <Input
                value={dates}
                onChange={(e) => setDates(e.target.value)}
                placeholder="e.g., 2021 – Present"
                className="mt-1 h-9 text-[13.5px]"
              />
            </div>
          </div>
        )}

        {targetMode !== 'active' && (
          <div className="mt-4">
            {droppedItems.length === 0 ? (
              <div className="flex min-h-[160px] flex-col items-center justify-center rounded-xl border border-dashed border-border/60 px-4 py-6 text-center">
                <p className="text-[13.5px] font-medium text-foreground/90">Drag details here or check items and click Add</p>
                <p className="mt-1 max-w-xs text-[12px] text-muted-foreground">
                  Selected and dropped details will collect here so you can save them to your career history.
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
                      onClick={() => onRemoveDropped(item.text)}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label={`Remove ${item.text}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <form onSubmit={submitCustom} className="mt-3 flex gap-2">
              <Input
                value={customPoint}
                onChange={(e) => setCustomPoint(e.target.value)}
                placeholder="Add your own custom detail…"
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
                onClick={() => onSaveTray(false)}
                className="rounded-full"
              >
                Open in editor
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              disabled={busy || droppedItems.length === 0}
              onClick={() => onSaveTray(true)}
              className="rounded-full"
            >
              {busy ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Check className="mr-1.5 h-3.5 w-3.5" />}
              {targetMode === 'existing' ? 'Add to entry' : 'Save to career history'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}