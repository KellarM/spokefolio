import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Download, Eye, Loader2, Mail, Pencil, RefreshCw, Save, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { trackEvent } from '@/lib/analytics';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import useProfile from '@/hooks/useProfile';
import StatusBadge from '@/components/applications/StatusBadge';
import JobLocation from '@/components/applications/JobLocation';
import JobPostingPanel from '@/components/applications/JobPostingPanel';
import CompanyBrief from '@/components/applications/CompanyBrief';
import SendPackageDialog from '@/components/applications/SendPackageDialog';
import InterviewPanel from '@/components/applications/InterviewPanel';
import ResumeRunPanel from '@/components/applications/ResumeRunPanel';
import ResumeDocument from '@/components/resume/ResumeDocument';
import PreviewDocument from '@/components/resume/PreviewDocument';
import ResumeDownloadButtons from '@/components/resume/ResumeDownloadButtons';
import ResumeTailoringPanel from '@/components/resume/ResumeTailoringPanel';
import ResumeStyleControls from '@/components/resume/ResumeStyleControls';
import CoverLetterSection from '@/components/resume/CoverLetterSection';
import { downloadDocxFile } from '@/lib/downloadDocx';
import { downloadPdfFile } from '@/lib/downloadPdf';
import TemplatePicker from '@/components/resume/TemplatePicker';
import { getTemplate, resolveTemplateId } from '@/lib/resumeTemplates';
import { readElementOverrides } from '@/lib/resumeElementStyles';
import DictateButton from '@/components/common/DictateButton';
import { appendLine } from '@/hooks/useDictation';
import { buildResumeProposal } from '@/lib/resumePatch';

const STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'ready', label: 'Ready to send' },
  { value: 'not_applied', label: 'Not Applied' },
  { value: 'applied', label: 'Applied' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'interviewing', label: 'Interviewing' },
  { value: 'offer', label: 'Offer' },
  { value: 'declined', label: 'Declined' },
  { value: 'not_hired', label: 'Not Hired' },
  { value: 'rejected', label: 'Closed' }
];

