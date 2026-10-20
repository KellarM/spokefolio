import React from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';

// Public front door. Logged-out visitors land here from "/" (see ProtectedRoute in
// App.jsx: unauthenticated visitors see this page instead of being bounced to /welcome).
// Signed-in users go straight to the Overview.
//
// Note: apostrophes are typed as real characters (’) in the copy below. Do NOT use
// backslash-u escape sequences in JSX text: JSX renders them literally.

const DONT_LIST = [
  'No fee at the download screen',
  'No trial that turns into a subscription',
  'No auto-renewal of any kind, ever',
  'No template maze: one résumé, tailored, done',
  'No re-typing your history every time you visit',
  'No AI-invented experience: if it says you did it, you told us you did it'
];

const CONTRAST = [
  ['You build one document, once', 'You build one knowledge base, forever'],
  ['Re-type your history every session', 'Your history is already there'],
  ['Price appears at the download gate', 'Price on the front door'],
  ['Trial that renews every 4 weeks', '$15 a year. Flat. No auto-renewal'],
  ['650 templates to agonize over', 'One résumé that’s already right'],
  ['Generic AI phrases anyone could have', 'Every line comes from your real career']
];

const FAQ = [
  {
    q: 'Is this free, or “free”?',
    a: 'Free. Full stop, through 2026. In 2027 it’s $15 a year, flat, and we told you before you typed anything.'
  },
  {
    q: 'Do I pay to download my résumé?',
    a: 'No. Exports are free. That question exists because you’ve been burned before. We know.'
  },
  {
    q: 'Will it auto-renew?',
    a: 'There is nothing to auto-renew. $15 a year. You choose to pay it again, or you don’t.'
  },
  {
    q: 'Is it actually tailored, or just generic AI text?',
    a: 'Every line traces back to your own captured history. If you didn’t say it, we don’t write it.'
  },
  {
    q: 'What if my career isn’t fancy?',
    a: 'Then you’re the audience. Most of our users run warehouses, drive trucks, fix things, and run crews. Résumés for real jobs, written from real work.'
  }
];

const PERSONAS = [
  'Forklift operator shifting to dispatch',
  'Warehouse supervisor targeting operations manager',
  'Career changer who’s earned more than one résumé admits'
];

