import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import PostingCard from '@/components/postings/PostingCard';
import PostingImportForm from '@/components/postings/PostingImportForm';
import JobSearchPanel from '@/components/postings/JobSearchPanel';
import JobSearchResults from '@/components/postings/JobSearchResults';
import JobBoardDirectory from '@/components/postings/JobBoardDirectory';
import { useStudioLanguage } from '@/lib/StudioLanguage';
import useProfile from '@/hooks/useProfile';
import { pillClass } from '@/components/postings/JobSearchFilters';
import { Search, FolderSearch } from 'lucide-react';

// The last search stays on this device for this account, so results survive
// changing screens or a page refresh. Nothing ever re-runs on its own: running
// a search again stays a manual click on the client.
const SEARCH_KEY = 'spokefolio:search';

const readStoredSearch = (email) => {
  try {
    const raw = email ? window.localStorage.getItem(`${SEARCH_KEY}:${email}`) : null;
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && Array.isArray(parsed.results) ? parsed : null;
  } catch (e) {
    return null;
  }
};

const storeSearch = (email, search) => {
  const key = `${SEARCH_KEY}:${email}`;
  try {
    if (!search) {
      window.localStorage.removeItem(key);
      return;
    }
    window.localStorage.setItem(key, JSON.stringify(search));
  } catch (e) {
    try {
      // The descriptions are the bulk. Trim them and try once more.
      const light = {
        ...search,
        results: (search.results || []).map((item) => ({
          ...item,
          job_description: String(item.job_description || '').slice(0, 500)
        }))
      };
      window.localStorage.setItem(key, JSON.stringify(light));
    } catch (e2) {
      // The search still works without persistence.
    }
  }
};

