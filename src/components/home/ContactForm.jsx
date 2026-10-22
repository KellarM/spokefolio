import React, { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import LanguageSelect, { getStoredLanguage } from '@/components/LanguageSelect';
import { useStudioLanguage } from '@/lib/StudioLanguage';

const FIELDS = [
  { key: 'full_name', label: 'profile.fullName', placeholder: 'Jane Doe', required: true },
  { key: 'email', label: 'profile.email', placeholder: 'jane@email.com', required: true },
  { key: 'phone', label: 'profile.phone', placeholder: '(555) 010-2233', required: true },
  { key: 'location', label: 'profile.location', placeholder: 'Edmonton, Alberta, Canada', required: true },
  { key: 'preferred_language', label: 'profile.language', placeholder: 'profile.chooseLanguage', language: true, required: true },
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'linkedin.com/in/janedoe' },
  { key: 'website', label: 'Website', placeholder: 'janedoe.com' }
];

// LinkedIn and Website keep their own labels; everything else comes from the catalog.
const FIELDS_TITLES = { linkedin: 'LinkedIn', website: 'Website' };

export default function ContactForm({ profile, onSave }) {
  const { t } = useStudioLanguage();
  const { toast } = useToast();
  const [form, setForm] = useState(profile || {});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // An existing profile without a language yet adopts whatever the person
    // picked on the intro page, so the choice follows them into the app.
    setForm({
      ...profile,
      preferred_language: profile?.preferred_language || getStoredLanguage()
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

      <div className="mec-fields">
        {FIELDS.map((field) => (
          <div key={field.key} className="mec-f">
            <label htmlFor={field.key}>
              {field.language ? t(field.label) : FIELDS_TITLES[field.key] || t(field.label)}
              {field.required && <span className="text-accent"> *</span>}
            </label>
            {field.language ? (
              <LanguageSelect
                id={field.key}
                value={form[field.key] || ''}
                placeholder={t(field.placeholder)}
                className="mec-v"
                onChange={(value) => setForm({ ...form, [field.key]: value })}
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