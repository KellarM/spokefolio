import React, { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import useProfile from '@/hooks/useProfile';
import { captureIsSaved } from '@/lib/historyCapture';
import { trackAppOpen } from '@/lib/analytics';
import { useAuth } from '@/lib/AuthContext';
import StudioHero from '@/components/home/StudioHero';
import RecentApplications from '@/components/home/RecentApplications';
import { useStudioLanguage } from '@/lib/StudioLanguage';
import { useTour } from '@/lib/TourContext';

const RESUME_PAGE = 100;
const RESUME_PAGE_LIMIT = 100;

// A tailored résumé is what makes an application count on the ticker: a saved
// posting with nothing written for it is not work done.
const carriesResume = (record) => {
  const resume = record?.resume || {};
  return Boolean(
    String(resume.summary || '').trim() ||
      (Array.isArray(resume.experience) && resume.experience.length > 0) ||
      (Array.isArray(resume.skills) && resume.skills.length > 0)
  );
};

// The ticker counts every résumé on the account. Reading the length of the
// recent block's page froze the figure at twenty the moment the account passed
// twenty applications, which read as a cap on the work done. This walks the
// account in blocks instead, and stops on a short page.
const countResumes = async () => {
  let total = 0;
  for (let page = 0; page < RESUME_PAGE_LIMIT; page += 1) {
    const records = await base44.entities.JobApplication.list('-created_date', RESUME_PAGE, page * RESUME_PAGE);
    const batch = records || [];
    total += batch.filter(carriesResume).length;
    if (batch.length < RESUME_PAGE) break;
  }
  return total;
};

export default function Home() {
  const { t } = useStudioLanguage();
  const tour = useTour();
  const { profile, loadingProfile } = useProfile();
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [applications, setApplications] = useState([]);
  const [resumeCount, setResumeCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [entryRecords, documentRecords, applicationRecords, resumeTotal] = await Promise.all([
        base44.entities.CareerEntry.list('-created_date', 200),
        base44.entities.SupportingDocument.list('-created_date', 100),
        // The newest twenty feed the recent block; the count comes from the walk.
        base44.entities.JobApplication.list('-created_date', 20),
        // A failed walk must not take the rest of the overview down with it.
        countResumes().catch(() => 0)
      ]);
      // Every entry is kept here, hidden ones included. The capture signature
      // is written over the whole set when the history is saved, so asking the
      // "is this saved?" question with a filtered list can never match - that
      // is what left a saved history looking like it had never been captured.
      setEntries(entryRecords || []);
      setDocuments(documentRecords || []);
      setApplications(applicationRecords || []);
      setResumeCount(resumeTotal || 0);
    } catch {
      // Unauthenticated preview fallback
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    trackAppOpen(user?.id);
  }, []);

  // Saved, not merely once-saved: if entries changed after the last capture,
  // the overview says so instead of showing a summary that has moved on.
  const visibleEntries = entries.filter((entry) => !entry.hidden);
  const historyComplete = loading ? !!profile.history_complete : captureIsSaved(entries, profile);
  const confirmed = visibleEntries.filter((entry) => entry.status === 'confirmed');
  const draftCount = visibleEntries.filter((entry) => entry.status === 'draft').length;
  const busy = loading || loadingProfile;

  // Auto-start, once per account, and only for a studio that still has
  // something to learn from the ball: a name still missing or no story
  // captured yet. Anyone established only ever sees the summoner pill.
  useEffect(() => {
    if (busy || !user || !tour.ready || tour.hasRecord) return;
    const stepsDone = visibleEntries.length > 0 && !!(profile && profile.full_name);
    if (stepsDone) return;
    tour.start({ step: profile && profile.full_name ? 'story' : 'identity' });
  }, [busy, user, profile, visibleEntries.length, tour]);

  return (
    <div>
      <StudioHero draftCount={loading ? 0 : draftCount} profile={profile} />

      <div className="mec-ticker">
        <div className="mec-tk">
          <b>{visibleEntries.length}</b>
          <span>{t('home.tickerEntries')}</span>
        </div>
        <div className="mec-tk">
          <b>{confirmed.length}</b>
          <span>{t('home.tickerConfirmed')}</span>
        </div>
        <div className="mec-tk">
          <b>{documents.length}</b>
          <span>{t('home.tickerFiles')}</span>
        </div>
        <div className="mec-tk">
          <b>{resumeCount}</b>
          <span>{t('home.tickerResumes')}</span>
        </div>
      </div>

      <div className="mec-work">
        <RecentApplications applications={applications.slice(0, 2)} />

        <section className="mec-panel">
          <div className="mec-eyebrow">{t('home.masterHistory')}</div>
          {busy ? (
            <div className="mec-load" style={{ marginTop: 12 }}>
              {t('home.loadingStudio')}
            </div>
          ) : String(profile.master_summary || '').trim() ? (
            <div>
              <p className="mt-3 font-body text-[17px] leading-relaxed text-[#F9FAFB]/90">
                {profile.master_summary}
              </p>
              {!historyComplete && (
                <p className="mt-3 font-body text-[14px] leading-relaxed text-[#D4AF37]">
                  {t('home.summaryStale')}
                </p>
              )}
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
                  {t('home.bestFitRoles')} {profile.target_titles.join(' · ')}
                </p>
              )}
            </div>
          ) : (
            <div className="mec-load" style={{ marginTop: 12 }}>
              {t('home.completeHistory')}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}