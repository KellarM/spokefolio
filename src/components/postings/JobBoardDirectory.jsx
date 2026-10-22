import React, { useCallback, useEffect, useState } from 'react';
import { ExternalLink, Loader2, Plus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { pillClass } from '@/components/postings/JobSearchFilters';
import { useStudioLanguage } from '@/lib/StudioLanguage';
import useProfile from '@/hooks/useProfile';

// The starter directory: boards that cover Canada and Alberta. Each account
// gets its own copy on first visit, so a person can add their own without
// touching anyone else's list.
const STARTER_BOARDS = [
  { name: 'Job Bank — Guichet-Emplois', url: 'https://www.jobbank.gc.ca/jobsearch', kind: 'government', coverage: 'Canada', notes: 'The federal job board. A direct source for searches here.' },
  { name: 'Indeed Canada', url: 'https://ca.indeed.com/', kind: 'national', coverage: 'Canada', notes: 'The largest aggregator of Canadian postings.' },
  { name: 'LinkedIn Jobs', url: 'https://www.linkedin.com/jobs/', kind: 'national', coverage: 'Canada', notes: 'Strong for professional and management roles.' },
  { name: 'Glassdoor Canada', url: 'https://www.glassdoor.ca/Job/', kind: 'national', coverage: 'Canada', notes: 'Postings plus salary and employer reviews.' },
  { name: 'ZipRecruiter Canada', url: 'https://www.ziprecruiter.ca/', kind: 'national', coverage: 'Canada', notes: 'Broad aggregator, popular with trades and services.' },
  { name: 'Talent.com', url: 'https://ca.talent.com/', kind: 'national', coverage: 'Canada', notes: 'Aggregates postings from many employer sites.' },
  { name: 'Eluta.ca', url: 'https://www.eluta.ca/', kind: 'national', coverage: 'Canada', notes: 'Searches employer career pages directly.' },
  { name: 'WOWjobs', url: 'https://wowjobs.ca/', kind: 'national', coverage: 'Canada', notes: 'Canadian aggregator, strong on hourly and trades work.' },
  { name: 'Jobillico', url: 'https://www.jobillico.com/', kind: 'regional', coverage: 'Alberta · Canada', notes: 'Regional board with Alberta coverage.' },
  { name: 'Alberta government careers', url: 'https://www.alberta.ca/jobs', kind: 'government', coverage: 'Alberta', notes: 'Alberta Public Service and agency postings.' },
  { name: 'City of Edmonton careers', url: 'https://www.edmonton.ca/city_government/jobs', kind: 'government', coverage: 'Edmonton', notes: 'City of Edmonton positions.' },
  { name: 'Government of Canada jobs', url: 'https://jobs-emplois.gc.ca/', kind: 'government', coverage: 'Canada', notes: 'Federal public service postings.' }
];

// Friendly names for the domains that show up in results.
const DOMAIN_LABELS = {
  'jobbank.gc.ca': 'Job Bank',
  'ca.indeed.com': 'Indeed',
  'indeed.com': 'Indeed',
  'linkedin.com': 'LinkedIn',
  'glassdoor.ca': 'Glassdoor',
  'glassdoor.com': 'Glassdoor',
  'ziprecruiter.ca': 'ZipRecruiter',
  'ziprecruiter.com': 'ZipRecruiter',
  'talent.com': 'Talent.com',
  'ca.talent.com': 'Talent.com',
  'eluta.ca': 'Eluta.ca',
  'wowjobs.ca': 'WOWjobs',
  'jobillico.com': 'Jobillico'
};

const hostOf = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return '';
  }
};

const labelFor = (url) => {
  const host = hostOf(url);
  return DOMAIN_LABELS[host] || host || '—';
};

const KIND_KEYS = {
  national: 'sources.kindNational',
  regional: 'sources.kindRegional',
  government: 'sources.kindGovernment',
  specialty: 'sources.kindSpecialty',
  user: 'sources.kindUser'
};

