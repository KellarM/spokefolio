import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { storeLanguage } from '@/components/LanguageSelect';

const EMPTY = {
  full_name: '',
  email: '',
  phone: '',
  location: '',
  linkedin: '',
  website: '',
  headline: '',
  preferred_language: ''
};

// One profile for the whole studio. Every page used to run its own copy of
// this state, so a language saved on the profile page updated that page's
// copy while the language provider kept reading a stale one — the UI did not
// switch until a reload. The provider below holds the single shared copy;
// useProfile reads it, so a save is visible everywhere at once.
const ProfileContext = createContext(null);

function useProfileState() {
  const [profile, setProfile] = useState(EMPTY);
  const [profileId, setProfileId] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const reload = useCallback(async () => {
    try {
      const records = await base44.entities.ResumeProfile.list('-created_date', 1);
      if (Array.isArray(records) && records.length) {
        setProfileId(records[0].id);
        setProfile(records[0]);
      }
    } catch {
      // Unauthenticated preview fallback
    }
    setLoadingProfile(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const save = useCallback(
    async (patch) => {
      if (patch?.preferred_language) {
        // The landing page reads this too; keep it marching with the profile.
        storeLanguage(patch.preferred_language);
      }
      if (profileId) {
        const updated = await base44.entities.ResumeProfile.update(profileId, patch);
        setProfile((prev) => ({ ...prev, ...(updated || patch) }));
        return updated;
      }
      const created = await base44.entities.ResumeProfile.create({ ...EMPTY, ...patch });
      setProfileId(created.id);
      setProfile(created);
      return created;
    },
    [profileId]
  );

  return { profile, profileId, loadingProfile, save, reload };
}

export function ProfileProvider({ children }) {
  const value = useProfileState();
  return React.createElement(ProfileContext.Provider, { value }, children);
}

// Consumers inside ProfileProvider share the single copy. One mounted
// outside it (there are none today) still works on its own state.
export default function useProfile() {
  const shared = useContext(ProfileContext);
  return shared || useProfileState();
}
