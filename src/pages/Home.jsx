import React, { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import useProfile from '@/hooks/useProfile';
import { trackAppOpen } from '@/lib/analytics';
import { useAuth } from '@/lib/AuthContext';
import StudioHero from '@/components/home/StudioHero';
import RecentApplications from '@/components/home/RecentApplications';
import { Sparkles } from 'lucide-react';
import { useStudioLanguage } from '@/lib/StudioLanguage';
import { useTour } from '@/lib/TourContext';

export default function Home() {
  const { t } = useStudioLanguage();
  const tour = useTour();
  const { profile, loadingProfile } = useProfile();
  const { user } = useAuth();
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
      setEntries((entryRecords || []).filter((entry) => !entry.hidden));
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

  useEffect(() => {
    trackAppOpen(user?.id);
  }, []);

  const historyComplete = !!profile.history_complete;
  const confirmed = entries.filter((entry) => entry.status === 'confirmed');
  const draftCount = entries.filter((entry) => entry.status === 'draft').length;
  const busy = loading || loadingProfile;

  // Auto-start, once per account, and only for a studio that still has
  // something to learn from the ball: a name still missing or no story
  // captured yet. Anyone established only ever sees the summoner pill.
  useEffect(() => {
    if (busy || !user || !tour.ready || tour.hasRecord) return;
    const stepsDone = entries.length > 0 && !!(profile && profile.full_name);
    if (stepsDone) return;
    tour.start({ step: profile && profile.full_name ? 'studio' : 'identity' });
  }, [busy, user, profile, entries.length, tour]);

  return (
    <div>
      <StudioHero draftCount={loading ? 0 : draftCount} profile={profile} />

      <div className="mec-ticker">
        <div className="mec-tk">
          <b>{entries.length}</b>
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
          <b>{applications.length}</b>
          <span>{t('home.tickerResumes')}</span>
        </div>
      </div>

      {!busy && !tour.active && (
        <section className="flex justify-center">
          <button
            type="button"
            onClick={() => tour.start({ preview: true })}
            className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/40 px-5 py-2.5 text-[14px] text-foreground transition-colors hover:border-[#D4AF37]/50"
          >
            <Sparkles className="h-4 w-4 text-[#D4AF37]" />
            <span>{t('home.firstTimeQ')}</span>
            <span className="font-medium text-[#D4AF37]">{t('home.runWalkthrough')}</span>
          </button>
        </section>
      )}

      <div className="mec-work">
        <RecentApplications applications={applications.slice(0, 2)} />

        <section className="mec-panel">
          <div className="mec-eyebrow">{t('home.masterHistory')}</div>
          {busy ? (
            <div className="mec-load" style={{ marginTop: 12 }}>
              {t('home.loadingStudio')}
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