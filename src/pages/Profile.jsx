import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Loader2 } from 'lucide-react';
import useProfile from '@/hooks/useProfile';
import ContactForm from '@/components/home/ContactForm';
import TemplateCard from '@/components/home/TemplateCard';
import { useAuth } from '@/lib/AuthContext';
import { missingProfileFields, profileIsComplete } from '@/lib/profileGate';

// The profile: the details that head every résumé, the portrait, and the house style. A new
// client arrives here first, and the rest of the studio stays closed until the five details
// that head every résumé, including the language, are saved.
export default function Profile() {
  const { user } = useAuth();
  const { profile, loadingProfile, save } = useProfile();
  const missing = missingProfileFields(profile);
  const complete = profileIsComplete(profile);
  // A brand new account holds no contact details yet, so its own email address is offered.
  const details = profile.email ? profile : { ...profile, email: user?.email || '' };

  return (
    <div className="animate-rise">
      <header className="max-w-2xl">
        <p className="eyebrow">Profile</p>
        <h1 className="mt-3 font-heading text-[30px] leading-tight tracking-tight sm:text-[36px]">
          How you appear on paper
        </h1>
        <p className="mt-3 text-[14.5px] leading-relaxed text-muted-foreground">
          Your contact details, your portrait, and the style every new résumé starts from.
        </p>
      </header>

      {!loadingProfile && !complete && (
        <div className="mt-6 rounded-2xl border border-accent/30 bg-accent/5 px-5 py-4">
          <p className="mec-eyebrow">Before the overview opens</p>
          <p className="mt-2 text-[14.5px] leading-relaxed text-foreground/90">
            Every résumé heads with your name, email, phone number and location, and you choose the language the studio speaks, so those five come first.
            {missing.length ? ` Still to add: ${missing.join(', ')}.` : ''}
          </p>
        </div>
      )}

      {loadingProfile ? (
        <div className="mt-8 flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading your profile…
        </div>
      ) : (
        <>
          <div className="mec-deck mec-profile-deck mt-7">
            <div className="mec-col">
              <ContactForm profile={details} onSave={save} />
            </div>
            <div className="mec-col">
              <TemplateCard profile={profile} onSave={save} />
            </div>
          </div>
          <section className="mec-panel mt-9">
            <div className="flex items-center justify-between gap-3">
              <div className="mec-eyebrow">Master history</div>
              {profile.content_language && (
                <span className="rounded-full border border-[#D4AF37]/30 bg-[#0B0F17] px-3 py-1 font-body text-[12px] text-[#D4AF37]">
                  {profile.content_language}
                </span>
              )}
            </div>
            {profile.history_complete && profile.master_summary ? (
              <div>
                <p className="mt-3 font-body text-[17px] leading-relaxed text-[#F9FAFB]/90">
                  {profile.master_summary}
                </p>
                {Array.isArray(profile.core_skills) && profile.core_skills.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {profile.core_skills.slice(0, 14).map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full border border-[#D4AF37]/30 bg-[#0B0F17] px-3 py-1 font-body text-[14px] text-[#D4AF37]"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
                {Array.isArray(profile.target_titles) && profile.target_titles.length > 0 && (
                  <p className="mt-4 font-body text-[16px] text-[#aab3c5]">
                    Best fit roles: {profile.target_titles.join(' · ')}
                  </p>
                )}
              </div>
            ) : (
              <p className="mt-3 font-body text-[15.5px] leading-relaxed text-muted-foreground">
                Complete and lock in your career history to generate your master summary.
              </p>
            )}
          </section>
          {complete && (
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link to="/" className="mec-btn mec-gold">
                Continue to your overview <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="text-[13.5px] text-muted-foreground">
                All five details are in — the rest of the studio is open to you.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}