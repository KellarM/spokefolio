import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Loader2, Trash2 } from 'lucide-react';
import useProfile from '@/hooks/useProfile';
import ContactForm from '@/components/home/ContactForm';
import TemplateCard from '@/components/home/TemplateCard';
import { useAuth } from '@/lib/AuthContext';
import { missingProfileFields, profileIsComplete } from '@/lib/profileGate';
import { useStudioLanguage } from '@/lib/StudioLanguage';
import { useTour } from '@/lib/TourContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { base44 } from '@/api/base44Client';
import { Switch } from '@/components/ui/switch';
import { mascotHidden, setMascotHidden, mascotMuted, setMascotMuted } from '@/lib/speech';

// The profile: the details that head every résumé, the portrait, and the house style. A new
// client arrives here first, and the rest of the studio stays closed until the five details
// that head every résumé, including the language, are saved.
export default function Profile() {
  const { t } = useStudioLanguage();
  // How the mascot behaves on this device. Both survive a reload and take
  // effect immediately, even while the mascot is on screen.
  const [showMascot, setShowMascot] = useState(() => !mascotHidden());
  const [mascotSpeaks, setMascotSpeaks] = useState(() => !mascotMuted());
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [wipeOpen, setWipeOpen] = useState(false);
  const [wipeWord, setWipeWord] = useState('');
  const [wiping, setWiping] = useState(false);
  const { profile, loadingProfile, save } = useProfile();
  const tour = useTour();
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

  // The ball begins where every client begins: the profile page. It only
  // starts itself for an account that has never met it and still has the
  // gate's details to fill.
  useEffect(() => {
    if (loadingProfile || !user || !tour.ready || tour.hasRecord || tour.active) return;
    if (profileIsComplete(profile)) return;
    tour.start({});
  }, [loadingProfile, user, profile, tour]);

  // The identity step completes when the profile passes its gate - the
  // moment the studio's front door opens. The ball celebrates on its own.
  useEffect(() => {
    if (!tour.active || tour.step !== 'identity') return;
    if (profileIsComplete(profile)) tour.announce('name_done');
  }, [profile, tour]);

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

          {/* The mascot, on the client's terms. Turning it off here is the
              way back for anyone who hid it from its own menu. */}
          <section className="mec-panel mt-9">
            <p className="mec-eyebrow">{t('profile.mascotEyebrow')}</p>
            <p className="mt-2 max-w-2xl font-body text-[15px] leading-relaxed text-muted-foreground">
              {t('profile.mascotLede')}
            </p>
            <div className="mt-5 space-y-4">
              <div className="flex items-start justify-between gap-6">
                <div className="min-w-0">
                  <p className="font-body text-[15.5px] font-medium text-foreground">
                    {t('profile.mascotShow')}
                  </p>
                  <p className="mt-1 text-[14px] leading-relaxed text-muted-foreground">
                    {t('profile.mascotShowHint')}
                  </p>
                </div>
                <Switch
                  checked={showMascot}
                  onCheckedChange={(next) => {
                    setShowMascot(next);
                    setMascotHidden(!next);
                  }}
                  aria-label={t('profile.mascotShow')}
                />
              </div>
              <div className="flex items-start justify-between gap-6">
                <div className="min-w-0">
                  <p className="font-body text-[15.5px] font-medium text-foreground">
                    {t('profile.mascotVoice')}
                  </p>
                  <p className="mt-1 text-[14px] leading-relaxed text-muted-foreground">
                    {t('profile.mascotVoiceHint')}
                  </p>
                </div>
                <Switch
                  checked={mascotSpeaks}
                  onCheckedChange={(next) => {
                    setMascotSpeaks(next);
                    setMascotMuted(!next);
                  }}
                  aria-label={t('profile.mascotVoice')}
                />
              </div>
            </div>
          </section>

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