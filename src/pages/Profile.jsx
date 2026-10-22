import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Loader2, Trash2 } from 'lucide-react';
import useProfile from '@/hooks/useProfile';
import ContactForm from '@/components/home/ContactForm';
import TemplateCard from '@/components/home/TemplateCard';
import { useAuth } from '@/lib/AuthContext';
import { missingProfileFields, profileIsComplete } from '@/lib/profileGate';
import { useStudioLanguage } from '@/lib/StudioLanguage';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { base44 } from '@/api/base44Client';

// The profile: the details that head every résumé, the portrait, and the house style. A new
// client arrives here first, and the rest of the studio stays closed until the five details
// that head every résumé, including the language, are saved.
export default function Profile() {
  const { t } = useStudioLanguage();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [wipeOpen, setWipeOpen] = useState(false);
  const [wipeWord, setWipeWord] = useState('');
  const [wiping, setWiping] = useState(false);
  const { profile, loadingProfile, save } = useProfile();
  const missingLabels = missingProfileFields(profile);
  // The gate speaks in catalog keys so the banner reads in the chosen language.
  const GATE_LABELS = {
    'Full name': 'profile.fullName',
    'Email': 'profile.email',
    'Phone': 'profile.phone',
    'Location': 'profile.location',
    'Language': 'profile.language'
  };
  const missing = missingLabels.map((label) => t(GATE_LABELS[label] || label));
  const complete = profileIsComplete(profile);
  // A brand new account holds no contact details yet, so its own email address is offered.
  const details = profile.email ? profile : { ...profile, email: user?.email || '' };

  // The full clean slate: every owned record is erased server-side, then the
  // session ends and the studio shows its front door, as to any new visitor.
  const wipeEverything = async () => {
    setWiping(true);
    try {
      await base44.functions.invoke('deleteMyAccount', { confirm: 'DELETE' });
      logout(false);
      navigate('/');
    } catch (error) {
      setWiping(false);
      setWipeOpen(false);
      toast({ title: t('profile.deleteFailedTitle'), description: t('profile.deleteFailedBody') });
    }
  };

  return (
    <div className="animate-rise">
      <header className="max-w-2xl">
        <p className="eyebrow">{t('profile.eyebrow')}</p>
        <h1 className="mt-3 font-heading text-[30px] leading-tight tracking-tight sm:text-[36px]">
          {t('profile.title')}
        </h1>
        <p className="mt-3 text-[14.5px] leading-relaxed text-muted-foreground">
          {t('profile.lede')}
        </p>
      </header>

      {!loadingProfile && !complete && (
        <div className="mt-6 rounded-2xl border border-accent/30 bg-accent/5 px-5 py-4">
          <p className="mec-eyebrow">{t('profile.beforeOpens')}</p>
          <p className="mt-2 text-[14.5px] leading-relaxed text-foreground/90">
            {t('profile.fiveComeFirst')}
            {missing.length ? ` ${t('profile.stillToAdd')} ${missing.join(', ')}.` : ''}
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
                {t('profile.completeHistory')}
              </p>
            )}
          </section>
          {complete && (
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link to="/" className="mec-btn mec-gold">
                {t('profile.continue')} <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="text-[13.5px] text-muted-foreground">
                {t('profile.allFive')}
              </p>
            </div>
          )}

          {/* The one irreversible action in the studio, kept at the very bottom. */}
          <section className="mt-12 rounded-2xl border border-destructive/30 px-5 py-5">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <span className="mec-eyebrow">{t('profile.dangerEyebrow')}</span>
            </div>
            <p className="mt-2 font-heading text-[18px]">{t('profile.deleteTitle')}</p>
            <p className="mt-2 max-w-2xl text-[14.5px] leading-relaxed text-muted-foreground">
              {t('profile.deleteLede')}
            </p>
            <Button
              variant="destructive"
              className="mt-4 rounded-full"
              onClick={() => {
                setWipeWord('');
                setWipeOpen(true);
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" /> {t('profile.deleteButton')}
            </Button>
          </section>

          <Dialog open={wipeOpen} onOpenChange={setWipeOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('profile.deleteConfirmTitle')}</DialogTitle>
                <DialogDescription>{t('profile.deleteConfirmDesc')}</DialogDescription>
              </DialogHeader>
              <p className="mt-2 text-[13.5px] text-muted-foreground">
                {t('profile.deleteTypePrompt')}
              </p>
              <Input
                value={wipeWord}
                onChange={(event) => setWipeWord(event.target.value)}
                placeholder="DELETE"
                disabled={wiping}
              />
              <div className="mt-4 flex justify-end gap-3">
                <Button variant="outline" className="rounded-full" onClick={() => setWipeOpen(false)} disabled={wiping}>
                  {t('profile.deleteCancel')}
                </Button>
                <Button
                  variant="destructive"
                  className="rounded-full"
                  disabled={wipeWord !== 'DELETE' || wiping}
                  onClick={wipeEverything}
                >
                  {wiping && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('profile.deleteConfirmButton')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}