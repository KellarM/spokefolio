import React, { createContext, useContext, useMemo } from 'react';
import useProfile from '@/hooks/useProfile';
import { getStoredLanguage } from '@/components/LanguageSelect';
import { studioStrings } from '@/i18n/studio';

// The studio speaks the language saved on the profile. A language chosen on
// the intro page before signing up follows the person in until the profile
// carries one. Saving a new language on the profile switches the whole studio
// on the spot.
const Fallback = { language: 'English', t: (key) => studioStrings('English')[key] || key };
const StudioLanguageContext = createContext(Fallback);

export function StudioLanguageProvider({ children }) {
  const { profile } = useProfile();
  const language = profile?.preferred_language || getStoredLanguage() || 'English';
  const value = useMemo(() => {
    const strings = studioStrings(language);
    const t = (key, params) => {
      const text = strings[key] || studioStrings('English')[key] || key;
      if (!params) return text;
      return Object.entries(params).reduce(
        (out, [name, val]) => out.replaceAll(`{${name}}`, String(val)),
        text
      );
    };
    return { language, t };
  }, [language]);
  return <StudioLanguageContext.Provider value={value}>{children}</StudioLanguageContext.Provider>;
}

export const useStudioLanguage = () => useContext(StudioLanguageContext);
