import React, { useState } from 'react';
import { AlertCircle, Loader2, Search, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import LocationInput from '@/components/home/LocationInput';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import JobSearchFilters, { pillClass } from '@/components/postings/JobSearchFilters';
import { useStudioLanguage } from '@/lib/StudioLanguage';
import useProfile from '@/hooks/useProfile';


// Finds postings on the job sites: by category and location, or from the person's own history.
export default function JobSearchPanel({ onResults, initial }) {
  const { t } = useStudioLanguage();
  const { profile, loadingProfile } = useProfile();
  const MODES = [
    { value: 'criteria', label: t('postings.modeCriteria'), icon: Search },
    { value: 'profile', label: t('postings.modeProfile'), icon: Sparkles }
  ];
  const [mode, setMode] = useState(initial?.mode === 'profile' ? 'profile' : 'criteria');
  const [category, setCategory] = useState(String(initial?.category || ''));
  const [location, setLocation] = useState(initial?.location ?? null);
  const [distance, setDistance] = useState(Number(initial?.distance) || 0);
  const [pay, setPay] = useState(initial?.minPay ? String(initial.minPay) : '');
  const [period, setPeriod] = useState(initial?.payPeriod || 'year');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // null = the person has not set one: show the home location from the profile.
  // '' = the person cleared the field: the clear must stick, so no fallback.
  const place = location ?? profile.location ?? '';
  const ready = mode === 'profile' ? !loadingProfile : category.trim().length > 1;

  const run = async () => {
    setBusy(true);
    setError('');
    try {
      const minPay = pay ? Number(pay) : 0;
      const payload = {
        mode,
        // The person's language rides along so postings come back in it.
        language: (profile.preferred_language || '').trim(),
        category: category.trim(),
        location: place.trim(),
        homeLocation: (profile.location_full || profile.location || place || '').trim(),
        distanceKm: distance,
        minPay,
        payPeriod: period
      };

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
        titles: data.titles || [],
        distance,
        minPay,
        payPeriod: period,
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
          <p className="eyebrow">{t('postings.findPostings')}</p>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
            {mode === 'criteria' ? t('postings.criteriaDesc') : t('postings.profileDesc')}
          </p>
          <p className="mt-1.5 text-[11px] text-muted-foreground/80">
            {t('postings.coverage')}
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
                className={pillClass(mode === item.value)}
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
            placeholder={t('postings.categoryPlaceholder')}
          />
        ) : (
          <div className="flex items-center rounded-md border border-border/70 bg-secondary/40 px-3 py-2 text-[12.5px] text-muted-foreground">
            {loadingProfile ? t('postings.readingHistory') : t('postings.readsSavedHistory')}
          </div>
        )}
        <LocationInput
          value={place}
          onChange={setLocation}
          placeholder={t('postings.placePlaceholder')}
          className="sf-field flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
        />
        <Button onClick={run} disabled={busy || !ready} className="rounded-full">
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
          {busy ? t('postings.searching') : t('postings.searchJobs')}
        </Button>
      </div>

      <div className="mt-4">
        <JobSearchFilters
          distance={distance}
          onDistance={setDistance}
          pay={pay}
          onPay={setPay}
          period={period}
          onPeriod={setPeriod}
          disabled={busy}
        />
      </div>

      {error && (
        <p className="mt-3 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-destructive">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {error}
        </p>
      )}
    </section>
  );
}