import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock } from 'lucide-react';
import { useStudioLanguage } from '@/lib/StudioLanguage';

const HERO_IMAGE = 'https://media.base44.com/images/public/6acfb4bf0fc7d7424c8470e5/5163f1c7d_generated_5d1d5b3a.jpg';

export default function StudioHero({ draftCount = 0 }) {
  const { t } = useStudioLanguage();
  return (
    <section className="mec-hero">
      <div>
        <div className="mec-eyebrow">{t('home.heroEyebrow')}</div>
        <h1 className="mec-h1">{t('home.heroTitle')}</h1>
        <p className="mec-body">{t('home.heroBody')}</p>

        <div className="mec-btns">
          <Link to="/tailor-application" className="mec-btn mec-gold">
            {t('common.tailorResume')}
          </Link>
          <Link to="/history" className="mec-btn mec-ghost">
            {t('home.captureHistory')}
          </Link>
        </div>

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
  );
}
