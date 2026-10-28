import React from 'react';
import PublicNav from '@/components/public/PublicNav';
import PublicFooter from '@/components/public/PublicFooter';

// Public contact page. The address and number here are the same ones published
// in the privacy policy and terms of service.
export default function Contact() {
  return (
    <div className="lnd">
      <PublicNav />

      <main className="mx-auto w-full max-w-[860px] px-6 py-16 lg:py-20">
        <p className="mec-eyebrow">Talk to a person</p>
        <h1 className="lnd-h1">Contact Spokefolio</h1>
        <p className="mt-5 text-[19px] leading-[1.75] text-[#c3cad8]">
          Questions about your account, a résumé that came out wrong, or anything about how
          Spokefolio handles your information: write to us or call. It reaches the studio directly,
          not a ticket queue.
        </p>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          <div className="border border-[#D4AF37]/30 bg-[#161E2E] p-7" style={{ containerType: 'inline-size' }}>
            <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-[#D4AF37]">
              Email
            </p>
            {/* One line, always: the address sizes itself to the card
                rather than wrapping a character onto a second line
                (Michael, Oct 28). */}
            <a
              href="mailto:KellarM@xfhgamestudioltd.com"
              className="mt-3 block whitespace-nowrap font-heading text-[16px] text-[#F9FAFB] hover:text-[#D4AF37]"
              style={{ fontSize: 'min(22px, 5.8cqw)' }}
            >
              KellarM@xfhgamestudioltd.com
            </a>
            <p className="mt-3 text-[16px] text-[#aab3c5]">
              Best for account questions, privacy requests and anything with a file attached.
            </p>
          </div>

          <div className="border border-[#D4AF37]/30 bg-[#161E2E] p-7">
            <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-[#D4AF37]">
              Phone
            </p>
            <a
              href="tel:+17805044899"
              className="mt-3 block whitespace-nowrap font-heading text-[22px] text-[#F9FAFB] hover:text-[#D4AF37]"
            >
              780-504-4899
            </a>
            <p className="mt-3 text-[16px] text-[#aab3c5]">
              Best for anything urgent or easier to explain out loud.
            </p>
          </div>
        </div>

        <p className="mt-8 font-heading text-[19px] italic text-[#c3cad8]">
          Spokefolio is made by XFH Game Studio.
        </p>
      </main>

      <PublicFooter />
    </div>
  );
}