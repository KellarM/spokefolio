import React from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import LanguageSelect, { getStoredLanguage, storeLanguage } from '@/components/LanguageSelect';

// Public front door. Logged-out visitors land here from "/" (see ProtectedRoute in
// App.jsx: unauthenticated visitors see this page at the root URL.)
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
'No AI-invented experience: if it says you did it, you told us you did it'];


const CONTRAST = [
['You build one document, once', 'You build one knowledge base, forever'],
['Re-type your history every session', 'Your history is already there'],
['Price appears at the download gate', 'Price on the front door'],
['Trial that renews every 4 weeks', '$15 a year. Flat. No auto-renewal'],
['650 templates to agonize over', 'One résumé that’s already right'],
['Generic AI phrases anyone could have', 'Every line comes from your real career']];


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
}];


const PERSONAS = [
'Forklift operator shifting to dispatch',
'Warehouse supervisor targeting operations manager',
'Career changer who’s earned more than one résumé admits'];


/* The Speak-O-Phone: the Spokefolio voice mark. */
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
  const [language, setLanguage] = React.useState(getStoredLanguage());

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
              Language
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
            <Link to="/about" className="lnd-signin">About</Link>
            <Link to="/contact" className="lnd-signin">Contact</Link>
            <Link to="/login" className="lnd-signin">Sign in</Link>
            <Link to="/register" className="lnd-btn">Create your account</Link>
          </div>
        </div>
      </nav>

      {/* HERO - the price is the headline */}
      <section className="lnd-hero">
        <div className="lnd-wrap">
          <p className="mec-eyebrow">Not just another résumé builder</p>
          <h1 className="lnd-h1">
            This is a résumé <em>tailored</em> to the JOB Application.
          </h1>
          <p className="lnd-tagline text-xs">Your career, told once. Tailored everywhere.</p>
          <p className="lnd-lede">
            Spokefolio is a career knowledge base. Tell it your history once, and it writes a
            résumé tailored to each job you apply for. No wizard. No gate. No subscription trap.
          </p>
          <div className="lnd-promise-row">
            <div className="lnd-price-chip">
              <b>Free through 2026.</b> In 2027, if you wish to use the service, sign up for{' '}
              <b>$15 a year. Flat.</b>
            </div>
            <div className="lnd-seal" aria-label="The Spokefolio pledge">
              <div className="lnd-seal-inner">
                <p className="lnd-seal-title">The Spokefolio Pledge</p>
                <p>No hidden fees</p>
                <p>No auto-renewal</p>
                <p>No download gate</p>
              </div>
            </div>
          </div>
          <div className="lnd-btn-row">
            <Link to="/register" className="lnd-btn">Create your free account</Link>
            <Link to="/login" className="lnd-btn-ghost">Sign in</Link>
          </div>
          <div className="lnd-sins" aria-label="What you will not find here">
            <span className="lnd-sin">Hidden fees</span>
            <span className="lnd-sin">Auto-renewing trials</span>
            <span className="lnd-sin">Re-typing your history</span>
            <span className="lnd-sin">Template mazes</span>
            <span className="lnd-not">None of that here.</span>
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

      {/* WHAT'S INSIDE */}
      <section className="lnd-section">
        <div className="lnd-wrap">
          <p className="mec-eyebrow">What’s inside</p>
          <h2 className="lnd-h2">Four tools. One memory.</h2>
          <p className="lnd-lede lnd-lede-top">
            Your account is not a template gallery. It is one knowledge base with four things
            built on top of it, and every one of them runs on the career you told us once.
          </p>
          <div className="lnd-features">
            <div className="lnd-feat">
              <p className="lnd-feat-tag">The foundation</p>
              <h3>Your career knowledge base</h3>
              <p>
                Everything you tell it, kept and organized: jobs, skills, wins, dates. The story
                of what you did, in your words, ready for every job after.
              </p>
            </div>
            <div className="lnd-feat">
              <p className="lnd-feat-tag">Résumés</p>
              <h3>Custom tailoring for every application</h3>
              <p>
                Paste the posting and choose what to emphasize. Your résumé reshapes itself
                around that job. Different job, different résumé, same one career.
              </p>
            </div>
            <div className="lnd-feat">
              <p className="lnd-feat-tag">Cover letters</p>
              <h3>Letters that sound like you</h3>
              <p>
                Not a template with your name swapped in. A cover letter built from what you
                actually did, matched to the job you actually want.
              </p>
            </div>
            <div className="lnd-feat">
              <p className="lnd-feat-tag">Practice</p>
              <h3>The interview mock-up</h3>
              <p>
                A rehearsal drill grounded in your own history, not generic prompts. You practise
                the answers you will actually have to give.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CONTRAST */}
      <section className="lnd-section">
        <div className="lnd-wrap">
          <p className="mec-eyebrow">Sound familiar?</p>
          <h2 className="lnd-h2">
            You’ve filled in these boxes before.
            <br />
            Then came the invoice.
          </h2>
          <p className="lnd-lede lnd-lede-top">
            This is not the same as every résumé site you’ve ever tried: a template gallery, a box-by-box wizard,
            forty-five minutes of re-typing your own life, and then, at the only moment that
            matters, a screen asking for payment to download the thing you just built. Different
            brands. Same machine. It’s not an accident. The gate is the product.
          </p>
          <div className="lnd-tried">
            <p className="lnd-tried-label">Tried these?</p>
            <p className="lnd-tried-names">
              Zety <span>·</span> Resume-Now <span>·</span> MyPerfectResume <span>·</span> Resume
              Genius <span>·</span> Canva
            </p>
          </div>
          <div className="lnd-table-wrap">
            <table className="lnd-table">
              <thead>
                <tr>
                  <th className="lnd-th-them">The category</th>
                  <th className="lnd-th-us">Spokefolio</th>
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
          <p className="mec-eyebrow">Honesty</p>
          <h2 className="lnd-h2">Read this part twice.</h2>
          <div className="lnd-dont-grid">
            {DONT_LIST.map((item) =>
            <div className="lnd-dont" key={item}>
                <Check size={17} strokeWidth={2.4} /> {item}
              </div>
            )}
          </div>
          <div className="lnd-zero-band">
            <div className="lnd-zero"><b>0</b><span>hidden fees</span></div>
            <div className="lnd-zero"><b>0</b><span>auto-renewals</span></div>
            <div className="lnd-zero"><b>0</b><span>re-typing sessions</span></div>
            <div className="lnd-zero"><b>1</b><span>career remembered</span></div>
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
          <div className="lnd-receipt" aria-label="Spokefolio pricing statement">
            <p className="lnd-r-head">SPOKEFOLIO</p>
            <p className="lnd-r-sub">Pricing statement · Through Dec 31, 2026</p>
            <div className="lnd-r-line"><span>Résumé export</span><span>$0</span></div>
            <div className="lnd-r-line"><span>Job tailoring</span><span>$0</span></div>
            <div className="lnd-r-line"><span>Career knowledge base</span><span>$0</span></div>
            <div className="lnd-r-line"><span>Cover letter</span><span>$0</span></div>
            <div className="lnd-r-total"><span>TOTAL</span><span>$0.00</span></div>
            <p className="lnd-r-note">No trial. No lock-in. No card on file.</p>
            <p className="lnd-r-thanks">Thank you. No, really.</p>
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
            {PERSONAS.map((chip) =>
            <span className="lnd-chip" key={chip}>{chip}</span>
            )}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="lnd-section">
        <div className="lnd-wrap">
          <p className="mec-eyebrow">Fair questions</p>
          <h2 className="lnd-h2">The questions you’ve learned to ask.</h2>
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
          <span className="lnd-brand">
            <SpeakOPhone />
            <span className="lnd-wordmark">SPOKEFOLIO</span>
          </span>
          <p>
            <Link to="/about" className="lnd-signin">About</Link> ·{' '}
            <Link to="/contact" className="lnd-signin">Contact</Link> · The career knowledge base ·
            Made by XFH Game Studio
          </p>
        </div>
      </footer>
    </div>);

}