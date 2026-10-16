import React, { useCallback, useEffect, useState } from 'react';
import { Loader2, Quote } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import useProfile from '@/hooks/useProfile';
import StudioHero from '@/components/home/StudioHero';
import ContactForm from '@/components/home/ContactForm';
import ProgressCard from '@/components/home/ProgressCard';
import TemplateCard from '@/components/home/TemplateCard';
import RecentApplications from '@/components/home/RecentApplications';

export default function Home() {
  const { toast } = useToast();
  const { profile, loadingProfile, save } = useProfile();
  const [entries, setEntries] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [entryRecords, documentRecords, applicationRecords] = await Promise.all([
      base44.entities.CareerEntry.list('-created_date', 200),
      base44.entities.SupportingDocument.list('-created_date', 100),
      base44.entities.JobApplication.list('-created_date', 20)
    ]);
    setEntries(entryRecords || []);
    setDocuments(documentRecords || []);
    setApplications(applicationRecords || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const historyComplete = !!profile.history_complete;
  const confirmed = entries.filter((entry) => entry.status === 'confirmed');
  const draftCount = entries.filter((entry) => entry.status === 'draft').length;
  const busy = loading || loadingProfile;

  const unlock = async () => {
    await save({ history_complete: false });
    toast({ title: 'History unlocked', description: 'You can capture more entries whenever you like.' });
  };

  return (
    <div className="animate-rise">
      <StudioHero draftCount={loading ? 0 : draftCount} />

      {busy ? (
        <div className="mt-12 flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading your studio…
        </div>
      ) : (
        <>
          <div className="mt-10 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
            <ContactForm profile={profile} onSave={save} />
            <ProgressCard
              historyComplete={historyComplete}
              entryCount={entries.length}
              confirmedCount={confirmed.length}
              documentCount={documents.length}
              applicationCount={applications.length}
              onUnlock={unlock}
            />
          </div>

          {historyComplete && profile.master_summary && (
            <section className="mt-6 paper rounded-2xl p-6">
              <div className="flex items-start gap-3">
                <Quote className="mt-1 h-4 w-4 shrink-0 text-accent/70" strokeWidth={1.75} />
                <div>
                  <p className="eyebrow">Master history</p>
                  <p className="mt-3 text-[14.5px] leading-relaxed text-foreground/90">{profile.master_summary}</p>
                  {Array.isArray(profile.core_skills) && profile.core_skills.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {profile.core_skills.slice(0, 14).map((skill) => (
                        <span key={skill} className="rounded-full bg-secondary px-2.5 py-1 text-[12px] text-secondary-foreground">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                  {Array.isArray(profile.target_titles) && profile.target_titles.length > 0 && (
                    <p className="mt-4 text-[13px] text-muted-foreground">
                      Best fit roles: {profile.target_titles.join(' · ')}
                    </p>
                  )}
                </div>
              </div>
            </section>
          )}

          <TemplateCard profile={profile} onSave={save} />

          <RecentApplications applications={applications.slice(0, 4)} />
        </>
      )}
    </div>
  );
}