export default function Postings() {
  const { t } = useStudioLanguage();
  const { profile } = useProfile();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [postings, setPostings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const [search, setSearchState] = useState(null);
  const [savingKey, setSavingKey] = useState('');
  const [tab, setTab] = useState('search');

  const load = useCallback(async () => {
    const records = await base44.entities.JobPosting.list('-created_date', 100);
    setPostings(records || []);
    setLoading(false);
    return records || [];
  }, []);

  useEffect(() => {
    const email = (profile.email || '').trim();
    if (email && search === null) {
      setSearchState(readStoredSearch(email));
    }
  }, [profile.email]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let records = await load();
      try {
        for (let pass = 0; pass < 4 && !cancelled; pass += 1) {
          if (!records.some((item) => !item.location_checked)) break;
          setLocating(true);
          const response = await base44.functions.invoke('locateApplications', { target: 'postings', home_address: profile?.home_address || '' });
          const { remaining } = response.data || {};
          records = await load();
          if (!remaining) break;
        }
      } catch (error) {
        // The list works without it, and the lookup can run again on the next visit.
      }
      if (!cancelled) setLocating(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  const add = async (imported) => {
    try {
      const hasCommute = imported.drive_distance_km != null || imported.drive_minutes != null;
      const created = await base44.entities.JobPosting.create({
        job_title: imported.job_title,
        company: imported.company,
        job_description: imported.job_description,
        source_url: imported.source_url,
        work_address: imported.work_address,
        drive_distance_km: imported.drive_distance_km ?? undefined,
        drive_minutes: imported.drive_minutes ?? undefined,
        location_checked: hasCommute,
        imported_from: imported.source_url ? 'link' : 'text',
        status: 'saved'
      });
      setPostings((prev) => [created, ...prev]);
      toast({ title: t('postings.toastSavedTitle'), description: t('postings.toastSavedDesc') });
    } catch (error) {
      toast({
        title: t('postings.toastSaveFailed'),
        description: error?.response?.data?.error || error.message,
        variant: 'destructive'
      });
    }
  };

  const remove = async (posting) => {
    if (!window.confirm(t('postings.removeConfirm'))) return;
    try {
      await base44.entities.JobPosting.delete(posting.id);
      setPostings((prev) => prev.filter((item) => item.id !== posting.id));
    } catch (error) {
      toast({
        title: t('postings.toastRemovedTitle'),
        description: error?.response?.data?.error || error.message,
        variant: 'destructive'
      });
    }
  };

  const clearAll = async () => {
    if (!postings.length) return;
    if (!window.confirm(t('postings.clearAllConfirm', { count: postings.length }))) return;
    try {
      await base44.entities.JobPosting.deleteMany({ id: { $in: postings.map((posting) => posting.id) } });
      setPostings([]);
      toast({ title: t('postings.toastClearedTitle'), description: t('postings.toastClearedDesc') });
    } catch (error) {
      toast({
        title: t('postings.toastClearFailed'),
        description: error?.response?.data?.error || error.message,
        variant: 'destructive'
      });
    }
  };

  const setSearch = useCallback(
    (value) => {
      setSearchState(value);
      const email = (profile.email || '').trim();
      if (email) storeSearch(email, value);
    },
    [profile.email]
  );

  const dismissResult = (result) => {
    const key = `${result.source_url || result.job_title}-${result.company}`;
    setSearch((prev) =>
      prev
        ? {
            ...prev,
            results: prev.results.filter(
              (item) => `${item.source_url || item.job_title}-${item.company}` !== key
            )
          }
        : prev
    );
  };

  // Keeping a search result makes it a posting like any other, with the employer's own page read for the full text.
  const keepResult = async (result) => {
    const already = postings.find((item) => item.source_url && item.source_url === result.source_url);
    if (already) return already;

    setSavingKey(result.source_url || result.job_title);
    try {
      let description = result.job_description || result.summary || result.job_title;
      let fullText = Boolean(result.job_description && result.job_description.length >= 120);

      let workAddress = result.work_address || '';
      let distanceKm = result.drive_distance_km ?? null;
      let driveMinutes = result.drive_minutes ?? null;

      if (!fullText && result.source_url) {
        try {
          const read = await base44.functions.invoke('importJobPosting', { url: result.source_url });
          if (read.data?.status === 'ok' && read.data.job_description) {
            description = read.data.job_description;
            fullText = true;
            if (read.data.work_address) workAddress = read.data.work_address;
            if (read.data.drive_distance_km != null) distanceKm = read.data.drive_distance_km;
            if (read.data.drive_minutes != null) driveMinutes = read.data.drive_minutes;
          }
        } catch (error) {
          // The summary found in the search is still enough to keep it; the text can be pasted in later.
        }
      }

      const hasCommute = distanceKm != null || driveMinutes != null;
      const created = await base44.entities.JobPosting.create({
        job_title: result.job_title,
        company: result.company,
        job_description: description,
        source_url: result.source_url || '',
        work_address: workAddress,
        drive_distance_km: distanceKm ?? undefined,
        drive_minutes: driveMinutes ?? undefined,
        location_checked: hasCommute,
        imported_from: 'search',
        status: 'saved'
      });
      setPostings((prev) => [created, ...prev]);
      toast({
        title: t('postings.toastKeptTitle'),
        description: fullText
          ? t('postings.toastKeptFull')
          : t('postings.toastKeptPartial')
      });
      return created;
    } catch (error) {
      toast({
        title: t('postings.toastKeepFailed'),
        description: error?.response?.data?.error || error.message,
        variant: 'destructive'
      });
      return null;
    } finally {
      setSavingKey('');
    }
  };

  const tailorResult = async (result) => {
    const kept = await keepResult(result);
    if (kept) navigate(`/tailor-application?posting=${kept.id}`);
  };

  const tailored = postings.filter((posting) => posting.status === 'tailored').length;

  return (
    <div className="animate-rise">
      <header className="max-w-2xl">
        <p className="eyebrow">{t('common.yourSearch')}</p>
        <h1 className="mt-3 font-heading text-[30px] leading-tight tracking-tight sm:text-[36px]">{t('postings.title')}</h1>
        <p className="mt-3 text-[14.5px] leading-relaxed text-muted-foreground">
          {t('postings.lede')}
        </p>
      </header>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <span className={pillClass(false)}>
          {t('postings.capturedCount', { count: postings.length })}
        </span>
        {tailored > 0 && (
          <span className={pillClass(false)}>
            {t('postings.withResume', { count: tailored })}
          </span>
        )}
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <button type="button" className={pillClass(tab === 'search')} onClick={() => setTab('search')}>
          <Search className="h-3.5 w-3.5" /> {t('sources.tabSearch')}
        </button>
        <button type="button" className={pillClass(tab === 'sources')} onClick={() => setTab('sources')}>
          <FolderSearch className="h-3.5 w-3.5" /> {t('sources.tab')}
        </button>
      </div>

      {tab === 'sources' ? (
        <JobBoardDirectory postings={postings} search={search} />
      ) : (
      <>
      <div className="mt-7 space-y-6">
        <JobSearchPanel onResults={setSearch} initial={search} />

        {search && (
          <JobSearchResults
            search={search}
            savingKey={savingKey}
            onKeep={keepResult}
            onTailor={tailorResult}
            onDismiss={dismissResult}
            onClear={() => setSearch(null)}
          />
        )}

        <PostingImportForm
          onExtracted={add}
          hint={t('postings.importHint')}
        />
      </div>

      {locating && (
        <p className="mt-6 flex items-center gap-2 text-[13px] text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> {t('common.findingAddressesPostings')}
        </p>
      )}

      {loading ? (
        <div className="mt-8 flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> {t('postings.loadingPostings')}
        </div>
      ) : postings.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border px-6 py-14 text-center">
          <p className="font-heading text-[20px]">{t('postings.nothingKept')}</p>
          <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-muted-foreground">
            {t('postings.nothingKeptDesc')}
          </p>
        </div>
      ) : (
        <>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-2">
            <p className="eyebrow">{t('postings.keptPostings')}</p>
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-[12.5px] text-muted-foreground">
                {tailored
                  ? t('postings.savedCount', { count: postings.length }) + t('postings.withResume', { count: tailored })
                  : t('postings.savedCount', { count: postings.length })}
              </p>
              <Button
                size="sm"
                variant="ghost"
                className="rounded-full text-muted-foreground hover:text-destructive"
                onClick={clearAll}
              >
                <Trash2 className="h-3.5 w-3.5" /> {t('postings.clearAll')}
              </Button>
            </div>
          </div>
          <ul className="mt-3 space-y-3">
            {postings.map((posting) => (
              <PostingCard key={posting.id} posting={posting} onDelete={remove} />
            ))}
          </ul>
        </>
      )}
      </>
      )}
    </div>
  );
}
