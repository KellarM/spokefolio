import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ChevronRight, FileText, Mic, User, X } from 'lucide-react';
import { useStudioLanguage } from '@/lib/StudioLanguage';
import { trackEvent } from '@/lib/analytics';

// localStorage never throws us into a crash: private mode and storage
// quotas are real, and a checklist that breaks the page teaches nothing.
const flag = {
  read: (key) => {
    try {
      return !!localStorage.getItem(key);
    } catch {
      return false;
    }
  },
  set: (key) => {
    try {
      localStorage.setItem(key, '1');
    } catch {
      // Private mode: the card simply reappears next visit. Harmless.
    }
  }
};

const dismissedKey = (userId) => `sf_checklist_dismissed:${userId || 'anon'}`;
const firedKey = (userId, step) => `sf_checklist_event:${userId || 'anon'}:${step}`;

// First-run guidance that teaches by watching, not by touring. Each row
// completes itself when the studio sees the real thing exist - an entry,
// a name, a résumé - so there is nothing to click through and nothing to
// skip past. When every row is real, the card is done and gets out of the way.
export default function FirstRunChecklist({ userId, ready, entriesCount, applicationsCount, hasIdentity }) {
  const { t } = useStudioLanguage();
  const [dismissed, setDismissed] = useState(() => flag.read(dismissedKey(userId)));

  const steps = [
    {
      key: 'story',
      done: entriesCount > 0,
      to: '/history',
      icon: Mic,
      title: t('checklist.storyTitle'),
      desc: t('checklist.storyDesc')
    },
    {
      key: 'identity',
      done: hasIdentity,
      to: '/profile',
      icon: User,
      title: t('checklist.identityTitle'),
      desc: t('checklist.identityDesc')
    },
    {
      key: 'firstResume',
      done: applicationsCount > 0,
      to: '/tailor-application',
      icon: FileText,
      title: t('checklist.resumeTitle'),
      desc: t('checklist.resumeDesc')
    }
  ];

  const doneCount = steps.filter((step) => step.done).length;
  const allDone = doneCount === steps.length;

  // Milestones fire once per account, not once per visit: the flag lives in
  // localStorage and the event joins the admin dashboard's engagement story.
  useEffect(() => {
    if (!ready) return;
    steps.forEach((step) => {
      const key = firedKey(userId, step.key);
      if (step.done && !flag.read(key)) {
        flag.set(key);
        trackEvent(`onboarding_step_${step.key}_done`);
      }
    });
    if (allDone) {
      const key = firedKey(userId, 'complete');
      if (!flag.read(key)) {
        flag.set(key);
        trackEvent('onboarding_complete');
      }
    }
  }, [ready, allDone, userId, entriesCount, applicationsCount, hasIdentity]);

  if (!ready || dismissed || allDone) return null;

  const hide = () => {
    flag.set(dismissedKey(userId));
    setDismissed(true);
    trackEvent('onboarding_dismissed');
  };

  return (
    <section className="mec-panel" aria-label={t('checklist.title')}>
      <div className="mec-rhead">
        <div>
          <div className="mec-eyebrow">{t('checklist.ofThree', { count: doneCount })}</div>
          <h2 className="mec-h2">{t('checklist.title')}</h2>
        </div>
        <button
          type="button"
          onClick={hide}
          aria-label={t('checklist.dismiss')}
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="h-4.5 w-4.5" />
        </button>
      </div>

      <div className="mt-4 space-y-2">
        {steps.map((step) => {
          const Icon = step.icon;
          const row = step.done ? (
            <div className="flex items-center gap-3 rounded-xl border border-[#D4AF37]/25 bg-[#D4AF37]/[0.06] px-4 py-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#D4AF37] text-[#0B0F17]">
                <Check className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-[14.5px] font-medium text-foreground/80">{step.title}</p>
                <p className="text-[12.5px] text-muted-foreground">{t('checklist.stepDone')}</p>
              </div>
            </div>
          ) : (
            <Link
              to={step.to}
              className="group flex items-center gap-3 rounded-xl border border-border/70 bg-background/40 px-4 py-3 transition-colors hover:border-[#D4AF37]/50"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors group-hover:border-[#D4AF37]/60 group-hover:text-[#D4AF37]">
                <Icon className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[14.5px] font-medium text-foreground">{step.title}</p>
                <p className="text-[12.5px] leading-snug text-muted-foreground">{step.desc}</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-[#D4AF37]" />
            </Link>
          );
          return <React.Fragment key={step.key}>{row}</React.Fragment>;
        })}
      </div>
    </section>
  );
}
