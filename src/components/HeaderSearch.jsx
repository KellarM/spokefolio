import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useStudioLanguage } from '@/lib/StudioLanguage';

// The header search: find WHERE a phrase lives - profile, history, an
// application's resume, or a document - so it can be edited or deleted.
// Everything a resume can draw words from is in scope; hidden history
// entries are excluded because they never reach a resume-facing output.

const asText = (value) => {
  if (value == null || value === false) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(asText).filter(Boolean).join(' | ');
  if (typeof value === 'object') return Object.values(value).map(asText).filter(Boolean).join(' | ');
  return String(value);
};

const SOURCE_ORDER = ['profile', 'history', 'application', 'document'];
const SOURCE_KEYS = {
  profile: 'search.sourceProfile',
  history: 'search.sourceHistory',
  application: 'search.sourceApplication',
  document: 'search.sourceDocument'
};

// A snippet around the first occurrence, split so the match can be marked.
const snippet = (text, q) => {
  const idx = text.toLowerCase().indexOf(q);
  const start = idx > 45 ? idx - 45 : 0;
  const end = Math.min(text.length, idx + q.length + 75);
  const rel = idx - start;
  const body = text.slice(start, end);
  return {
    pre: (start > 0 ? '…' : '') + body.slice(0, rel),
    match: body.slice(rel, rel + q.length),
    post: body.slice(rel + q.length) + (end < text.length ? '…' : '')
  };
};

const F = (labelKey, pick) => ({ labelKey, pick });

// Field maps per source. Labels tell Michael exactly which field carries
// the words, so "where is that coming from" has an answer on every hit.
const PROFILE_FIELDS = [
  F('search.fldName', (p) => p.full_name),
  F('search.fldHeadline', (p) => p.headline),
  F('search.fldLocation', (p) => p.location),
  F('search.fldMasterSummary', (p) => p.master_summary),
  F('search.fldSkills', (p) => p.core_skills),
  F('search.fldTargetTitles', (p) => p.target_titles),
  F('search.fldDescription', (p) => p.description)
];

const ENTRY_FIELDS = [
  F('search.fldTitle', (e) => e.title),
  F('search.fldOrganization', (e) => e.organization),
  F('search.fldSummary', (e) => e.summary),
  F('search.fldDetails', (e) => e.raw_text),
  F('search.fldDetails', (e) => e.accomplishments),
  F('search.fldDetails', (e) => e.duty_timeline),
  F('search.fldSkills', (e) => e.skills),
  F('search.fldMetrics', (e) => e.metrics),
  F('search.fldKeywords', (e) => e.keywords)
];

const APPLICATION_FIELDS = [
  F('search.fldTitle', (a) => a.job_title),
  F('search.fldOrganization', (a) => a.company),
  F('search.fldResume', (a) => a.resume && [a.resume.headline, a.resume.summary]),
  F('search.fldSkills', (a) => a.resume && a.resume.skills),
  F('search.fldKeywords', (a) => a.resume && a.resume.keywords),
  F('search.fldResume', (a) => a.resume && a.resume.experience),
  F('search.fldEducation', (a) => a.resume && a.resume.education),
  F('search.fldCoverLetter', (a) => a.cover_letter),
  F('search.fldNotes', (a) => a.notes)
];

const DOCUMENT_FIELDS = [
  F('search.fldName', (d) => d.name),
  F('search.fldSummary', (d) => d.extracted_summary),
  F('search.fldNotes', (d) => d.notes)
];

const PER_SOURCE_CAP = 25;

function findHits(data, q, t) {
  const hits = [];

  const scan = (records, fields, source, recordTitle, to) => {
    let count = 0;
    records.forEach((record) => {
      if (count >= PER_SOURCE_CAP) return;
      fields.forEach(({ labelKey, pick }) => {
        if (count >= PER_SOURCE_CAP) return;
        const text = asText(pick(record));
        if (text && text.toLowerCase().includes(q)) {
          hits.push({
            source,
            to: typeof to === 'function' ? to(record) : to,
            record: recordTitle(record),
            field: t(labelKey),
            ...snippet(text, q)
          });
          count += 1;
        }
      });
    });
  };

  if (data.profile) {
    scan([data.profile], PROFILE_FIELDS, 'profile', () => t('search.sourceProfile'), '/profile');
  }
  scan(data.entries, ENTRY_FIELDS, 'history',
    (e) => [e.title, e.organization].filter(Boolean).join(' — '), '/history');
  scan(data.applications, APPLICATION_FIELDS, 'application',
    (a) => [a.job_title, a.company].filter(Boolean).join(' — '), (a) => `/application/${a.id}`);
  scan(data.documents, DOCUMENT_FIELDS, 'document', (d) => d.name || t('search.sourceDocument'), '/documents');

  return hits;
}

