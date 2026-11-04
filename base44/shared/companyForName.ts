// Server-side company resolution for document names.
//
// The page sends a company when it knows one, but a page build that predates that
// field sends only a label. Rather than let the file fall back to "Resume" with no
// company, the server reads the candidate's own applications and matches the text it
// was given against the company and job title on them. That keeps the name correct
// no matter which build of the page is doing the asking.

/** The words in a label, lowercased, for comparison. */
function norm(value: unknown): string {
  return String(value || '').toLowerCase().replace(/[\s_]+/g, ' ').trim();
}

/**
 * Picks the application a request refers to.
 * A label such as "Rexel_Warehouse Manager" or "Warehouse Manager - Rexel Group"
 * contains the company, the job title, or both. The most recently updated match wins,
 * because that is the application the candidate was last working on.
 */
export function matchApplication(applications: any[], label: unknown): any | null {
  const text = norm(label);
  if (!text) return null;
  const sorted = [...applications].sort((a, b) => {
    const left = String(a?.updated_date || '');
    const right = String(b?.updated_date || '');
    return right.localeCompare(left);
  });
  const named = sorted.find((app) => {
    const company = norm(app?.company);
    return company && text.includes(company);
  });
  if (named) return named;
  return (
    sorted.find((app) => {
      const title = norm(app?.job_title);
      return title.length > 2 && text.includes(title);
    }) || null
  );
}

/** The company to name a file after: what the request said, then the database. */
export async function resolveCompanyForDocument({
  base44,
  company,
  label,
  jobTitle,
  listApplications
}: {
  base44?: any;
  company?: unknown;
  label?: unknown;
  jobTitle?: unknown;
  listApplications?: () => Promise<any[]>;
}): Promise<string> {
  const explicit = String(company || '').trim();
  if (explicit) return explicit;

  // A label of "Rexel_Warehouse Manager" or "Warehouse Manager - Rexel Group" carries
  // the company directly, and that is cheaper than a query.
  const fromLabel = labelCompany(label);
  if (fromLabel) return fromLabel;

  if (!listApplications) return '';
  let applications: any[] = [];
  try {
    applications = (await listApplications()) || [];
  } catch (e) {
    return '';
  }
  const match = matchApplication(applications, label) || matchApplication(applications, jobTitle);
  return String(match?.company || '').trim();
}

/** The company inside a label, when the label carries one. */
function labelCompany(label: unknown): string {
  const text = String(label || '').trim();
  if (!text) return '';
  const underscore = text.indexOf('_');
  if (underscore > 0) {
    const head = text.slice(0, underscore).trim();
    return isPlaceholder(head) ? '' : head;
  }
  const parts = text.split(' - ').map((part) => part.trim()).filter(Boolean);
  if (parts.length < 2) return '';
  const last = parts[parts.length - 1];
  return isPlaceholder(last) ? '' : last;
}

function isPlaceholder(word: string): boolean {
  const lower = word.toLowerCase();
  return lower === 'resume' || lower === 'cover' || lower === 'download';
}