export default function Landing() {
  return (
    <div className="lnd">
      <nav className="lnd-nav">
        <div className="lnd-nav-in">
          <span className="lnd-wordmark">SPOKEFOLIO</span>
          <div className="lnd-nav-links">
            <Link to="/login" className="lnd-signin">Sign in</Link>
            <Link to="/register" className="lnd-btn">Create your account</Link>
          </div>
        </div>
      </nav>

      {/* HERO - the price is the headline */}
      <section className="lnd-hero">
        <div className="lnd-wrap">
          <p className="mec-eyebrow">The career knowledge base</p>
          <h1 className="lnd-h1">Your career, told once. Tailored everywhere.</h1>
          <p className="lnd-lede">
            Spokefolio remembers your career, then writes a résumé tailored to each job you apply
            for. Paste the posting. Get the résumé. That’s the whole product.
          </p>
          <div className="lnd-price-chip">
            <b>Free through 2026.</b> In 2027, if you wish to use the service, sign up for{' '}
            <b>$15 a year. Flat.</b>
          </div>
          <div className="lnd-btn-row">
            <Link to="/register" className="lnd-btn">Create your free account</Link>
            <Link to="/login" className="lnd-btn-ghost">Sign in</Link>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="lnd-section">
        <div className="lnd-wrap">
          <p className="mec-eyebrow">How it works</p>
          <h2 className="lnd-h2">Three moves. Then every job after is seconds.</h2>
          <div className="lnd-steps">
            <div className="lnd-step">
              <p className="lnd-step-num">1</p>
              <h3>Tell it once.</h3>
              <p>
                Speak or type your career. Spokefolio builds your knowledge base with your jobs,
                skills, wins and dates, then locks it in.
              </p>
            </div>
            <div className="lnd-step">
              <p className="lnd-step-num">2</p>
              <h3>Paste the job posting.</h3>
              <p>Any posting, any site. Spokefolio reads what the employer actually wants.</p>
            </div>
            <div className="lnd-step">
              <p className="lnd-step-num">3</p>
              <h3>Get the tailored résumé.</h3>
              <p>
                Written from your real history, matched to that job, ready to send. Not a template
                you fight. A résumé that’s already right.
              </p>
            </div>
          </div>
          <p className="lnd-note lnd-note-center">
            Every other site makes you re-type your history into their boxes. We ask once, and then
            we stop asking.
          </p>
        </div>
      </section>

      {/* CONTRAST */}
      <section className="lnd-section">
        <div className="lnd-wrap">
          <p className="mec-eyebrow">The difference</p>
          <h2 className="lnd-h2">
            You’ve already used this product.
            <br />
            It was wearing a different logo.
          </h2>
          <p className="lnd-lede lnd-lede-top">
            Here is every résumé site you’ve ever tried: a template gallery, a box-by-box wizard,
            forty-five minutes of re-typing your own life, and then, at the only moment that
            matters, a screen asking for payment to download the thing you just built. Different
            brands. Same machine. It’s not an accident. The gate is the product.
          </p>
          <div className="lnd-table-wrap">
            <table className="lnd-table">
              <thead>
                <tr>
                  <th className="lnd-th-them">The category</th>
                  <th className="lnd-th-us">Spokefolio</th>
                </tr>
              </thead>
              <tbody>
                {CONTRAST.map(([them, us]) => (
                  <tr key={them}>
                    <td>{them}</td>
                    <td className="lnd-td-us">{us}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* HONESTY LIST */}
      <section className="lnd-section">
        <div className="lnd-wrap">
          <p className="mec-eyebrow">Honesty</p>
          <h2 className="lnd-h2">Read this part twice.</h2>
          <div className="lnd-dont-grid">
            {DONT_LIST.map((item) => (
              <div className="lnd-dont" key={item}>
                <Check size={17} strokeWidth={2.4} /> {item}
              </div>
            ))}
          </div>
          <p className="lnd-confession">
            Everything on this list is a standard feature of our industry. We consider that a
            confession, not a marketing strategy.
          </p>
        </div>
      </section>

      {/* PRICING */}
      <section className="lnd-section">
        <div className="lnd-wrap">
          <p className="mec-eyebrow">Pricing</p>
          <h2 className="lnd-h2">The price. On the front door. Where it should be.</h2>
          <div className="lnd-plans">
            <div className="lnd-plan">
              <p className="lnd-plan-when">Now</p>
              <p className="lnd-plan-amount">Free</p>
              <p>Every feature, every export, through the end of 2026.</p>
            </div>
            <div className="lnd-plan">
              <p className="lnd-plan-when">2027</p>
              <p className="lnd-plan-amount">
                $15 <small>a year. Flat.</small>
              </p>
              <p>
                If you wish to use the service, sign up for $15 a year. No subscription. No
                auto-renewal.
              </p>
              <p className="lnd-fine">
                We are not pretending the free year isn’t a customer acquisition cost. It is. It’s
                cheaper than our competitors’ refund department.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* WHO IT'S FOR */}
      <section className="lnd-section">
        <div className="lnd-wrap">
          <p className="mec-eyebrow">Who it’s for</p>
          <h2 className="lnd-h2">Built for people who actually do the work.</h2>
          <p className="lnd-lede lnd-lede-top">
            Warehouse, trades, drivers, operations: the people every résumé site builds for last.
            Career changers welcome. Your history is bigger than your last job title.
          </p>
          <div className="lnd-chips">
            {PERSONAS.map((chip) => (
              <span className="lnd-chip" key={chip}>{chip}</span>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="lnd-section">
        <div className="lnd-wrap">
          <p className="mec-eyebrow">Fair questions</p>
          <h2 className="lnd-h2">The questions you’ve learned to ask.</h2>
          <div className="lnd-faq">
            {FAQ.map(({ q, a }) => (
              <div className="lnd-qa" key={q}>
                <h3>{q}</h3>
                <p>{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="lnd-final">
        <div className="lnd-wrap">
          <h2 className="lnd-h2">Tell your career once.</h2>
          <p className="lnd-note lnd-note-tight">Every job after this is seconds.</p>
          <Link to="/register" className="lnd-btn">Create your free account</Link>
          <p className="lnd-fine lnd-fine-top">
            Free through 2026. Then $15 a year. Flat. You already know, because we told you first.
          </p>
        </div>
      </section>

      <footer className="lnd-footer">
        <div className="lnd-wrap lnd-foot-in">
          <span className="lnd-wordmark">SPOKEFOLIO</span>
          <p>The career knowledge base · Made by XFH Game Studio</p>
        </div>
      </footer>
    </div>
  );
}