export default function HeaderSearch() {
  const { t } = useStudioLanguage();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const loadAttempted = useRef(false);
  const [failed, setFailed] = useState(false);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  // The datasets load once, on first open - not on every keystroke. The
  // once-guard is a REF, not state: a loading flag in the dependency list
  // re-ran this effect the moment it flipped, firing the cleanup and
  // discarding the results of a fetch that had already succeeded - the
  // panel hung on 'Searching...' forever. The ref loads once, period.
  useEffect(() => {
    if (!open || loadAttempted.current) return;
    loadAttempted.current = true;
    setLoading(true);
    const safe = (call) => call.catch(() => null);
    Promise.all([
      safe(base44.entities.ResumeProfile.list('-created_date', 10)),
      safe(base44.entities.CareerEntry.list('-created_date', 500)),
      safe(base44.entities.JobApplication.list('-created_date', 200)),
      safe(base44.entities.SupportingDocument.list('-created_date', 200))
    ])
      .then(([profiles, entries, applications, documents]) => {
        if (!profiles && !entries && !applications && !documents) {
          setFailed(true);
          return;
        }
        setData({
          profile: profiles?.[0] || null,
          entries: (entries || []).filter((entry) => !entry.hidden),
          applications: applications || [],
          documents: documents || []
        });
      })
      .finally(() => setLoading(false));
  }, [open]);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(query.trim().toLowerCase()), 220);
    return () => clearTimeout(id);
  }, [query]);

  // Close on outside click and on Escape.
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (event) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    inputRef.current?.focus();
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const hits = useMemo(() => {
    if (!debounced || debounced.length < 2 || !data) return [];
    return findHits(data, debounced, t);
  }, [debounced, data, t]);

  const grouped = useMemo(() => {
    const bySource = new Map();
    hits.forEach((hit) => {
      const list = bySource.get(hit.source) || [];
      list.push(hit);
      bySource.set(hit.source, list);
    });
    return SOURCE_ORDER
      .filter((source) => bySource.has(source))
      .map((source) => ({ source, hits: bySource.get(source) }));
  }, [hits]);

  const onSearchKey = (event) => {
    if (event.key === 'Enter' && hits.length > 0) {
      navigate(hits[0].to);
      setOpen(false);
    }
  };

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        aria-label={t('nav.search')}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-secondary/70 text-secondary-foreground transition-colors hover:bg-secondary"
      >
        <Search className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-[min(420px,calc(100vw-32px))] rounded-2xl border border-[#D4AF37]/30 bg-[#0B0F17] p-3 shadow-[0_18px_50px_rgba(0,0,0,0.55)]">
          <p className="px-1 pb-2 font-body text-[13px] font-semibold uppercase tracking-[0.18em] text-[#D4AF37]">
            {t('search.title')}
          </p>

          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={onSearchKey}
              placeholder={t('search.placeholder')}
              className="h-10 w-full rounded-xl border border-border/60 bg-secondary/50 px-3.5 pr-9 font-body text-[15px] text-foreground outline-none placeholder:text-muted-foreground focus:border-[#D4AF37]/60"
            />
            {query && (
              <button
                type="button"
                aria-label={t('common.clearField')}
                onClick={() => {
                  setQuery('');
                  inputRef.current?.focus();
                }}
                className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="mt-2 max-h-[52vh] overflow-y-auto">
            {loading && (
              <p className="px-1 py-3 font-body text-[14px] text-muted-foreground">{t('search.searching')}</p>
            )}
            {!loading && failed && (
              <p className="px-1 py-3 font-body text-[14px] text-muted-foreground">{t('search.loadError')}</p>
            )}
            {!loading && !failed && query.trim().length >= 2 && hits.length === 0 && (
              <p className="px-1 py-3 font-body text-[14px] text-muted-foreground">{t('search.noResults')}</p>
            )}
            {!loading && !failed && query.trim().length < 2 && (
              <p className="px-1 py-3 font-body text-[13px] leading-relaxed text-muted-foreground">
                {t('search.hint')}
              </p>
            )}

            {grouped.map(({ source, hits: group }) => (
              <div key={source} className="mt-1">
                <div className="flex items-center gap-2 px-1 py-1.5">
                  <span className="rounded-full border border-[#D4AF37]/40 px-2 py-0.5 font-body text-[11px] font-semibold uppercase tracking-[0.14em] text-[#D4AF37]">
                    {t(SOURCE_KEYS[source])}
                  </span>
                  <span className="font-body text-[11px] text-muted-foreground">{group.length}</span>
                </div>
                {group.map((hit, i) => (
                  <Link
                    key={`${source}-${i}`}
                    to={hit.to}
                    onClick={() => setOpen(false)}
                    className="block rounded-xl px-2 py-2 transition-colors hover:bg-[#D4AF37]/10"
                  >
                    <span className="block truncate font-body text-[14px] font-medium text-foreground">
                      {hit.record}
                    </span>
                    <span className="block truncate font-body text-[12px] uppercase tracking-[0.1em] text-muted-foreground">
                      {hit.field}
                    </span>
                    <span className="mt-0.5 block font-body text-[13px] leading-snug text-[#aab3c5]">
                      {hit.pre}
                      <mark className="bg-transparent font-semibold text-[#E9C766]">{hit.match}</mark>
                      {hit.post}
                    </span>
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
