import React, { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import useProfile from '@/hooks/useProfile';
import StudioHero from '@/components/home/StudioHero';
import ProgressCard from '@/components/home/ProgressCard';
import RecentApplications from '@/components/home/RecentApplications';

export default function Home() {
  const { toast } = useToast();
  const { profile, loadingProfile, save } = useProfile();
  const [entries, setEntries] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [entryRecords, documentRecords, applicationRecords] = await Promise.all([
        base44.entities.CareerEntry.list('-created_date', 200),
        base44.entities.SupportingDocument.list('-created_date', 100),
        base44.entities.JobApplication.list('-created_date', 20)
      ]);
      setEntries(entryRecords || []);
      setDocuments(documentRecords || []);
      setApplications(applicationRecords || []);
    } catch {
      // Unauthenticated preview fallback
    }
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
    <div>
      <StudioHero draftCount={loading ? 0 : draftCount} />

      <div className="mec-ticker">
        <div className="mec-tk">
          <b>{entries.length}</b>
          <span>Entries</span>
        </div>
        <div className="mec-tk">
          <b>{confirmed.length}</b>
          <span>Confirmed</span>
        </div>
        <div className="mec-tk">
          <b>{documents.length}</b>
          <span>Files</span>
        </div>
        <div className="mec-tk">
          <b>{applications.length}</b>
          <span>Résumés</span>
        </div>
      </div>

      <div className="mec-work">
        <RecentApplications applications={applications.slice(0, 4)} />

        <div className="mec-deck">
          <div className="mec-col">
            <section className="mec-panel">
              <div className="mec-eyebrow">Master history</div>
              {busy ? (
                <div className="mec-load" style={{ marginTop: 12 }}>
                  Loading your studio…
                </div>
              ) : historyComplete && profile.master_summary ? (
                <div>
                  <p className="mt-3 font-body text-[17px] leading-relaxed text-[#F9FAFB]/90">
                    {profile.master_summary}
                  </p>
                  {Array.isArray(profile.core_skills) && profile.core_skills.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {profile.core_skills.slice(0, 14).map((skill) => (
                        <span
                          key={skill}
                          className="rounded-full border border-[#D4AF37]/30 bg-[#0B0F17] px-3 py-1 font-body text-[14px] text-[#D4AF37]"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                  {Array.isArray(profile.target_titles) && profile.target_titles.length > 0 && (
                    <p className="mt-4 font-body text-[16px] text-[#aab3c5]">
                      Best fit roles: {profile.target_titles.join(' · ')}
                    </p>
                  )}
                </div>
              ) : (
                <div className="mec-load" style={{ marginTop: 12 }}>
                  Complete and lock in your career history to generate your master summary.
                </div>
              )}
            </section>
          </div>

          <div className="mec-col">
            <ProgressCard
              historyComplete={historyComplete}
              entryCount={entries.length}
              confirmedCount={confirmed.length}
              documentCount={documents.length}
              applicationCount={applications.length}
              onUnlock={unlock}
            />

          </div>
        </div>
      </div>
    </div>
  );
}