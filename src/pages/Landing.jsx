import React from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import LanguageSelect, { getStoredLanguage, storeLanguage, normalizeLanguage } from '@/components/LanguageSelect';
import { landingStrings } from '@/i18n/landing';

// Public front door. Logged-out visitors land here from "/" (see ProtectedRoute in
// App.jsx: unauthenticated visitors see this page at the root URL.)
// Signed-in users go straight to the Overview.
//
// Every piece of copy lives in the catalog under src/i18n/landing. The page
// renders in the language chosen in the nav: the catalog plus, when one
// exists, the dictionary for that language. A language without a dictionary
// shows English, never a machine-guessed half-translation.
//
// Note: apostrophes are typed as real characters (’) in the copy below. Do NOT use
// backslash-u escape sequences in JSX text: JSX renders them literally.

const SpeakOPhone = () => (
  <svg
    className="lnd-phone"
    viewBox="0 0 64 64"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-label="Speak-O-Phone"
  >
    <ellipse cx="32" cy="53" rx="15" ry="4" />
    <ellipse cx="32" cy="49" rx="11" ry="3" />
    <path d="M32 49 V27" />
    <path d="M27 27 h10" />
    <path d="M29 27 L25 13" />
    <path d="M35 27 L39 13" />
    <ellipse cx="32" cy="12" rx="8.5" ry="3" />
    <path d="M16 7 q-4 5 0 10" />
    <path d="M48 7 q4 5 0 10" />
  </svg>
);

