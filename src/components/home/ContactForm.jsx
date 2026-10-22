import React, { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import LanguageSelect, { getStoredLanguage } from '@/components/LanguageSelect';

const FIELDS = [
  { key: 'full_name', label: 'Full name', placeholder: 'Jane Doe', required: true },
  { key: 'email', label: 'Email', placeholder: 'jane@email.com', required: true },
  { key: 'phone', label: 'Phone', placeholder: '(555) 010-2233', required: true },
  { key: 'location', label: 'Location', placeholder: 'Edmonton, Alberta, Canada', required: true },
  { key: 'preferred_language', label: 'Language', placeholder: 'Choose your language', language: true, required: true },
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'linkedin.com/in/janedoe' },
  { key: 'website', label: 'Website', placeholder: 'janedoe.com' }
];

export default function ContactForm({ profile, onSave }) {
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
      toast({ title: 'Details saved' });
    } catch (error) {
      toast({
        title: 'Could not save your details',
        description: error?.response?.data?.error || error.message,
        variant: 'destructive'
      });
    }
    setSaving(false);
  };

  return (
    <div className="mec-panel">
      <h3 className="mec-h3-top">Your details</h3>
      <p className="mec-lede">
        These sit at the top of every résumé you generate. The five starred details are needed before the overview opens.
      </p>

      <div className="mec-fields">
        {FIELDS.map((field) => (
          <div key={field.key} className="mec-f">
            <label htmlFor={field.key}>
              {field.label}
              {field.required && <span className="text-accent"> *</span>}
            </label>
            {field.language ? (
              <LanguageSelect
                id={field.key}
                value={form[field.key] || ''}
                placeholder={field.placeholder}
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
                Identified as {profile.location_full}
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
          {saving ? 'Saving…' : 'Save details'}
        </button>
      </div>
    </div>
  );
}