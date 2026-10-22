import React from 'react';

// Languages the app carries a full dictionary for, each named in its own
// language so it is readable to the person choosing it.
export const LANGUAGES = [
  'English',
  'Español',
  'Français',
  'Deutsch',
  'Italiano',
  'Português'
];

const LS_KEY = 'sf_preferred_language';

// Any stored value that predates the dropdown (a typed language) falls back
// to English — the UI only ever shows the six supported choices.
export const normalizeLanguage = (language) =>
  LANGUAGES.includes(language) ? language : 'English';

export const getStoredLanguage = () => {
  try {
    return normalizeLanguage(localStorage.getItem(LS_KEY));
  } catch {
    return 'English';
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

// Plain dropdown. No typing: the six supported languages, nothing else.
export default function LanguageSelect({ id, value, onChange, className }) {
  return (
    <select
      id={id}
      value={normalizeLanguage(value)}
      onChange={(event) => onChange && onChange(event.target.value)}
      className={className || 'mec-v'}
    >
      {LANGUAGES.map((language) => (
        <option key={language} value={language}>
          {language}
        </option>
      ))}
    </select>
  );
}
