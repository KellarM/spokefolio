import { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

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

export default function useProfile() {
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