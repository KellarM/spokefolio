// What the studio has to work with, said plainly.
//
// Two sources feed a tailored résumé, and they do different jobs. The career
// history is the spine: employers, titles, dates, continuity - the things an
// ATS parser reads first and the only thing a résumé cannot be built without.
// The reference files are the precision layer: real numbers, project names,
// customer praise, certifications - the detail that makes a bullet specific
// instead of generic.
//
// So this is not an either/or. One is required and the other sharpens it, and
// the honest thing to tell a client is where they stand, not what the rule is.
// Pure on purpose: four states from two counts, no browser, no network.

export const evidenceState = ({ entries = 0, documents = 0 } = {}) => {
  const spine = entries > 0;
  const precision = documents > 0;
  if (spine && precision) return 'strong';
  if (spine) return 'spineOnly';
  if (precision) return 'docsOnly';
  return 'none';
};

// Hidden entries and documents without a readable summary never reach the
// tailorer, so counting them would overstate what the studio can actually do.
// Records arrive from the API; this keeps the count honest with the pipeline.
export const countFeedable = {
  entries: (records = []) => records.filter((entry) => !entry?.hidden).length,
  documents: (records = []) => records.filter((doc) => !!doc?.extracted_summary).length
};

export const EVIDENCE_KEY = {
  strong: 'evidence.strong',
  spineOnly: 'evidence.spineOnly',
  docsOnly: 'evidence.docsOnly',
  none: 'evidence.none'
};
