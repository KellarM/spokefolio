import React, { useState } from 'react';
import { AlertCircle, Loader2, Search, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import useProfile from '@/hooks/useProfile';

const MODES = [
  { value: 'criteria', label: 'Search by category', icon: Search },
  { value: 'profile', label: 'Jobs that fit me', icon: Sparkles }
];

// Finds postings on the job sites: either by category and location, or from the person's own history.
export default function JobSearchPanel({ onResults }) {
  const { profile, loadingProfile } = useProfile();
  const [mode, setMode] = useState('criteria');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const place = location || profile.location || '';
  const ready = mode === 'profile' ? !loadingProfile : category.trim().length > 1;

  const run = async () => {
    setBusy(true);
    setError('');
    try {
      const payload = { mode, category: category.trim(), location: place.trim() };

      if (mode === 'profile') {
        const records = await base44.entities.CareerEntry.list('-created_date', 50);
        payload.profile = profile;
        payload.entries = (records || [])
          .filter((entry) => entry.title && entry.title.trim())
          .slice(0, 10)
          .map((entry) => ({
            title: entry.title,
            organization: entry.organization || '',
            entry_type: entry.entry_type || 'work',
            skills: (entry.skills || []).slice(0, 8),
            accomplishments: (entry.accomplishments || []).slice(0, 3)
          }));
      }

      const response = await base44.functions.invoke('searchJobPostings', payload);
      const data = response.data || {};
      onResults({
        mode,
        category: category.trim(),
        location: place.trim(),
        results: data.results || [],
        note: data.note || ''
      });
    } catch (e) {
      setError(e?.response?.data?.error || e.message);
    }
    setBusy(false);
  };

  return (
    <section className="rounded-2xl border border-dashed border-border px-4 py-4 sm:px-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow">Find postings</p>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
            {mode === 'criteria'
              ? 'Search the job sites by category and location.'
              : 'Your career history, experience and location are read to find the roles that fit you.'}
          </p>
        </div>
        <div className="flex gap-1.5">
          {MODES.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => {
                  setMode(item.value);
                  setError('');
                }}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] transition-colors ${
                  mode === item.value
                    ? 'border-primary/30 bg-primary/10 font-medium text-primary'
                    : 'border-border/70 text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-3.5 w-3.5" /> {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-[1.4fr_1fr_auto]">
        {mode === 'criteria' ? (
          <Input
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            placeholder="Category — e.g. operations manager, welder, bookkeeper"
          />
        ) : (
          <div className="flex items-center rounded-md border border-border/70 bg-secondary/40 px-3 py-2 text-[12.5px] text-muted-foreground">
            {loadingProfile ? 'Reading your history…' : 'Reads your saved history and profile'}
          </div>
        )}
        <Input
          value={place}
          onChange={(event) => setLocation(event.target.value)}
          placeholder="City, region or Remote"
        />
        <Button onClick={run} disabled={busy || !ready} className="rounded-full">
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
          {busy ? 'Searching' : 'Search jobs'}
        </Button>
      </div>

      {error && (
        <p className="mt-3 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-destructive">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {error}
        </p>
      )}
    </section>
  );
}