const countsBySource = (items) => {
  const counts = new Map();
  items.forEach((item) => {
    if (!item.source_url) return;
    const host = hostOf(item.source_url);
    if (!host) return;
    counts.set(host, (counts.get(host) || 0) + 1);
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
};

// The Sources tab: where postings come from, the boards that cover the
// searched area, and a way to add a board the list is missing.
export default function JobBoardDirectory({ postings, search }) {
  const { t } = useStudioLanguage();
  const { toast } = useToast();
  const { profile } = useProfile();
  const [boards, setBoards] = useState([]);
  const [seeding, setSeeding] = useState(true);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [coverage, setCoverage] = useState('');
  const [adding, setAdding] = useState(false);

  const loadBoards = useCallback(async () => {
    const records = await base44.entities.JobBoard.list('-created_date', 100);
    return records || [];
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let records = await loadBoards();
        if (!records.length) {
          // First visit: this account gets its own copy of the starter list.
          await Promise.all(STARTER_BOARDS.map((board) => base44.entities.JobBoard.create(board)));
          records = await loadBoards();
        }
        if (!cancelled) setBoards(records);
      } catch {
        // the list loads again on the next visit
      }
      if (!cancelled) setSeeding(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [loadBoards]);

  const place = profile?.location?.trim();

  const keptCounts = countsBySource(postings);
  const keptTotal = keptCounts.reduce((sum, [, count]) => sum + count, 0);
  const searchResults = search?.results || [];
  const searchCounts = countsBySource(searchResults);

  const addBoard = async () => {
    const cleanName = name.trim();
    const cleanUrl = url.trim();
    if (!cleanName || !/^https?:\/\/.+\..+/.test(cleanUrl)) return;
    setAdding(true);
    try {
      const created = await base44.entities.JobBoard.create({
        name: cleanName,
        url: cleanUrl,
        kind: 'user',
        coverage: coverage.trim() || place || '',
        notes: ''
      });
      setBoards((prev) => [created, ...prev]);
      setName('');
      setUrl('');
      setCoverage('');
      toast({ title: t('sources.toastAdded'), description: t('sources.toastAddedDesc') });
    } catch (error) {
      toast({
        title: t('sources.toastFailed'),
        description: error?.response?.data?.error || error.message,
        variant: 'destructive'
      });
    }
    setAdding(false);
  };

  const SourceRow = ({ label, count, total, tone }) => (
    <div className="flex items-center gap-3">
      <span className="w-32 shrink-0 truncate text-[13px] text-muted-foreground" title={label}>
        {label}
      </span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-border/60">
        <div
          className={`h-full rounded-full ${tone || 'bg-primary/70'}`}
          style={{ width: `${total ? Math.round((count / total) * 100) : 0}%` }}
        />
      </div>
      <span className="w-6 text-right text-[13px] tabular-nums text-foreground">{count}</span>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="mec-panel">
        <h3 className="mec-h3-top">{t('sources.rollupTitle')}</h3>
        <p className="mec-lede">{t('sources.rollupLede')}</p>
        {seeding ? (
          <p className="mt-4 flex items-center gap-2 text-[13px] text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> {t('common.loading')}
          </p>
        ) : keptTotal === 0 ? (
          <p className="mt-4 text-[13.5px] leading-relaxed text-muted-foreground">
            {t('sources.rollupEmpty')}
          </p>
        ) : (
          <div className="mt-4 space-y-2.5">
            {keptCounts.map(([host, count]) => (
              <SourceRow key={host} label={labelFor(`https://${host}`)} count={count} total={keptTotal} />
            ))}
          </div>
        )}
        {searchCounts.length > 0 && (
          <div className="mt-6 border-t border-border/70 pt-4">
            <p className="mb-3 text-[12px] uppercase tracking-[0.14em] text-muted-foreground">
              {t('sources.rollupSearch')}
            </p>
            <div className="flex flex-wrap gap-2">
              {searchCounts.map(([host, count]) => (
                <span key={host} className={pillClass(false)}>
                  {labelFor(`https://${host}`)} · {count}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mec-panel">
        <h3 className="mec-h3-top">{place ? t('sources.directoryFor', { place }) : t('sources.directoryTitle')}</h3>
        <p className="mec-lede">{t('sources.directoryLede')}</p>
        {seeding ? (
          <p className="mt-4 flex items-center gap-2 text-[13px] text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> {t('sources.seeding')}
          </p>
        ) : (
          <div className="mt-4 divide-y divide-border/70">
            {boards.map((board) => (
              <div key={board.id} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-[14px] font-medium text-foreground">{board.name}</span>
                    <span className={pillClass(false)}>{t(KIND_KEYS[board.kind] || KIND_KEYS.user)}</span>
                    {board.coverage && (
                      <span className="text-[12px] text-muted-foreground">{board.coverage}</span>
                    )}
                  </div>
                  {board.notes && (
                    <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{board.notes}</p>
                  )}
                </div>
                <a
                  href={board.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-border/70 px-3 py-1.5 text-[12.5px] text-muted-foreground transition-colors hover:text-foreground"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  {t('sources.open')}
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mec-panel">
        <h3 className="mec-h3-top">{t('sources.addTitle')}</h3>
        <p className="mec-lede">{t('sources.addLede')}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div>
            <label htmlFor="board-name" className="mb-1.5 block text-[12.5px] text-muted-foreground">
              {t('sources.nameLabel')}
            </label>
            <Input
              id="board-name"
              value={name}
              placeholder={t('sources.namePlaceholder')}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div>
            <label htmlFor="board-url" className="mb-1.5 block text-[12.5px] text-muted-foreground">
              {t('sources.urlLabel')}
            </label>
            <Input
              id="board-url"
              value={url}
              placeholder="https://"
              onChange={(event) => setUrl(event.target.value)}
            />
          </div>
          <div>
            <label htmlFor="board-coverage" className="mb-1.5 block text-[12.5px] text-muted-foreground">
              {t('sources.coverageLabel')}
            </label>
            <Input
              id="board-coverage"
              value={coverage}
              placeholder={place || t('sources.coveragePlaceholder')}
              onChange={(event) => setCoverage(event.target.value)}
            />
          </div>
        </div>
        <Button onClick={addBoard} disabled={adding || !name.trim() || !url.trim()} className="mt-4">
          {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          {t('sources.addBtn')}
        </Button>
      </div>
    </div>
  );
}
