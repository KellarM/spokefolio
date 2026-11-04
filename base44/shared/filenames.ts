// One naming rule for every document this app produces.
//
// The file name is what a recruiter sees in their downloads folder and what an applicant
// tracking system shows beside the candidate, so it is a piece of the application, not a
// detail of the export. It reads: last name, what the document is, then who it is for.
//
//   Kellar - Resume - Zora Holdings
//   Kellar - Cover - Zora Holdings
//
// The company is dropped when there is no application behind the document, because a
// trailing separator reads as a mistake: "Kellar - Resume".

// Suffixes that follow a surname and must not be mistaken for it.
const NAME_SUFFIXES = new Set(['jr', 'jr.', 'sr', 'sr.', 'ii', 'iii', 'iv', 'v', 'phd', 'ph.d.', 'cpa', 'p.eng', 'peng', 'mba']);

/** The surname from a display name: "Michael Kellar" -> "Kellar", "Ana Ruiz Jr." -> "Ruiz". */
export function lastNameOf(fullName: unknown): string {
  const parts = String(fullName || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.replace(/[,\s]+$/, ''));
  while (parts.length > 1 && NAME_SUFFIXES.has(parts[parts.length - 1].toLowerCase())) parts.pop();
  return parts.length ? parts[parts.length - 1] : '';
}

/** Characters that break a download on Windows, macOS or a web form. */
function cleanPart(value: unknown): string {
  return String(value || '')
    .replace(/[\\/:*?"<>|\u0000-\u001f]+/g, ' ')
    .replace(/\s*-\s*$/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * The document name without its extension.
 * kind is 'resume' or 'cover'; anything else is treated as a resume.
 */
export function documentName({ fullName, kind, company }: { fullName?: unknown; kind?: string; company?: unknown }): string {
  const who = cleanPart(lastNameOf(fullName));
  const what = String(kind || '').toLowerCase() === 'cover' ? 'Cover' : 'Resume';
  const forWhom = cleanPart(company);
  return [who, what, forWhom].filter(Boolean).join(' - ') || what;
}

/** The same name carrying its extension. */
export function documentFile({ fullName, kind, company, extension }: { fullName?: unknown; kind?: string; company?: unknown; extension: string }): string {
  const ext = String(extension || '').replace(/^\.+/, '') || 'pdf';
  // A very long company name still has to survive a filesystem path.
  return documentName({ fullName, kind, company }).slice(0, 120).trim() + '.' + ext;
}

/**
 * The company out of the label a page already sends.
 *
 * Two shapes reach the server: the download buttons label a document
 * "Company_Job Title", and the header download labels it "Job Title - Company".
 * Both are read here so a client that predates the explicit company field still
 * produces a correctly named file. "Resume_..." is the placeholder for an
 * application with no company yet, so it means nothing and is ignored.
 */
export function companyFromLabel(label: unknown): string {
  const text = String(label || '').trim();
  if (!text) return '';
  const underscore = text.indexOf('_');
  if (underscore > 0) {
    const head = text.slice(0, underscore).trim();
    return head.toLowerCase() === 'resume' || head.toLowerCase() === 'cover' ? '' : head;
  }
  const parts = text.split(' - ').map((part) => part.trim()).filter(Boolean);
  if (parts.length < 2) return '';
  const last = parts[parts.length - 1];
  return last.toLowerCase() === 'resume' || last.toLowerCase() === 'cover' ? '' : last;
}

/** The company to name a file after: the explicit field first, then the label. */
export function resolveCompany(company: unknown, label: unknown): string {
  const explicit = cleanPart(company);
  return explicit || companyFromLabel(label);
}
