import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useStudioLanguage } from '@/lib/StudioLanguage';
import { evidenceState, countFeedable, EVIDENCE_KEY } from '@/lib/evidence';

// One quiet line telling the client where their evidence stands, in the place
// they are about to decide whether to add more. Each page already holds one of
// the two lists and passes it in; the other is fetched here, once. Counts run
// through countFeedable, so the sentence reflects what the tailor actually
// receives rather than what happens to be stored. Nothing renders until both
// are known - a flash of "nothing yet" for a client who has plenty would be a
// lie, and this line exists to be trusted.
export default function EvidenceNote({ entries, documents, className = '' }) {
  const { t } = useStudioLanguage();
  const [fetchedEntries, setFetchedEntries] = useState(Array.isArray(entries) ? entries : null);
  const [fetchedDocuments, setFetchedDocuments] = useState(Array.isArray(documents) ? documents : null);

  useEffect(() => {
    let live = true;
    const load = async () => {
      try {
        if (!Array.isArray(entries) && fetchedEntries === null) {
          const records = await base44.entities.CareerEntry.list('-created_date', 200);
          if (live) setFetchedEntries(records || []);
        }
        if (!Array.isArray(documents) && fetchedDocuments === null) {
          const records = await base44.entities.SupportingDocument.list('-created_date', 100);
          if (live) setFetchedDocuments(records || []);
        }
      } catch {
        // No answer beats a wrong one: stay silent rather than announce a
        // state that could not be confirmed.
      }
    };
    load();
    return () => { live = false; };
  }, [entries, documents, fetchedEntries, fetchedDocuments]);

  const entryList = Array.isArray(entries) ? entries : fetchedEntries;
  const documentList = Array.isArray(documents) ? documents : fetchedDocuments;
  if (!entryList || !documentList) return null;

  const state = evidenceState({
    entries: countFeedable.entries(entryList),
    documents: countFeedable.documents(documentList)
  });

  return (
    <p
      className={`mt-4 border-l-2 border-[#D4AF37]/45 pl-3 font-body text-[13.5px] leading-relaxed text-muted-foreground ${className}`}
    >
      {t(EVIDENCE_KEY[state])}
    </p>
  );
}
