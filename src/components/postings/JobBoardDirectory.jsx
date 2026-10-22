import React, { useCallback, useEffect, useState } from 'react';
import { detectCountry } from '@/lib/geo';
import { ExternalLink, Globe, Hand, Loader2, Plus, Search } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { pillClass } from '@/components/postings/JobSearchFilters';
import { useStudioLanguage } from '@/lib/StudioLanguage';
import useProfile from '@/hooks/useProfile';

// The starter directory, region-aware: an account seeds the set that covers
// where the profile says the person lives. Canada keeps the original twelve;
// a United States profile gets the US twelve instead.
// gets its own copy on first visit, so a person can add their own without
// touching anyone else's list.
const STARTER_BOARDS_CA = [
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

const STARTER_BOARDS_US = [
  { name: 'USAJOBS', url: 'https://www.usajobs.gov/', kind: 'government', coverage: 'United States', notes: 'Federal government postings.' },
  { name: 'CareerOneStop', url: 'https://www.careeronestop.org/', kind: 'government', coverage: 'United States', notes: 'The US Department of Labor job search.' },
  { name: 'Indeed', url: 'https://www.indeed.com/', kind: 'national', coverage: 'United States', notes: 'The largest aggregator of US postings.' },
  { name: 'LinkedIn Jobs', url: 'https://www.linkedin.com/jobs/', kind: 'national', coverage: 'United States', notes: 'Strong for professional and management roles.' },
  { name: 'Glassdoor', url: 'https://www.glassdoor.com/Job/', kind: 'national', coverage: 'United States', notes: 'Postings plus salary and employer reviews.' },
  { name: 'ZipRecruiter', url: 'https://www.ziprecruiter.com/', kind: 'national', coverage: 'United States', notes: 'Broad aggregator, popular with trades and services.' },
  { name: 'Monster', url: 'https://www.monster.com/', kind: 'national', coverage: 'United States', notes: 'Long-standing US job board.' },
  { name: 'CareerBuilder', url: 'https://www.careerbuilder.com/', kind: 'national', coverage: 'United States', notes: 'Large general-purpose board.' },
  { name: 'Talent.com', url: 'https://www.talent.com/', kind: 'national', coverage: 'United States', notes: 'Aggregates postings from many employer sites.' },
  { name: 'Snagajob', url: 'https://www.snagajob.com/', kind: 'national', coverage: 'United States', notes: 'Strong on hourly and shift work.' },
  { name: 'EmployNV', url: 'https://www.employnv.com/', kind: 'government', coverage: 'Nevada · United States', notes: "Nevada's state job connection system." },
  { name: 'Casino Careers', url: 'https://www.casinocareers.com/', kind: 'regional', coverage: 'Nevada · United States', notes: 'Dedicated to gaming and casino industry roles.' }
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
  'jobillico.com': 'Jobillico',
  'usajobs.gov': 'USAJOBS',
  'careeronestop.org': 'CareerOneStop',
  'monster.com': 'Monster',
  'careerbuilder.com': 'CareerBuilder',
  'snagajob.com': 'Snagajob',
  'employnv.gov': 'EmployNV',
  'casinocareers.com': 'Casino Careers'
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

// What the app actually searches. Job Bank is called directly by API; the
// web-search pass surfaces the web tier organically; everything else the
// person opens and imports from by hand. Derived from the URL, so
// user-added boards label themselves correctly too.
const DIRECT_HOSTS = ['jobbank.gc.ca'];
const WEB_HOSTS = ['ca.indeed.com', 'indeed.com', 'linkedin.com', 'glassdoor.ca', 'glassdoor.com', 'ziprecruiter.com', 'ziprecruiter.ca'];

const tierOf = (url) => {
  const host = hostOf(url);
  if (DIRECT_HOSTS.some((h) => host === h || host.endsWith('.' + h))) return 'direct';
  if (WEB_HOSTS.some((h) => host === h || host.endsWith('.' + h))) return 'web';
  return 'manual';
};

const TIER_ORDER = { direct: 0, web: 1, manual: 2 };

const TIER_KEYS = {
  direct: 'sources.statusDirect',
  web: 'sources.statusWeb',
  manual: 'sources.statusManual'
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
        const country = detectCountry(profile?.location);
        const sets = { CA: STARTER_BOARDS_CA, US: STARTER_BOARDS_US };
        let records = await loadBoards();
        if (!records.length) {
          // First visit: this account gets its own copy of the starter list —
          // the Canada set, or the US set when the profile lives there.
          const starters = sets[country] || sets.CA;
          await Promise.all(starters.map((board) => base44.entities.JobBoard.create(board)));
          records = await loadBoards();
        } else if (sets[country]) {
          // The starter list follows the profile's country. When the profile
          // has moved — a Canadian set out for an American profile, or the
          // reverse — the other country's starters are retired and this
          // country's take their place. Boards added by hand are never touched.
          const mine = sets[country];
          const theirs = sets[country === 'US' ? 'CA' : 'US'];
          const foreignNames = new Set(theirs.map((board) => board.name));
          const foreign = records.filter((record) => foreignNames.has(record.name));
          if (foreign.length) {
            await Promise.all(foreign.map((record) => base44.entities.JobBoard.delete(record.id)));
            const kept = new Set(records.map((record) => record.name));
            const missing = mine.filter((board) => !kept.has(board.name));
            await Promise.all(missing.map((board) => base44.entities.JobBoard.create(board)));
            records = await loadBoards();
          }
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
  }, [loadBoards, profile?.location]);

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
        <p className="text-[13px] leading-relaxed text-muted-foreground">{t('sources.statusLede')}</p>
        {seeding ? (
          <p className="mt-4 flex items-center gap-2 text-[13px] text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> {t('sources.seeding')}
          </p>
        ) : (
          <div className="mt-4 divide-y divide-border/70">
            {[...boards]
              .sort((a, b) => (TIER_ORDER[tierOf(a.url)] ?? 9) - (TIER_ORDER[tierOf(b.url)] ?? 9))
              .map((board) => (
              <div key={board.id} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-[14px] font-medium text-foreground">{board.name}</span>
                    <span className={pillClass(tierOf(board.url) === 'direct')}>
                      {tierOf(board.url) === 'direct' && <Search className="h-3 w-3" />}
                      {tierOf(board.url) === 'web' && <Globe className="h-3 w-3" />}
                      {tierOf(board.url) === 'manual' && <Hand className="h-3 w-3" />}
                      {t(TIER_KEYS[tierOf(board.url)])}
                    </span>
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
