import React, { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import PostingCard from '@/components/postings/PostingCard';
import PostingImportForm from '@/components/postings/PostingImportForm';

export default function Postings() {
  const { toast } = useToast();
  const [postings, setPostings] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const records = await base44.entities.JobPosting.list('-created_date', 100);
    setPostings(records || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const add = async (imported) => {
    try {
      const created = await base44.entities.JobPosting.create({
        job_title: imported.job_title,
        company: imported.company,
        job_description: imported.job_description,
        source_url: imported.source_url,
        work_address: imported.work_address,
        imported_from: imported.source_url ? 'link' : 'text',
        status: 'saved'
      });
      setPostings((prev) => [created, ...prev]);
      toast({ title: 'Posting saved', description: 'Tailor a résumé to it whenever you are ready.' });
    } catch (error) {
      toast({
        title: 'That posting could not be saved',
        description: error?.response?.data?.error || error.message,
        variant: 'destructive'
      });
    }
  };

  const remove = async (posting) => {
    if (!window.confirm('Remove this saved posting?')) return;
    try {
      await base44.entities.JobPosting.delete(posting.id);
      setPostings((prev) => prev.filter((item) => item.id !== posting.id));
    } catch (error) {
      toast({
        title: 'Could not remove that posting',
        description: error?.response?.data?.error || error.message,
        variant: 'destructive'
      });
    }
  };

  const tailored = postings.filter((posting) => posting.status === 'tailored').length;

  return (
    <div className="animate-rise">
      <header className="max-w-2xl">
        <p className="eyebrow">Your search</p>
        <h1 className="mt-3 font-heading text-[30px] leading-tight tracking-tight sm:text-[36px]">Job postings</h1>
        <p className="mt-3 text-[14.5px] leading-relaxed text-muted-foreground">
          Keep the postings you are interested in here. Bring one in from a link or paste its text, then tailor a résumé
          to it without pasting a word twice.
        </p>
      </header>

      <div className="mt-7">
        <PostingImportForm
          onExtracted={add}
          hint="Give it the link and it reads the employer, the role, the location and the posting itself — or paste the text for sites that block reading."
        />
      </div>

      {loading ? (
        <div className="mt-8 flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading your postings…
        </div>
      ) : postings.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border px-6 py-14 text-center">
          <p className="font-heading text-[20px]">No postings kept yet</p>
          <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-muted-foreground">
            Add the first one above. It stays here with a way to start a résumé written for it, and the original link kept
            with the application.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-8 flex flex-wrap items-baseline justify-between gap-2">
            <p className="eyebrow">Kept postings</p>
            <p className="text-[12.5px] text-muted-foreground">
              {postings.length} saved{tailored ? ` · ${tailored} with a résumé written` : ''}
            </p>
          </div>
          <ul className="mt-3 space-y-3">
            {postings.map((posting) => (
              <PostingCard key={posting.id} posting={posting} onDelete={remove} />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}