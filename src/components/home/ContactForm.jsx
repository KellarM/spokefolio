import React, { useEffect, useState } from 'react';
import { Loader2, Mic, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import useDictation from '@/hooks/useDictation';
import LanguageSelect, { getStoredLanguage, normalizeLanguage } from '@/components/LanguageSelect';
import { useStudioLanguage } from '@/lib/StudioLanguage';
import LocationInput from '@/components/home/LocationInput';

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
const SPOKEN_LANGUAGES = {
  english: 'English', 'espanol': 'Español', 'español': 'Español', spanish: 'Español',
  'francais': 'Français', 'français': 'Français', french: 'Français',
  deutsch: 'Deutsch', german: 'Deutsch',
  italiano: 'Italiano', italian: 'Italiano',
  'portugues': 'Português', 'português': 'Português', portuguese: 'Português'
};

const NAME_CUES = 'my name is|name is|i am|i\u2019m|i\u2019m|this is|mi chiamo|me llamo|je m\u2019appelle|ich hei\u00dfe|hei\u00dfe ich|meu nome \u00e9|me chamo|chamo-me|eu sou|soy yo';
const ADDRESS_CUES = 'my address is|address is|i live at|live at|located at|il mio indirizzo \u00e8|indirizzo \u00e8|mi direcci\u00f3n es|direcci\u00f3n es|mon adresse est|adresse est|meine adresse ist|adresse ist|meu endere\u00e7o \u00e9|endere\u00e7o \u00e9|moro na|moro no|moro em';
const LOCATION_CUES = 'i live in|vivo in|vivo a|vivo en|je vis \u00e0|j\u2019habite \u00e0|j\u2019habite \u00e0|ich lebe in|lebe in|moro em|habito en|habito em';

export function parseSpokenDetails(raw) {
  const clean = (raw || '').replace(/\s+/g, ' ').trim();
  const out = {};
  const email = clean.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
  if (email) out.email = email[0];
  const phone = clean.match(/\+?\d[\d\s().-]{7,}\d/);
  if (phone) out.phone = phone[0].trim();

  const nameM = clean.match(new RegExp('(?:' + NAME_CUES + ')\\s+([A-Za-z\u00C0-\u017F\' -]{2,40}?)(?=\\s*(?:,|\\.|;|!|\\s+my\\s|\\s+mi\\s|\\s+mon\\s|\\s+meine\\s|\\s+meu\\s|\\s+il\\s|\\s+i\\s+live|\\s+vivo|\\s+je\\s|\\s+ich\\s|$))', 'i'));
  if (nameM) out.full_name = nameM[1].trim().replace(/\s+/g, ' ');

  const addrM = clean.match(new RegExp('(?:' + ADDRESS_CUES + ')\\s*(.{6,120}?)(?=\\s*(?:,?\\s*(?:and\\s+|und\\s+)?(?:my|mi|mon|ma|meine|meu|minha|je|ich|yo|eu|courriel|correo|email|mail|telefon|telephone|t\\u00e9l\\u00e9phone|telefono|telefone|phone|tel|hablo|parlo|parle|spreche|vivo|vis|lebe|moro|habito)\\s|\\.\\s|\\.|;|!|$))', 'i'));
  if (addrM) out.home_address = addrM[1].replace(/\s+/g, ' ').replace(/[,;]$/, '').trim();

  if (!out.home_address) {
    const locM = clean.match(new RegExp('(?:' + LOCATION_CUES + ')\\s+([A-Za-z\u00C0-\u017F ,\'-]{2,60}?)(?=\\s*(?:,|\\.|;|!|\\s+my\\s|\\s+mi\\s|\\s+mon\\s|\\s+meine\\s|\\s+meu\\s|$))', 'i'));
    if (locM) out.location = locM[1].replace(/\s+/g, ' ').replace(/[,;]$/, '').trim();
  }

  const low = ' ' + clean.toLowerCase() + ' ';
  for (const [word, value] of Object.entries(SPOKEN_LANGUAGES)) {
    const re = new RegExp('[\\s.,;!?]' + word + '[\\s.,;!?]');
    if (re.test(low)) { out.preferred_language = value; break; }
  }
  return out;
}

export default function ContactForm({ profile, onSave }) {
  const { t } = useStudioLanguage();
  const { toast } = useToast();
  const [form, setForm] = useState(profile || {});
  const [saving, setSaving] = useState(false);

  // Tap and Talk: one recording fills the details - the client confirms and saves as usual.
  const applyTranscript = (transcript) => {
    const parsed = parseSpokenDetails(transcript);
    if (Object.keys(parsed).length === 0) {
      toast({ title: t('profile.heardNothingTitle'), description: t('profile.heardNothingBody') });
      return;
    }
    setForm((prev) => ({ ...prev, ...parsed }));
    toast({ title: t('profile.filledFromVoice') });
  };
  const { recording, busy, seconds, start, stop } = useDictation(applyTranscript);
  const clock = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

  useEffect(() => {
    // An existing profile without a language yet adopts whatever the person
    // picked on the intro page, so the choice follows them into the app.
    setForm({
      ...profile,
      preferred_language: normalizeLanguage(profile?.preferred_language || getStoredLanguage())
    });
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
          <Button type="button" variant="secondary" className="dictate-tap rounded-full" onClick={start} disabled={busy}>
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mic className="mr-2 h-4 w-4" />}
            {t('history.tapToTalk')}
          </Button>
        )}
        <span className="text-[12px] leading-snug text-muted-foreground">
          {recording ? t('history.vrecording') : t('profile.tapHint')}
        </span>
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