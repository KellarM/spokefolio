import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Mic, Search, Upload } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import useProfile from '@/hooks/useProfile';
import { trackAppOpen } from '@/lib/analytics';
import { useAuth } from '@/lib/AuthContext';
import StudioHero from '@/components/home/StudioHero';
import RecentApplications from '@/components/home/RecentApplications';
import { useStudioLanguage } from '@/lib/StudioLanguage';

export default function Home() {
  const { t } = useStudioLanguage();
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

  return (
    <div>
      <StudioHero draftCount={loading ? 0 : draftCount} />

      {/* The four working rooms, one click away, in Michael's order. */}
      <section className="mt-10 grid grid-cols-1 gap-3 px-[80px] sm:grid-cols-2 lg:grid-cols-4">
        {[
          { to: '/history', icon: Mic, label: t('home.captureHistory') },
          { to: '/documents', icon: Upload, label: t('home.navUpload') },
          { to: '/postings', icon: Search, label: t('nav.postings') },
          { to: '/applications', icon: FileText, label: t('nav.applications') }
        ].map(({ to, icon: Icon, label }) => (
          <Link
            key={to}
            to={to}
            className="group flex items-center gap-3 rounded-xl border border-[#D4AF37]/30 bg-[#161E2E] px-4 py-3.5 transition-colors hover:border-[#D4AF37]/70 hover:bg-[#1B2436]"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#D4AF37]/30 bg-[#D4AF37]/10">
              <Icon className="h-4 w-4 text-[#D4AF37]" />
            </span>
            <span className="font-body text-[14.5px] font-medium text-[#F9FAFB] transition-colors group-hover:text-[#D4AF37]">
              {label}
            </span>
          </Link>
        ))}
      </section>

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