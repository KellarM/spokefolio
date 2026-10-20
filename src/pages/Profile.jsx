import React from 'react';
import { Loader2 } from 'lucide-react';
import useProfile from '@/hooks/useProfile';
import ContactForm from '@/components/home/ContactForm';
import TemplateCard from '@/components/home/TemplateCard';

// The profile: the details that head every résumé, the portrait, and the house style.
export default function Profile() {
  const { profile, loadingProfile, save } = useProfile();

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

      {loadingProfile ? (
        <div className="mt-8 flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading your profile…
        </div>
      ) : (
        <div className="mec-deck mt-7">
          <div className="mec-col">
            <ContactForm profile={profile} onSave={save} />
          </div>
          <div className="mec-col">
            <TemplateCard profile={profile} onSave={save} />
          </div>
        </div>
      )}
    </div>
  );
}