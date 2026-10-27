import React, { useEffect, useState } from 'react';
import { Loader2, Mic, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import useDictation from '@/hooks/useDictation';
import LanguageSelect, { getStoredLanguage, normalizeLanguage } from '@/components/LanguageSelect';
import { useStudioLanguage } from '@/lib/StudioLanguage';
import LocationInput from '@/components/home/LocationInput';
import { base44 } from '@/api/base44Client';
import { parseSpokenDetails } from '@/lib/spokenDetails';
import useVoiceMode from '@/hooks/useVoiceMode';

const HONORIFICS = ['', 'Mr.', 'Mrs.', 'Miss', 'Ms.', 'Mx.', 'Dr.', 'Prof.', 'Rev.'];

const FIELDS = [
  { key: 'full_name', label: 'profile.fullName', placeholder: 'Jane Doe', required: true },
  { key: 'honorific', label: 'profile.honorific', honorific: true, required: false },
  { key: 'email', label: 'profile.email', placeholder: 'jane@email.com', required: true },
  { key: 'phone', label: 'profile.phone', placeholder: '(555) 010-2233', required: true },
  { key: 'location', label: 'profile.location', placeholder: 'Edmonton, Alberta, Canada', required: true },
  { key: 'home_address', label: 'profile.homeAddress', placeholder: '123 Main Street, Edmonton', required: false },
  { key: 'preferred_language', label: 'profile.language', placeholder: 'profile.chooseLanguage', language: true, required: true },
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'linkedin.com/in/janedoe' },
  { key: 'website', label: 'Website', placeholder: 'janedoe.com' }
];

// LinkedIn and Website keep their own labels; everything else comes from the catalog.
const FIELDS_TITLES = { linkedin: 'LinkedIn', website: 'Website' };

// Words to fields: what one spoken sentence of details becomes, in any of
// the studio's six languages. Everything parsed lands in the form for the
// client to check - nothing is saved until they press Save.
export { parseSpokenDetails };

