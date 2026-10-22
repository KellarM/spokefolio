// The five details that head every résumé and set the language the studio speaks.
// Until they are saved on the profile, the overview and the rest of the studio
// stay closed, so a brand new client fills them in first. The language can be
// changed at any time from the profile.
export const REQUIRED_PROFILE_FIELDS = [
  { key: 'full_name', label: 'Full name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'location', label: 'Location' },
  { key: 'preferred_language', label: 'Language' }
];

// The required details still blank on the profile, by label.
export function missingProfileFields(profile) {
  return REQUIRED_PROFILE_FIELDS.filter((field) => !String(profile?.[field.key] || '').trim()).map(
    (field) => field.label
  );
}

export function profileIsComplete(profile) {
  return missingProfileFields(profile).length === 0;
}