export default function Landing() {
  const [language, setLanguage] = React.useState(normalizeLanguage(getStoredLanguage()));

  const t = landingStrings(language);

  const DONT_LIST = [t.honD1, t.honD2, t.honD3, t.honD4, t.honD5, t.honD6];

  const CONTRAST = [
    [t.conR1a, t.conR1b],
    [t.conR2a, t.conR2b],
    [t.conR3a, t.conR3b],
    [t.conR4a, t.conR4b],
    [t.conR5a, t.conR5b],
    [t.conR6a, t.conR6b]
  ];

  const FAQ = [
    { q: t.faqQ1, a: t.faqA1 },
    { q: t.faqQ2, a: t.faqA2 },
    { q: t.faqQ3, a: t.faqA3 },
    { q: t.faqQ4, a: t.faqA4 },
    { q: t.faqQ5, a: t.faqA5 }
  ];

  const PERSONAS = [t.whoP1, t.whoP2, t.whoP3];

  return (
    <div className="lnd">
      <nav className="lnd-nav">
        <div className="lnd-nav-in">
          <span className="lnd-brand">
            <SpeakOPhone />
            <span className="lnd-wordmark">SPOKEFOLIO</span>
          </span>
          <div className="lnd-lang">
            <label htmlFor="landing-language" className="lnd-lang-label">
              {t.langLabel}
            </label>
            <LanguageSelect
              id="landing-language"
              value={language}
              onChange={(value) => {
                setLanguage(value);
                storeLanguage(value);
              }}
              className="lnd-lang-input"
            />
          </div>
          <div className="lnd-nav-links">
            <Link to="/about" className="lnd-signin">{t.navAbout}</Link>
            <Link to="/contact" className="lnd-signin">{t.navContact}</Link>
            <Link to="/login" className="lnd-signin">{t.navSignin}</Link>
            <Link to="/register" className="lnd-btn">{t.navCreate}</Link>
          </div>
        </div>
      </nav>

      {/* HERO - the price is the headline */}
      <section className="lnd-hero">
        <div className="lnd-wrap">
          <p className="mec-eyebrow">{t.heroEyebrow}</p>
          <h1 className="lnd-h1">
            {t.heroH1Pre} <em>{t.heroH1Em}</em> {t.heroH1Post}
          </h1>
          <p className="lnd-tagline text-xs">{t.heroTagline}</p>
          <p className="lnd-lede">{t.heroLede}</p>
          <div className="lnd-promise-row">
            <div className="lnd-price-chip">
              <b>{t.heroPriceFree}</b> {t.heroPriceMid}
            </div>
            <div className="lnd-seal" aria-label={t.heroSealLabel}>
              <div className="lnd-seal-inner">
                <p className="lnd-seal-title">{t.heroSealTitle}</p>
                <p>{t.heroSeal1}</p>
                <p>{t.heroSeal2}</p>
                <p>{t.heroSeal3}</p>
              </div>
            </div>
          </div>
          <div className="lnd-btn-row">
            <Link to="/register" className="lnd-btn">{t.heroCta}</Link>
            <Link to="/login" className="lnd-btn-ghost">{t.heroSignin}</Link>
          </div>
          <div className="lnd-sins" aria-label={t.heroSinsLabel}>
            <span className="lnd-sin">{t.heroSin1}</span>
            <span className="lnd-sin">{t.heroSin2}</span>
            <span className="lnd-sin">{t.heroSin3}</span>
            <span className="lnd-sin">{t.heroSin4}</span>
            <span className="lnd-not">{t.heroSinNot}</span>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="lnd-section">
        <div className="lnd-wrap">
          <p className="mec-eyebrow">{t.howEyebrow}</p>
          <h2 className="lnd-h2">{t.howH2}</h2>
          <div className="lnd-steps">
            <div className="lnd-step">
              <p className="lnd-step-num">1</p>
              <h3>{t.howS1H}</h3>
              <p>{t.howS1P}</p>
            </div>
            <div className="lnd-step">
              <p className="lnd-step-num">2</p>
              <h3>{t.howS2H}</h3>
              <p>{t.howS2P}</p>
            </div>
            <div className="lnd-step">
              <p className="lnd-step-num">3</p>
              <h3>{t.howS3H}</h3>
              <p>{t.howS3P}</p>
            </div>
          </div>
          <p className="lnd-note lnd-note-center">{t.howNote}</p>
        </div>
      </section>

      {/* WHAT'S INSIDE */}
      <section className="lnd-section">
        <div className="lnd-wrap">
          <p className="mec-eyebrow">{t.inEyebrow}</p>
          <h2 className="lnd-h2">{t.inH2}</h2>
          <p className="lnd-lede lnd-lede-top">{t.inLede}</p>
          <div className="lnd-features">
            <div className="lnd-feat">
              <p className="lnd-feat-tag">{t.inF1Tag}</p>
              <h3>{t.inF1H}</h3>
              <p>{t.inF1P}</p>
            </div>
            <div className="lnd-feat">
              <p className="lnd-feat-tag">{t.inF2Tag}</p>
              <h3>{t.inF2H}</h3>
              <p>{t.inF2P}</p>
            </div>
            <div className="lnd-feat">
              <p className="lnd-feat-tag">{t.inF3Tag}</p>
              <h3>{t.inF3H}</h3>
              <p>{t.inF3P}</p>
            </div>
            <div className="lnd-feat">
              <p className="lnd-feat-tag">{t.inF4Tag}</p>
              <h3>{t.inF4H}</h3>
              <p>{t.inF4P}</p>
            </div>
          </div>
        </div>
      </section>

      {/* CONTRAST */}
      <section className="lnd-section">
        <div className="lnd-wrap">
          <p className="mec-eyebrow">{t.conEyebrow}</p>
          <h2 className="lnd-h2">
            {t.conH2a}
            <br />
            {t.conH2b}
          </h2>
          <p className="lnd-lede lnd-lede-top">{t.conLede}</p>
          <div className="lnd-tried">
            <p className="lnd-tried-label">{t.conTried}</p>
            <p className="lnd-tried-names">
              Zety <span>·</span> Resume-Now <span>·</span> MyPerfectResume <span>·</span> Resume
              Genius <span>·</span> Canva
            </p>
          </div>
          <div className="lnd-table-wrap">
            <table className="lnd-table">
              <thead>
                <tr>
                  <th className="lnd-th-them">{t.conThThem}</th>
                  <th className="lnd-th-us">{t.conThUs}</th>
                </tr>
              </thead>
              <tbody>
                {CONTRAST.map(([them, us]) =>
                <tr key={them}>
                    <td>{them}</td>
                    <td className="lnd-td-us">{us}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* HONESTY LIST */}
      <section className="lnd-section">
        <div className="lnd-wrap">
          <p className="mec-eyebrow">{t.honEyebrow}</p>
          <h2 className="lnd-h2">{t.honH2}</h2>
          <div className="lnd-dont-grid">
            {DONT_LIST.map((item) =>
            <div className="lnd-dont" key={item}>
                <Check size={17} strokeWidth={2.4} /> {item}
              </div>
            )}
          </div>
          <div className="lnd-zero-band">
            <div className="lnd-zero"><b>0</b><span>{t.honZ1}</span></div>
            <div className="lnd-zero"><b>0</b><span>{t.honZ2}</span></div>
            <div className="lnd-zero"><b>0</b><span>{t.honZ3}</span></div>
            <div className="lnd-zero"><b>1</b><span>{t.honZ4}</span></div>
          </div>
          <p className="lnd-confession">{t.honConfession}</p>
        </div>
      </section>

      {/* PRICING */}
      <section className="lnd-section">
        <div className="lnd-wrap">
          <p className="mec-eyebrow">{t.prEyebrow}</p>
          <h2 className="lnd-h2">{t.prH2}</h2>
          <div className="lnd-plans">
            <div className="lnd-plan">
              <p className="lnd-plan-when">{t.prNow}</p>
              <p className="lnd-plan-amount">{t.prFree}</p>
              <p>{t.prNowP}</p>
              <p className="lnd-fine">{t.prFine}</p>
            </div>
          </div>
          <div className="lnd-receipt" aria-label={t.rSub}>
            <p className="lnd-r-head">{t.rHead}</p>
            <p className="lnd-r-sub">{t.rSub}</p>
            <div className="lnd-r-line"><span>{t.rL1}</span><span>$0</span></div>
            <div className="lnd-r-line"><span>{t.rL2}</span><span>$0</span></div>
            <div className="lnd-r-line"><span>{t.rL3}</span><span>$0</span></div>
            <div className="lnd-r-line"><span>{t.rL4}</span><span>$0</span></div>
            <div className="lnd-r-total"><span>{t.rTotal}</span><span>$0.00</span></div>
            <p className="lnd-r-note">{t.rNote}</p>
            <p className="lnd-r-thanks">{t.rThanks}</p>
          </div>
        </div>
      </section>

      {/* WHO IT'S FOR */}
      <section className="lnd-section">
        <div className="lnd-wrap">
          <p className="mec-eyebrow">{t.whoEyebrow}</p>
          <h2 className="lnd-h2">{t.whoH2}</h2>
          <p className="lnd-lede lnd-lede-top">{t.whoLede}</p>
          <div className="lnd-chips">
            {PERSONAS.map((chip) =>
            <span className="lnd-chip" key={chip}>{chip}</span>
            )}
          </div>
        </div>
      </section>

      {/* ACCESSIBILITY */}
      <section className="lnd-section">
        <div className="lnd-wrap">
          <p className="mec-eyebrow">{t.accEyebrow}</p>
          <h2 className="lnd-h2">{t.accH2}</h2>
          <p className="lnd-lede lnd-lede-top">{t.accLede1}</p>
          <p className="lnd-lede">{t.accLede2}</p>
          <p className="lnd-lede">{t.accLede3}</p>
          <p className="lnd-fine">
            <a href="mailto:KellarM@xfhgamestudioltd.com">KellarM@xfhgamestudioltd.com</a>
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="lnd-section">
        <div className="lnd-wrap">
          <p className="mec-eyebrow">{t.faqEyebrow}</p>
          <h2 className="lnd-h2">{t.faqH2}</h2>
          <div className="lnd-faq">
            {FAQ.map(({ q, a }) =>
            <div className="lnd-qa" key={q}>
                <h3>{q}</h3>
                <p>{a}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="lnd-final">
        <div className="lnd-wrap">
          <h2 className="lnd-h2">{t.finH2}</h2>
          <p className="lnd-note lnd-note-tight">{t.finNote}</p>
          <Link to="/register" className="lnd-btn">{t.finCta}</Link>
          <p className="lnd-fine lnd-fine-top">{t.finFine}</p>
        </div>
      </section>

      <footer className="lnd-footer">
        <div className="lnd-wrap lnd-foot-in">
          <span className="lnd-brand">
            <SpeakOPhone />
            <span className="lnd-wordmark">SPOKEFOLIO</span>
          </span>
          <p>
            <Link to="/about" className="lnd-signin">{t.navAbout}</Link> ·{' '}
            <Link to="/contact" className="lnd-signin">{t.navContact}</Link> · {t.footKb} ·
            {t.footMade}
          </p>
        </div>
      </footer>
    </div>);

}
