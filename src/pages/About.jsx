import React from 'react';
import { Link } from 'react-router-dom';
import PublicNav from '@/components/public/PublicNav';
import PublicFooter from '@/components/public/PublicFooter';

// A public page for visitors and search engines: what Spokefolio is, who it is
// for, and who builds it. No sign-in required to read it.
export default function About() {
  return (
    <div className="lnd">
      <PublicNav />

      <main className="mx-auto w-full max-w-[860px] px-6 py-16 lg:py-20">
        <p className="mec-eyebrow">Your career, told once</p>
        <h1 className="lnd-h1">About Spokefolio</h1>

        <div className="mt-6 space-y-5 text-[19px] leading-[1.75] text-[#c3cad8]">
          <p>
            Spokefolio is a career knowledge base and résumé studio. You tell it your work history
            once, by voice or by typing, and it keeps that history organized: your jobs, the dates,
            your skills, and the things you actually accomplished. From then on, every résumé is
            written from that one record of your career instead of from a blank template you fill in
            again for each application.
          </p>
          <p>
            When you paste a job posting, Spokefolio reads what the employer is asking for and
            rewrites your summary, skills and accomplishment wording around it, then drafts a cover
            letter to send with it. It works only from what you have told it. If something the
            posting asks for is missing from your history, it shows up as a gap you can prepare for
            rather than a claim you cannot defend in the interview.
          </p>
          <p>
            It is built for people who do the work: warehouse crews, drivers, trades, technicians and
            operations staff, and for anyone changing careers whose history is bigger than their
            last job title. The people most résumé sites build for last are the people this one was
            designed around.
          </p>
          <p>
            Spokefolio is made by XFH Game Studio, a small independent studio. We build it the way we
            would want to use it ourselves: free through 2026, then $15 a year, flat, with no trial,
            no auto-renewal and no fee at the download screen.
          </p>
        </div>

        <div className="lnd-btn-row mt-10">
          <Link to="/register" className="lnd-btn">
            Create your free account
          </Link>
          <Link to="/contact" className="lnd-btn-ghost">
            Contact us
          </Link>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}