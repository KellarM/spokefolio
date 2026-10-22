import { base44 } from '@/api/base44Client';

// Fire-and-forget product analytics. Never blocks the UI, never surfaces errors.
export function trackEvent(event_type, metadata) {
  try {
    return base44.entities.AppEvent.create({
      event_type,
      metadata: metadata ? String(metadata).slice(0, 200) : undefined
    }).catch(() => {});
  } catch {
    return Promise.resolve();
  }
}

// Log an app_open once per browser session PER ACCOUNT so the "opened the
// app" number counts sessions honestly without every page bounce. Keyed by
// user id: switching accounts in the same browser session still logs the new
// account's open, so the admin counter reflects every signup that arrived.
export function trackAppOpen(userId) {
  try {
    const key = `sf_app_open_logged:${userId || 'anon'}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
    trackEvent('app_open');
  } catch {
    // private mode etc. - skip silently
  }
}
