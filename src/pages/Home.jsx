import React, { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useSearchParams } from 'react-router-dom';
import useProfile from '@/hooks/useProfile';
import { trackAppOpen } from '@/lib/analytics';
import { useAuth } from '@/lib/AuthContext';
import StudioHero from '@/components/home/StudioHero';
import FirstRunChecklist, { dismissedKey } from '@/components/home/FirstRunChecklist';
import { Sparkles } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';
import RecentApplications from '@/components/home/RecentApplications';
import { useStudioLanguage } from '@/lib/StudioLanguage';

export default function Home() {
  const { t } = useStudioLanguage();
  // ?onboarding=1 previews the first-run card with every step pending -
  // for a studio this full, that is the only way to see what a new
  // signup sees, without burning an email on a test account.
  const [searchParams, setSearchParams] = useSearchParams();
  const onboardingPreview = searchParams.get('onboarding') === '1';
  const { user } = useAuth();

  // The checklist's dismissal lives here so this page knows, at all times,
  // whether the card is on screen - and can offer the 'first time' trigger
  // at exactly the moments it is not.
  const checklistUser = onboardingPreview ? 'preview' : user?.id;
  const [checklistDismissed, setChecklistDismissed] = useState(false);
  useEffect(() => {
    try {
      setChecklistDismissed(!!localStorage.getItem(dismissedKey(checklistUser)));
    } catch {
      setChecklistDismissed(false);
    }
  }, [checklistUser]);
  const { profile, loadingProfile } = useProfile();
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

      {(() => {
        // The card is on screen when the data is loaded, nobody has dismissed
        // it, and not every step is already real (a full studio never needs
        // it). Preview mode always shows it.
        const stepsDone =
          entries.length > 0 && !!(profile && profile.full_name) && applications.length > 0;
        const cardVisible =
          (onboardingPreview ? true : !busy) && !checklistDismissed && (onboardingPreview || !stepsDone);

        const startWalkthrough = () => {
          // A fresh runthrough clears any old dismissal under the preview key,
          // so the trigger always works, no matter how it was left before.
          try {
            localStorage.removeItem(dismissedKey('preview'));
          } catch {
            // Private mode: the flag simply is not there to remove.
          }
          setChecklistDismissed(false);
          setSearchParams(
            (params) => {
              const next = new URLSearchParams(params);
              next.set('onboarding', '1');
              return next;
            },
            { replace: true }
          );
        };

        const dismissChecklist = () => {
          try {
            localStorage.setItem(dismissedKey(checklistUser), '1');
          } catch {
            // Private mode: the card reappears next visit. Harmless.
          }
          setChecklistDismissed(true);
          if (!onboardingPreview) trackEvent('onboarding_dismissed');
          if (onboardingPreview) setSearchParams({}, { replace: true });
        };

        return cardVisible ? (
          <FirstRunChecklist
            userId={onboardingPreview ? 'preview' : user?.id}
            ready={onboardingPreview ? true : !busy}
            preview={onboardingPreview}
            entriesCount={onboardingPreview ? 0 : entries.length}
            applicationsCount={onboardingPreview ? 0 : applications.length}
            hasIdentity={onboardingPreview ? false : !!(profile && profile.full_name)}
            dismissed={checklistDismissed}
            onDismiss={dismissChecklist}
          />
        ) : onboardingPreview || busy ? null : (
          <section className="flex justify-center">
            <button
              type="button"
              onClick={startWalkthrough}
              className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/40 px-5 py-2.5 text-[14px] text-foreground transition-colors hover:border-[#D4AF37]/50"
            >
              <Sparkles className="h-4 w-4 text-[#D4AF37]" />
              <span>{t('home.firstTimeQ')}</span>
              <span className="font-medium text-[#D4AF37]">{t('home.runWalkthrough')}</span>
            </button>
          </section>
        );
      })()}

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