export default function ContactForm({ profile, onSave }) {
  const { t } = useStudioLanguage();
  const { toast } = useToast();
  const [form, setForm] = useState(profile || {});
  const [accountEmail, setAccountEmail] = useState('');
  const [saving, setSaving] = useState(false);

  // A spoken street address usually carries the city inside it: when a person
  // gives "123 Main Street, Edmonton", the Location field should not stay
  // empty just because they never said "I live in". The city is looked up in
  // the same dataset the typeahead uses - never guessed.
  const applyCityFromAddress = (parsed) => {
    if (!parsed?.home_address || parsed.location) return;
    import('@/lib/locations').then(({ searchInText }) => {
      const place = searchInText(parsed.home_address);
      if (place?.label) setForm((prev) => ({ ...prev, location: place.label }));
    }).catch(() => {});
  };

  // Tap and Talk: one recording fills the details - the client confirms and saves as usual.
  const applyTranscript = (transcript) => {
    const parsed = parseSpokenDetails(transcript);
    if (Object.keys(parsed).length === 0) {
      toast({ title: t('profile.heardNothingTitle'), description: t('profile.heardNothingBody') });
      return;
    }
    setForm((prev) => ({ ...prev, ...parsed }));
    applyCityFromAddress(parsed);
    toast({ title: t('profile.filledFromVoice') });
  };
  const { recording, busy, seconds, start, stop } = useDictation(applyTranscript);
  const clock = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

  // Voice Mode: hands-free conversation. One tap, then the person talks and
  // the app answers out loud until they say close. Details land the same way.
  const voice = useVoiceMode({
    t,
    language: form.preferred_language,
    onApply: (parsed) => {
      setForm((prev) => ({ ...prev, ...parsed }));
      applyCityFromAddress(parsed);
    }
  });

  useEffect(() => {
    // An existing profile without a language yet adopts whatever the person
    // picked on the intro page, so the choice follows them into the app.
    setForm({
      ...profile,
      preferred_language: normalizeLanguage(profile?.preferred_language || getStoredLanguage())
    });
    // The email arrived at sign-in. The profile never asks for it again:
    // an empty email is filled from the account the moment the form loads.
    if (!profile?.email) {
      let cancelled = false;
      base44.auth.me().then((user) => {
        if (!cancelled && user?.email) {
          setAccountEmail(user.email);
          setForm((prev) => ({ ...prev, email: user.email }));
        }
      }).catch(() => {});
      return () => { cancelled = true; };
    }
  }, [profile]);

  const submit = async () => {
    setSaving(true);
    try {
      await onSave(form);
      toast({ title: t('profile.detailsSaved') });
    } catch (error) {
      toast({
        title: t('profile.couldNotSave'),
        description: error?.response?.data?.error || error.message,
        variant: 'destructive'
      });
    }
    setSaving(false);
  };

  return (
    <div className="mec-panel">
      <h3 className="mec-h3-top">{t('profile.yourDetails')}</h3>
      <p className="mec-lede">
        {t('profile.detailsLede')}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-border/70 bg-secondary/40 px-4 py-3">
        {recording ? (
          <Button type="button" onClick={stop} disabled={busy} className="dictate-live rounded-full">
            <Square className="mr-2 h-3.5 w-3.5" /> {t('history.vstop')} · {clock}
          </Button>
        ) : (
          <Button type="button" variant="secondary" className="dictate-tap rounded-full" onClick={start} disabled={busy || voice.active}>
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mic className="mr-2 h-4 w-4" />}
            {t('history.tapToTalk')}
          </Button>
        )}
        {voice.active ? (
          <Button type="button" onClick={voice.stop} className="dictate-voice-live rounded-full">
            <Square className="mr-2 h-3.5 w-3.5" />
            {t('profile.voiceModeStop')} · {t(`voice.phase.${voice.phase}`)}
          </Button>
        ) : (
          <Button type="button" variant="secondary" className="dictate-voice rounded-full" onClick={voice.start} disabled={recording || busy}>
            <Mic className="mr-2 h-4 w-4" />
            {t('profile.voiceMode')}
          </Button>
        )}
        <span className="text-[12px] leading-snug text-muted-foreground">
          {recording ? t('history.vrecording') : t('profile.tapHint')}
        </span>
        {voice.active && (
          <div role="status" aria-live="polite" className="basis-full rounded-lg bg-secondary/60 px-3 py-2">
            <p className="text-[13px] font-medium">{voice.said}</p>
            {voice.heard && (
              <p className="text-[12px] italic text-muted-foreground">&ldquo;{voice.heard}&rdquo;</p>
            )}
          </div>
        )}
      </div>

      <div className="mec-fields">
        {FIELDS.map((field) => (
          <div key={field.key} className="mec-f">
            <label htmlFor={field.key}>
              {field.language ? t(field.label) : FIELDS_TITLES[field.key] || t(field.label)}
              {field.required && <span className="text-accent"> *</span>}
            </label>
            {field.honorific ? (
              <select
                id={field.key}
                value={form[field.key] || ''}
                onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                className="mec-v"
              >
                {HONORIFICS.map((option) => (
                  <option key={option || 'none'} value={option}>
                    {option || t('profile.honorificNone')}
                  </option>
                ))}
              </select>
            ) : field.language ? (
              <LanguageSelect
                id={field.key}
                value={form[field.key] || ''}
                className="mec-v"
                onChange={(value) => setForm({ ...form, [field.key]: value })}
              />
            ) : field.key === 'location' ? (
              <LocationInput
                id={field.key}
                value={form[field.key] || ''}
                placeholder={field.placeholder}
                required={field.required}
                onChange={(value) => setForm({ ...form, [field.key]: value })}
                className="mec-v"
              />
            ) : (
              <input
                id={field.key}
                type="text"
                value={form[field.key] || ''}
                placeholder={field.placeholder}
                aria-required={field.required ? 'true' : undefined}
                onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                className="mec-v"
              />
            )}
            {field.key === 'email' && accountEmail && form.email === accountEmail && !profile?.email && (
              <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">
                {t('profile.emailFromAccount')}
              </p>
            )}
            {field.key === 'location' && profile?.location_full && (
              <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">
                {t('profile.identifiedAs', { place: profile.location_full })}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="mec-save">
        <button
          type="button"
          onClick={submit}
          disabled={saving}
          className="mec-btn mec-gold"
        >
          {saving ? t('common.saving') : t('profile.saveDetails')}
        </button>
      </div>
    </div>
  );
}