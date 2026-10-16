import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import useProfile from '@/hooks/useProfile';
import TemplatePicker from '@/components/resume/TemplatePicker';
import { DEFAULT_TEMPLATE_ID, resolveTemplateId } from '@/lib/resumeTemplates';
import PostingImportForm from '@/components/postings/PostingImportForm';
import DictateButton from '@/components/common/DictateButton';
import { appendLine } from '@/hooks/useDictation';

const STEPS = [
  'Reading the job posting',
  'Matching it against your real history',
  'Writing your tailored résumé and cover letter'
];

export default function NewApplication() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile, loadingProfile, save } = useProfile();
  const [searchParams] = useSearchParams();
  const postingParam = searchParams.get('posting') || '';
  const [form, setForm] = useState({ company: '', job_title: '', job_description: '', work_address: '' });
  const [entries, setEntries] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [template, setTemplate] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [postingId, setPostingId] = useState('');
  const [postingTitle, setPostingTitle] = useState('');
  const [loadingPosting, setLoadingPosting] = useState(Boolean(postingParam));

  const load = useCallback(async () => {
    const [entryRecords, documentRecords] = await Promise.all([
      base44.entities.CareerEntry.list('-created_date', 200),
      base44.entities.SupportingDocument.list('-created_date', 50)
    ]);
    // Draft entries are real history too: leaving them out silently drops whole jobs from the résumé.
    setEntries((entryRecords || []).filter((entry) => entry.title && entry.title.trim()));
    setDocuments((documentRecords || []).filter((doc) => doc.extracted_summary));
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Arriving from a saved posting: its details fill the form, and the application stays linked to it.
  useEffect(() => {
    if (!postingParam) return;
    let cancelled = false;
    (async () => {
      try {
        const posting = await base44.entities.JobPosting.get(postingParam);
        if (cancelled) return;
        if (posting) {
          setPostingId(posting.id);
          setPostingTitle(posting.job_title || posting.company || 'your saved posting');
          setSourceUrl(posting.source_url || '');
          setForm({
            company: posting.company || '',
            job_title: posting.job_title || '',
            job_description: posting.job_description || '',
            work_address: posting.work_address || ''
          });
        }
      } catch (error) {
        // The form works on its own: the posting can simply be pasted instead.
      }
      if (!cancelled) setLoadingPosting(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [postingParam]);

  // An imported posting fills the same fields, so it can be read over and corrected before writing.
  const applyImport = (imported) => {
    setPostingId('');
    setPostingTitle('');
    setSourceUrl(imported.source_url || '');
    setForm({
      company: imported.company || '',
      job_title: imported.job_title || '',
      job_description: imported.job_description || '',
      work_address: imported.work_address || ''
    });
  };

  // Start on the profile default until the person picks something else for this application.
  useEffect(() => {
    if (loadingProfile || template) return;
    setTemplate(resolveTemplateId(null, profile.resume_template));
  }, [loadingProfile, profile.resume_template, template]);

  const ready = form.job_description.trim().length >= 40;

  const generate = async () => {
    setBusy(true);
    try {
      const response = await base44.functions.invoke('generateTailoredResume', {
        company: form.company,
        job_title: form.job_title,
        job_description: form.job_description,
        profile,
        entries,
        documents,
        template: template || DEFAULT_TEMPLATE_ID
      });
      const data = response.data || {};
      const resume = {
        headline: data.headline || '',
        summary: data.summary || '',
        skills: data.skills || [],
        keywords: data.keywords || [],
        experience: data.experience || [],
        education: data.education || [],
        certifications: data.certifications || []
      };
      const created = await base44.entities.JobApplication.create({
        company: form.company,
        job_title: form.job_title,
        job_description: form.job_description,
        source_url: sourceUrl,
        posting_id: postingId,
        work_address: form.work_address,
        match_summary: data.match_summary || '',
        gaps: data.gaps || [],
        resume,
        cover_letter: data.cover_letter || '',
        status: 'ready',
        resume_template: template || DEFAULT_TEMPLATE_ID
      });
      await save({ headline: resume.headline }).catch(() => {});
      if (postingId) {
        // The saved posting now points at the résumé written from it.
        await base44.entities.JobPosting
          .update(postingId, { status: 'tailored', application_id: created.id })
          .catch(() => {});
      }
      navigate(`/application/${created.id}`);
    } catch (error) {
      toast({
        title: 'Your documents could not be written',
        description: error?.response?.data?.error || error.message,
        variant: 'destructive'
      });
      setBusy(false);
    }
  };

  const busyLoading = loading || loadingProfile || loadingPosting;

  return (
    <div className="animate-rise">
      <header className="max-w-2xl">
        <p className="eyebrow">Step two</p>
        <h1 className="mt-3 font-heading text-[30px] leading-tight tracking-tight sm:text-[36px]">Tailor a résumé to a job</h1>
        <p className="mt-3 text-[14.5px] leading-relaxed text-muted-foreground">
          Paste the posting. I rewrite your summary, skills and accomplishment wording around what this employer is asking
          for, and draft a matching cover letter to send with it — using only what actually happened in your career.
        </p>
      </header>

      {!busyLoading && entries.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border px-6 py-12 text-center">
          <p className="font-heading text-[20px]">Your career history is empty</p>
          <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-muted-foreground">
            Capture at least one confirmed entry first, so the résumé is built on your real experience.
          </p>
          <Button asChild className="mt-5 rounded-full">
            <Link to="/history">
              Capture your career history <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="paper rounded-2xl p-5 sm:p-7">
            {postingId && (
              <p className="rounded-xl border border-accent/25 bg-accent/5 px-4 py-3 text-[13px] leading-relaxed text-foreground/90">
                Starting from your saved posting — {postingTitle}. Everything below is yours to change before writing.
              </p>
            )}

            <div className={postingId ? 'mt-5' : ''}>
              <PostingImportForm
                title="Bring in the posting"
                hint="Read it from a link, or paste the text. Either way the details land in the fields below, for you to check first."
                onExtracted={applyImport}
              />
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="company" className="eyebrow">
                  Company
                </Label>
                <Input
                  id="company"
                  value={form.company}
                  onChange={(event) => setForm({ ...form, company: event.target.value })}
                  placeholder="Northwind Group"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="job-title" className="eyebrow">
                  Role title
                </Label>
                <Input
                  id="job-title"
                  value={form.job_title}
                  onChange={(event) => setForm({ ...form, job_title: event.target.value })}
                  placeholder="Senior Operations Manager"
                  className="mt-2"
                />
              </div>
            </div>

            <div className="mt-5">
              <Label htmlFor="job-description" className="eyebrow">
                Job description
              </Label>
              <Textarea
                id="job-description"
                rows={16}
                value={form.job_description}
                onChange={(event) => setForm({ ...form, job_description: event.target.value })}
                placeholder="Paste the whole posting here — responsibilities, requirements, the things the company cares about."
                className="mt-2 text-[14px] leading-relaxed"
              />
              <DictateButton
                className="mt-2"
                onText={(transcript) =>
                  setForm({ ...form, job_description: appendLine(form.job_description, transcript) })
                }
              />
              <p className="mt-2 text-[12px] text-muted-foreground">
                The more of the posting you paste, the sharper the match.
              </p>
            </div>

            <div className="mt-5 border-t border-border/70 pt-5">
              <Label className="eyebrow">Résumé style</Label>
              <p className="mt-1.5 text-[12.5px] text-muted-foreground">
                Your default style. You can change it here or later on the application.
              </p>
              <div className="mt-3">
                <TemplatePicker
                  value={template || DEFAULT_TEMPLATE_ID}
                  onChange={setTemplate}
                  className="max-w-[380px]"
                />
              </div>
            </div>

            <Button onClick={generate} disabled={busy || !ready} className="mt-5 rounded-full">
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Write my résumé and cover letter
            </Button>
          </div>

          <div className="space-y-4">
            {busy && (
              <div className="paper rounded-2xl p-5">
                <p className="eyebrow">Working</p>
                <ul className="mt-3 space-y-2.5">
                  {STEPS.map((step, index) => (
                    <li key={step} className="flex items-center gap-2.5 text-[13.5px]">
                      <Loader2
                        className="h-3.5 w-3.5 animate-spin text-accent"
                        style={{ animationDelay: `${index * 0.2}s` }}
                      />
                      <span className="text-muted-foreground">{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="rounded-2xl border border-border/70 bg-card p-5">
              <p className="eyebrow">What it draws on</p>
              <ul className="mt-3 space-y-2 text-[13.5px] text-muted-foreground">
                <li>{entries.length} career {entries.length === 1 ? 'entry' : 'entries'}, every job in your history</li>
                <li>{documents.length} reference {documents.length === 1 ? 'file' : 'files'} you uploaded</li>
                <li>Your details, a headline written for this posting, and a cover letter to send with it</li>
              </ul>
              <p className="mt-4 text-[12.5px] leading-relaxed text-muted-foreground">
                Everything stays faithful to your history. Where the posting asks for something you have not done, that shows
                up as a gap you can prepare for instead of a claim you cannot defend.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}