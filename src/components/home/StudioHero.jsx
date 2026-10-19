import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock } from 'lucide-react';

const HERO_IMAGE = 'https://media.base44.com/images/public/6acfb4bf0fc7d7424c8470e5/5163f1c7d_generated_5d1d5b3a.jpg';

export default function StudioHero({ draftCount = 0 }) {
  return (
    <section className="mec-hero">
      <div>
        <div className="mec-eyebrow">Spokefolio Personal Resume Studio</div>
        <h1 className="mec-h1">
          Turn your real work history into a résumé written for the job you want.
        </h1>
        <p className="mec-body">
          Capture your career by voice, one entry at a time. Then paste any job posting and get a résumé shaped around it,
          ready to download as a Word document.
        </p>

        <div className="mec-btns">
          <Link to="/new-application" className="mec-btn mec-gold">
            Tailor a résumé
          </Link>
          <Link to="/history" className="mec-btn mec-ghost">
            Capture career history
          </Link>
        </div>

        {draftCount > 0 && (
          <Link
            to="/history"
            className="mt-6 inline-flex items-center gap-2 font-body text-[16px] font-medium text-[#D4AF37] transition-opacity hover:opacity-80"
          >
            <Clock className="h-3.5 w-3.5" />
            {draftCount} {draftCount === 1 ? 'entry is' : 'entries are'} still in progress — pick up where you left off
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