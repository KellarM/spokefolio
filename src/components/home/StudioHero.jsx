import React, { useLayoutEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock } from 'lucide-react';
import { useStudioLanguage } from '@/lib/StudioLanguage';

// The greeting addresses the client the way they asked to be addressed: their
// honorific with their surname when they chose one, their first name when not.
// The honorific is always what the client declared — never guessed.
function greetingName(profile) {
  const parts = String(profile?.full_name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '';
  const honorific = String(profile?.honorific || '').trim();
  if (honorific) return `${honorific} ${parts[parts.length - 1]}`;
  return parts[0];
}

function greetingKey() {
  const hour = new Date().getHours();
  if (hour < 12) return 'home.greetMorning';
  if (hour < 17) return 'home.greetAfternoon';
  return 'home.greetEvening';
}

const HERO_IMAGE = 'https://media.base44.com/images/public/6acfb4bf0fc7d7424c8470e5/5163f1c7d_generated_5d1d5b3a.jpg';

export default function StudioHero({ draftCount = 0, profile }) {
  const { t } = useStudioLanguage();
  const name = greetingName(profile);
  const greeting = `${t(greetingKey())}${name ? `, ${name}.` : '.'}`;

  // The bubble is the width of the headline below it; the type grows to
  // fill the bubble. Measured against the real rendered width so any name
  // and any language fills it exactly - long greetings ease down, short
  // ones swell up, the bubble is always edge to edge with its words.
  const greetRef = useRef(null);
  const lineRef = useRef(null);
  useLayoutEffect(() => {
    const pill = greetRef.current;
    const line = lineRef.current;
    if (!pill || !line) return undefined;

    const BASE = 30; // px, matches the base size in the stylesheet
    const MIN = 20;
    const MAX = 64;
    let frame = 0;
    let lastWidth = -1;

    const fit = (force) => {
      frame = 0;
      const width = pill.clientWidth;
      // Only a change of width asks for a new fit. Growing the type makes the
      // pill taller, and answering that height change would ask for another
      // fit forever - the browser reports exactly that as a ResizeObserver loop.
      if (!force && width === lastWidth) return;
      lastWidth = width;
      pill.style.fontSize = `${BASE}px`;
      const wave = pill.querySelector('.mec-greet-wave');
      const reserved = 40 /* pill side padding */ + (wave ? wave.offsetWidth + 10 : 0);
      const room = width - reserved;
      const natural = line.scrollWidth;
      if (!room || !natural) return;
      const size = Math.min(MAX, Math.max(MIN, (BASE * room) / natural));
      pill.style.fontSize = `${size}px`;
    };

    // The fit runs on the next frame, never inside the observer's own callback,
    // so the size it writes is measured fresh instead of mid-delivery.
    const schedule = (force) => {
      if (frame) return;
      frame = requestAnimationFrame(() => fit(force));
    };

    schedule(true);
    const watcher = new ResizeObserver(() => schedule(false));
    watcher.observe(pill);
    // A webfont landing changes how wide the words are at the same pill width.
    document.fonts?.ready?.then(() => schedule(true)).catch(() => {});
    return () => {
      if (frame) cancelAnimationFrame(frame);
      watcher.disconnect();
    };
  }, [greeting]);

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
          <div className="mec-greet" ref={greetRef} role="text" aria-label={greeting}>
            <span className="mec-greet-wave" aria-hidden="true">&#128075;</span>
            <span className="mec-greet-line" ref={lineRef}>
              {t(greetingKey())}
              {name ? <>,&nbsp;<b>{name}</b>.</> : '.'}
            </span>
          </div>
          <h1 className="mec-h1">{t('home.heroTitle')}</h1>
          <p className="mec-body" data-tour="overview-copy">{t('home.heroBody')}</p>

          {draftCount > 0 && (
          <Link
            to="/history"
            className="mt-5 inline-flex items-center gap-2 font-body text-[15px] font-medium text-[#D4AF37] transition-opacity hover:opacity-80"
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
      <section className="mec-steps" data-tour="overview-steps" aria-label={t('home.stepsAria')}>
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