export default function ApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { profile, loadingProfile, save: saveProfile } = useProfile();
  const [application, setApplication] = useState(null);
  const [entries, setEntries] = useState([]);
  const [resume, setResume] = useState({});
  const [coverLetter, setCoverLetter] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadingLetter, setDownloadingLetter] = useState(false);
  const [downloadingLetterPdf, setDownloadingLetterPdf] = useState(false);
  const [writingLetter, setWritingLetter] = useState(false);
  const [rewriting, setRewriting] = useState(false);
  const [pickedTemplate, setPickedTemplate] = useState('');
  const [layout, setLayout] = useState(null);
  const [styleOverrides, setStyleOverrides] = useState({});
  const [previewMode, setPreviewMode] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [runs, setRuns] = useState([]);
  const [running, setRunning] = useState(false);
  const [applyingFix, setApplyingFix] = useState(null);
  const [proposal, setProposal] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [record, entryRecords, runPage] = await Promise.all([
          base44.entities.JobApplication.get(id),
          base44.entities.CareerEntry.list('-created_date', 200).catch(() => []),
          base44.entities.ResumeRun.filter({ application_id: id }, { sort: '-created_date', limit: 12 }).catch(() => ({ items: [] }))
        ]);
        if (cancelled) return;
        setApplication(record);
        setEntries(entryRecords || []);
        setRuns(runPage?.items || []);
        setResume(record.resume || {});
        setCoverLetter(record.cover_letter || '');
        setNotes(record.notes || '');
        setLayout(record.resume_layout || null);
        setStyleOverrides(readElementOverrides(record.resume_style_overrides));
      } catch (error) {
        if (!cancelled) setNotFound(true);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  // An "anytime" link from the emailed package lands here with ?download=resume or
  // ?download=letter. The saved PDF is re-signed for this signed-in session and opened,
  // then the parameter is cleared so a refresh does not download it again.
  useEffect(() => {
    const which = searchParams.get('download');
    if (!which || !application) return;
    const uri = which === 'letter' ? application.cover_letter_pdf_uri : which === 'resume' ? application.resume_pdf_uri : null;
    setSearchParams({}, { replace: true });
    if (!uri) {
      toast({
        title: 'No saved PDF yet',
        description: 'Use "Send to my email" to build the PDF for this application first.'
      });
      return;
    }
    base44.integrations.Core.CreateFileSignedUrl({ file_uri: uri, expires_in: 600 })
      .then(({ signed_url }) => {
        window.open(signed_url, '_blank');
      })
      .catch((error) => reportError('Could not open the saved PDF', error));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [application, searchParams]);

  const reportError = (title, error) => {
    toast({ title, description: error?.response?.data?.error || error.message, variant: 'destructive' });
  };

  const handleResumeChange = (nextResume) => {
    setResume(nextResume);
    if (application?.id) {
      base44.entities.JobApplication.update(application.id, { resume: nextResume }).catch(() => {});
    }
  };

  const persist = async (patch = {}) => {
    const updated = await base44.entities.JobApplication.update(application.id, {
      resume,
      cover_letter: coverLetter,
      notes,
      ...patch
    });
    setApplication(updated);
    return updated;
  };

  const save = async () => {
    setSaving(true);
    try {
      await persist();
      toast({ title: 'Résumé saved' });
    } catch (error) {
      reportError('Could not save', error);
    }
    setSaving(false);
  };

  const download = async () => {
    setDownloading(true);
    try {
      const saved = await persist();
      const label = [saved.job_title, saved.company].filter(Boolean).join(' - ');
      const response = await base44.functions.invoke('exportResumeDocx', {
        profile,
        resume: saved.resume || resume,
        label,
        template,
        layout,
        style_overrides: styleOverrides
      });
      const { base64, filename } = response.data || {};
      downloadDocxFile(base64, filename, 'resume.docx');
      toast({ title: 'Word document downloaded', description: filename });
    } catch (error) {
      reportError('Could not build the Word document', error);
    }
    setDownloading(false);
  };

  const downloadLetter = async () => {
    setDownloadingLetter(true);
    try {
      const saved = await persist();
      const response = await base44.functions.invoke('exportCoverLetterDocx', {
        profile,
        cover_letter: saved.cover_letter || coverLetter,
        recipient: { company: saved.company, job_title: saved.job_title }
      });
      const { base64, filename } = response.data || {};
      downloadDocxFile(base64, filename, 'cover-letter.docx');
      toast({ title: 'Cover letter downloaded', description: filename });
    } catch (error) {
      reportError('Could not build the cover letter', error);
    }
    setDownloadingLetter(false);
  };

  const downloadLetterPdf = async () => {
    setDownloadingLetterPdf(true);
    try {
      const saved = await persist();
      const response = await base44.functions.invoke('exportCoverLetterPdf', {
        profile,
        cover_letter: saved.cover_letter || coverLetter,
        recipient: { company: saved.company, job_title: saved.job_title }
      });
      const { base64, filename } = response.data || {};
      downloadPdfFile(base64, filename, 'cover-letter.pdf');
      toast({ title: 'Cover letter PDF downloaded', description: filename });
    } catch (error) {
      reportError('Could not build the cover letter PDF', error);
    }
    setDownloadingLetterPdf(false);
  };

  const writeLetter = async () => {
    setWritingLetter(true);
    try {
      const [entryRecords, documentRecords] = await Promise.all([
        base44.entities.CareerEntry.list('-created_date', 200),
        base44.entities.SupportingDocument.list('-created_date', 50)
      ]);
      const response = await base44.functions.invoke('generateTailoredResume', {
        company: application.company,
        job_title: application.job_title,
        job_description: application.job_description,
        profile,
        entries: (entryRecords || []).filter((entry) => entry.title && entry.title.trim()),
        documents: (documentRecords || []).filter((doc) => doc.extracted_summary)
      });
      trackEvent('tailoring_run', 'cover-letter');
      const letter = (response.data || {}).cover_letter || '';
      if (!letter) throw new Error('Nothing came back for this posting. Try again in a moment.');
      const updated = await base44.entities.JobApplication.update(application.id, { cover_letter: letter });
      setApplication(updated);
      setCoverLetter(updated.cover_letter || letter);
      toast({ title: 'Cover letter written for this posting' });
    } catch (error) {
      reportError('Could not write the cover letter', error);
    }
    setWritingLetter(false);
  };

  const rewrite = async () => {
    if (!window.confirm('Rewrite this résumé and cover letter from the same posting? Your manual edits will be replaced.')) return;
    setRewriting(true);
    try {
      const [entryRecords, documentRecords] = await Promise.all([
        base44.entities.CareerEntry.list('-created_date', 200),
        base44.entities.SupportingDocument.list('-created_date', 50)
      ]);
      const response = await base44.functions.invoke('generateTailoredResume', {
        company: application.company,
        job_title: application.job_title,
        job_description: application.job_description,
        profile,
        entries: (entryRecords || []).filter((entry) => entry.title && entry.title.trim()),
        documents: (documentRecords || []).filter((doc) => doc.extracted_summary),
        template: resolveTemplateId(pickedTemplate || application.resume_template, profile.resume_template)
      });
      trackEvent('tailoring_run', 'rewrite');
      const data = response.data || {};
      const nextResume = {
        headline: data.headline || '',
        summary: data.summary || '',
        skills: data.skills || [],
        keywords: data.keywords || [],
        experience: data.experience || [],
        education: data.education || [],
        certifications: data.certifications || []
      };
      const nextLetter = typeof data.cover_letter === 'string' ? data.cover_letter : '';
      const updated = await base44.entities.JobApplication.update(application.id, {
        resume: nextResume,
        match_summary: data.match_summary || '',
        gaps: data.gaps || [],
        cover_letter: nextLetter,
        interview_prep: null
      });
      setApplication(updated);
      setResume(updated.resume || nextResume);
      setCoverLetter(updated.cover_letter || nextLetter);
      await saveProfile({ headline: nextResume.headline }).catch(() => {});
      toast({ title: 'Résumé and cover letter rewritten for this posting' });
    } catch (error) {
      reportError('Could not rewrite this résumé', error);
    }
    setRewriting(false);
  };

  const remove = async () => {
    if (!window.confirm('Delete this application and its résumé?')) return;
    await base44.entities.JobApplication.delete(application.id);
    navigate('/applications');
  };

  const changeStatus = async (status) => {
    setApplication((prev) => ({ ...prev, status }));
    try {
      await base44.entities.JobApplication.update(application.id, { status });
    } catch (error) {
      reportError('Could not update the status', error);
    }
  };

  const handleSelectionChange = async (selectedIds) => {
    setApplication((prev) => (prev ? { ...prev, selected_entry_ids: selectedIds } : prev));
    try {
      await base44.entities.JobApplication.update(application.id, { selected_entry_ids: selectedIds });
    } catch (error) {
      reportError('Could not save role selection', error);
    }
  };

  // This application's own style wins, then the profile default, then the editorial style.
  const template = resolveTemplateId(pickedTemplate || application?.resume_template, profile?.resume_template);

  const changeTemplate = async (next) => {
    setPickedTemplate(next);
    try {
      const updated = await base44.entities.JobApplication.update(application.id, { resume_template: next });
      setApplication(updated);
      toast({ title: `${getTemplate(next).name} applied`, description: 'The preview and the Word download now use this style.' });
    } catch (error) {
      reportError('Could not change the style', error);
    }
  };

  // The manual adjustments on the style panel: where the heading block sits, which sections
  // this résumé keeps, and the portrait. Saved as they are chosen, so the downloads follow.
  const changeLayout = async (next) => {
    setLayout(next);
    try {
      const updated = await base44.entities.JobApplication.update(application.id, { resume_layout: next });
      setApplication(updated);
    } catch (error) {
      reportError('Could not save the layout', error);
    }
  };

  // One setting per part of the résumé: restyling one section heading restyles every one of
  // them, and the choice travels to the exports.
  const changeElementStyle = async (elementId, patch) => {
    const next = readElementOverrides({
      ...styleOverrides,
      [elementId]: { ...(styleOverrides[elementId] || {}), ...patch }
    });
    setStyleOverrides(next);
    try {
      const updated = await base44.entities.JobApplication.update(application.id, { resume_style_overrides: next });
      setApplication(updated);
    } catch (error) {
      reportError('Could not save the styling', error);
    }
  };

  // The order on screen becomes the order every newly written résumé starts from. This
  // application keeps its own order either way, so a posting can differ from the default.
  const makeDefaultOrder = async () => {
    const order = (resume.experience || []).map((job) => `${job.organization || ''}|${job.title || ''}`);
    if (!order.length) return;
    try {
      await saveProfile({ experience_order: order });
      toast({
        title: 'Default order saved',
        description: 'New tailored résumés will start in this job order. This one keeps the order you set here.'
      });
    } catch (error) {
      reportError('Could not save the default order', error);
    }
  };

  // Extra lines for one job block: written only from the history behind that block, and only
  // where that history genuinely answers this posting. The candidate picks which ones to keep.
  const suggestBullets = async (role) => {
    const response = await base44.functions.invoke('suggestRoleBullets', {
      company: application.company,
      job_title: application.job_title,
      job_description: application.job_description,
      role: {
        title: role.title,
        organization: role.organization,
        location: role.location,
        dates: role.dates
      },
      existing: role.bullets || []
    });
    return (response.data || {}).suggestions || [];
  };

  // One scored pass over the résumé as it stands. Each run is kept, so the marks can be
  // compared as the résumé changes.
  const runCheck = async () => {
    setRunning(true);
    try {
      const response = await base44.functions.invoke('gradeResume', { application_id: application.id });
      const run = response.data?.run;
      if (!run) throw new Error('The run came back empty. Try again in a moment.');
      setRuns((current) => [run, ...current].slice(0, 12));
      toast({ title: `Résumé Run: ${run.score}/100 — ${run.band}` });
    } catch (error) {
      reportError('Could not run the check', error);
    }
    setRunning(false);
  };

  // Pulling one of the pluses into the résumé: the writer works the change up from the
  // candidate's own history and it is shown, line by line, before anything lands.
  const applyFix = async (fix, index) => {
    setApplyingFix(index);
    setProposal(null);
    try {
      const response = await base44.functions.invoke('applyResumeFix', {
        application_id: application.id,
        fix: { dimension: fix.dimension, title: fix.title, detail: fix.detail }
      });
      const patch = response.data?.patch;
      if (!patch) throw new Error('Nothing came back for that line. Try again in a moment.');
      setProposal({ fix, ...buildResumeProposal(resume, patch) });
    } catch (error) {
      reportError('Could not work up that change', error);
    }
    setApplyingFix(null);
  };

  const acceptProposal = () => {
    if (!proposal) return;
    if (proposal.outcome === 'ready') {
      handleResumeChange(proposal.resume);
      toast({ title: 'Added to the résumé', description: 'Run the check again to see the mark move.' });
    }
    setProposal(null);
  };

  if (loading || loadingProfile) {
    return (
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading…
      </div>
    );
  }

  if (notFound || !application) {
    return (
      <div className="rounded-2xl border border-dashed border-border px-6 py-14 text-center">
        <p className="font-heading text-[20px]">That application is not here any more</p>
        <Button asChild className="mt-5 rounded-full">
          <Link to="/applications">Back to applications</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="animate-rise">
      <Link
        to="/applications"
        className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Applications
      </Link>

      <header className="mt-4 flex flex-wrap items-start justify-between gap-5">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-heading text-[28px] leading-tight tracking-tight sm:text-[32px]">
              {application.job_title || 'Tailored résumé'}
            </h1>
            <StatusBadge status={application.status} />
          </div>
          <p className="mt-1.5 text-[14px] text-muted-foreground">
            {application.company || 'Company not named'}
            {application.created_date ? ` · ${new Date(application.created_date).toLocaleDateString()}` : ''}
          </p>
          <JobLocation
            address={application.work_address}
            distanceKm={application.drive_distance_km}
            minutes={application.drive_minutes}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="w-[168px]">
            <Select value={application.status} onValueChange={changeStatus}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="secondary" className="rounded-full" onClick={rewrite} disabled={rewriting}>
            {rewriting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Rewrite
          </Button>
          <Button className="rounded-full" onClick={download} disabled={downloading}>
            {downloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Download Word
          </Button>
          <Button variant="secondary" className="rounded-full" onClick={() => setSendOpen(true)}>
            <Mail className="mr-2 h-4 w-4" />
            Send to my email
          </Button>
        </div>
      </header>

      <JobPostingPanel description={application.job_description} sourceUrl={application.source_url} />

      <CompanyBrief
        application={application}
        onResearched={(research, researchedAt) =>
          setApplication((prev) => ({ ...prev, company_research: research || prev.company_research, company_researched_at: researchedAt }))
        }
      />

      {(application.match_summary || (application.gaps || []).length > 0) && (
        <div className="mt-7 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          {application.match_summary && (
            <div className="rounded-2xl border border-accent/25 bg-accent/5 p-5">
              <p className="eyebrow">Why this version fits</p>
              <p className="mt-3 text-[14px] leading-relaxed text-foreground/90">{application.match_summary}</p>
            </div>
          )}
          {(application.gaps || []).length > 0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5">
              <p className="eyebrow text-amber-800">Worth preparing for</p>
              <ul className="mt-3 space-y-2">
                {application.gaps.map((gap, index) => (
                  <li key={index} className="text-[13.5px] leading-relaxed text-amber-900/90">
                    {gap}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <ResumeRunPanel
        run={runs[0] || null}
        history={runs}
        onRun={runCheck}
        running={running}
        onApplyFix={applyFix}
        applyingIndex={applyingFix}
        proposal={proposal}
        onAcceptProposal={acceptProposal}
        onDiscardProposal={() => setProposal(null)}
      />

      <section className="mt-7 rounded-2xl border border-border/70 bg-card p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="eyebrow">Résumé style</p>
          <p className="text-[12.5px] text-muted-foreground">
            {getTemplate(template).name} · used by the preview and the Word download
          </p>
        </div>
        <div className="mt-3">
          <TemplatePicker value={template} onChange={changeTemplate} className="max-w-[380px]" />
        </div>
        <ResumeStyleControls config={getTemplate(template).config} layout={layout} onChange={changeLayout} />
      </section>

      <div className="mt-7">
        <div className="mb-4 rounded-xl border border-border/70 bg-card p-5 text-slate-900">
          <ResumeTailoringPanel
            entries={entries}
            application={application}
            onSelectionChange={handleSelectionChange}
          />
        </div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="eyebrow">{previewMode ? 'Preview — the finished document' : 'Résumé — click any field to edit'}</p>
          <div className="flex flex-wrap items-center gap-2">
            <ResumeDownloadButtons
              profile={profile}
              resume={resume}
              template={template}
              layout={layout}
              styleOverrides={styleOverrides}
              label={`${application?.company || 'Resume'}_${application?.job_title || ''}`}
            />
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant={previewMode ? 'ghost' : 'secondary'}
                className="rounded-full"
                onClick={() => setPreviewMode(false)}
              >
                <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
              </Button>
              <Button
                size="sm"
                variant={previewMode ? 'secondary' : 'ghost'}
                className="rounded-full"
                onClick={() => setPreviewMode(true)}
              >
                <Eye className="mr-1.5 h-3.5 w-3.5" /> Preview
              </Button>
            </div>
          </div>
        </div>
        {previewMode ? (
          <PreviewDocument
            profile={profile}
            resume={resume}
            template={template}
            layout={layout}
            overrides={styleOverrides}
            onUpdateOverride={changeElementStyle}
          />
        ) : (
          <ResumeDocument
            profile={profile}
            resume={resume}
            onChange={handleResumeChange}
            template={template}
            layout={layout}
            overrides={styleOverrides}
            onUpdateOverride={changeElementStyle}
            onSetDefaultOrder={makeDefaultOrder}
            onSuggestBullets={suggestBullets}
          />
        )}
      </div>

      <CoverLetterSection
        value={coverLetter}
        onChange={setCoverLetter}
        company={application.company}
        onDownload={downloadLetter}
        downloading={downloadingLetter}
        onDownloadPdf={downloadLetterPdf}
        downloadingPdf={downloadingLetterPdf}
        onGenerate={writeLetter}
        generating={writingLetter}
      />

      <InterviewPanel application={application} onApplicationUpdate={(patch) => setApplication((prev) => ({ ...prev, ...patch }))} />

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-border/70 bg-card p-5">
          <Label htmlFor="application-notes" className="eyebrow">
            Your notes on this application
          </Label>
          <Textarea
            id="application-notes"
            rows={4}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Who referred you, what they asked in the first call, when you followed up…"
            className="mt-3 text-[14px]"
          />
          <DictateButton className="mt-3" onText={(transcript) => setNotes(appendLine(notes, transcript))} />
        </div>

        <div className="flex flex-col gap-2.5 rounded-2xl border border-border/70 bg-card p-5">
          <Button onClick={save} disabled={saving} className="rounded-full">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save changes
          </Button>
          <Button variant="secondary" className="rounded-full" onClick={download} disabled={downloading}>
            <Download className="mr-2 h-4 w-4" /> Download as Word
          </Button>
          <Button variant="secondary" className="rounded-full" onClick={() => setSendOpen(true)}>
            <Mail className="mr-2 h-4 w-4" /> Send to my email
          </Button>
          {application.last_sent_at && (
            <p className="text-center text-[12px] text-muted-foreground">
              Last sent {new Date(application.last_sent_at).toLocaleString('en-CA', { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
          )}
          <Button variant="ghost" className="rounded-full text-muted-foreground hover:text-destructive" onClick={remove}>
            <Trash2 className="mr-2 h-4 w-4" /> Delete application
          </Button>
        </div>
      </div>

      <SendPackageDialog
        open={sendOpen}
        onOpenChange={setSendOpen}
        application={application}
        resume={resume}
        coverLetter={coverLetter}
        template={template}
        layout={layout}
        styleOverrides={styleOverrides}
        onBeforeSend={persist}
        onSent={(data) =>
          setApplication((prev) => ({ ...prev, last_sent_to: data.sent_to, last_sent_at: data.sent_at }))
        }
      />
    </div>
  );
}