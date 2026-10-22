import React from 'react';

// Languages a visitor can pick, each named in its own language so it is
// readable to the person choosing it. Anything else can be typed freely —
// the list is a convenience, not a gate.
export const LANGUAGES = [
  'English',
  'Español',
  'Français',
  'Deutsch',
  'Italiano',
  'Português',
  'Nederlands',
  'Polski',
  'Türkçe',
  'Svenska',
  'Norsk',
  'Dansk',
  'Suomi',
  'Čeština',
  'Magyar',
  'Română',
  'Български',
  'Ελληνικά',
  'Українська',
  'Русский',
  'العربية',
  'עברית',
  'فارسی',
  'اردو',
  'हिन्दी',
  'मराठी',
  'বাংলা',
  'தமிழ்',
  'తెలుగు',
  'ಕನ್ನಡ',
  'മലയാളം',
  'ਪੰਜਾਬੀ',
  '中文',
  '日本語',
  '한국어',
  'Tiếng Việt',
  'ไทย',
  'Bahasa Indonesia',
  'Bahasa Melayu',
  'Filipino',
  'Kiswahili',
  'Afrikaans',
  'Català'
];

const LS_KEY = 'sf_preferred_language';

export const getStoredLanguage = () => {
  try {
    return localStorage.getItem(LS_KEY) || '';
  } catch {
    return '';
  }
};

export const storeLanguage = (language) => {
  try {
    if (language) localStorage.setItem(LS_KEY, language);
    else localStorage.removeItem(LS_KEY);
  } catch {
    // storage unavailable — the profile copy still carries the choice
  }
};

// Dropdown you can also type into. Native combobox: shows the list on focus,
// accepts any typed language. No dependencies, works on every browser.
export default function LanguageSelect({ id, value, onChange, className, placeholder }) {
  return (
    <>
      <input
        id={id}
        type="text"
        list={`${id}-options`}
        value={value || ''}
        placeholder={placeholder || 'Choose your language'}
        onChange={(event) => onChange && onChange(event.target.value)}
        className={className || 'mec-v'}
      />
      <datalist id={`${id}-options`}>
        {LANGUAGES.map((language) => (
          <option key={language} value={language} />
        ))}
      </datalist>
    </>
  );
}
