import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock } from 'lucide-react';
import { useStudioLanguage } from '@/lib/StudioLanguage';

const HERO_IMAGE = 'https://media.base44.com/images/public/6acfb4bf0fc7d7424c8470e5/5163f1c7d_generated_5d1d5b3a.jpg';

export default function StudioHero({ draftCount = 0 }) {
  const { t } = useStudioLanguage();

  // The Step Order, numbered so the order is unmistakable: capture the
  // history, bring the reference files in, find the postings, then tailor.
  // The last step is the payoff, so it stays solid gold.
  const STEPS = [
    { n: 1, to: '/history', label: t('home.captureHistory') },
    { n: 2, to: '/documents', label: t('home.navUpload') },
    { n: 3, to: '/postings', label: t('nav.postings') },
    { n: 4, to: '/tailor-application', label: t('common.tailorResume'), gold: true }
  ];

  return (
    <>
      <section className="mec-hero">
        <div>
          <div className="mec-eyebrow">{t('home.heroEyebrow')}</div>
          <h1 className="mec-h1">{t('home.heroTitle')}</h1>
          <p className="mec-body">{t('home.heroBody')}</p>

          {draftCount > 0 && (
          <Link
            to="/history"
            className="mt-6 inline-flex items-center gap-2 font-body text-[16px] font-medium text-[#D4AF37] transition-opacity hover:opacity-80"
          >
            <Clock className="h-3.5 w-3.5" />
            {draftCount === 1
              ? t('home.draftLineSingular', { count: draftCount })
              : t('home.draftLinePlural', { count: draftCount })}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>

        <div className="mec-hp">
          <img src={HERO_IMAGE} alt="Tailored dark wool suit with brass watch" />
        </div>
      </section>

      {/* The four steps, edge to edge, numbered left to right. */}
      <section className="mec-steps" aria-label={t('home.stepsAria')}>
        {STEPS.map((step) => (
          <Link
            key={step.to}
            to={step.to}
            className={step.gold ? 'mec-step gold' : 'mec-step'}
          >
            <span className="mec-step-n">{step.n}</span>
            <span className="mec-step-label">{step.label}</span>
          </Link>
        ))}
      </section>
    </>
  );
}
