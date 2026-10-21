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

// Log an app_open once per browser session so the "opened the app" number
// counts sessions honestly instead of every page bounce.
const OPEN_KEY = 'sf_app_open_logged';
export function trackAppOpen() {
  try {
    if (sessionStorage.getItem(OPEN_KEY)) return;
    sessionStorage.setItem(OPEN_KEY, '1');
    trackEvent('app_open');
  } catch {
    // private mode etc. - skip silently
  }
}
