import React, { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import DocumentUploader from '@/components/documents/DocumentUploader';
import DocumentRow from '@/components/documents/DocumentRow';

export default function Documents() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const records = await base44.entities.SupportingDocument.list('-created_date', 100);
    setDocuments(records || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const unsubscribe = base44.entities.SupportingDocument.subscribe(() => {
      load();
    });
    return unsubscribe;
  }, [load]);

  const remove = async (doc) => {
    if (!window.confirm(`Delete “${doc.name}”?`)) return;
    await base44.entities.SupportingDocument.delete(doc.id);
    await load();
  };

  return (
    <div className="animate-rise">
      <header className="max-w-2xl">
        <p className="eyebrow">Reference shelf</p>
        <h1 className="mt-3 font-heading text-[30px] leading-tight tracking-tight sm:text-[36px]">Documents you already have</h1>
        <p className="mt-3 text-[14.5px] leading-relaxed text-muted-foreground">
          Add old résumés, project write-ups and customer praise. Everything here becomes extra evidence when a résumé is
          tailored to a job.
        </p>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.15fr]">
        <DocumentUploader onChanged={load} />

        <section>
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-heading text-[20px]">Your files</h2>
            {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>
          {documents.length === 0 && !loading ? (
            <div className="mt-4 rounded-2xl border border-dashed border-border px-6 py-10 text-center">
              <p className="text-[14px] text-muted-foreground">Nothing here yet. Add your first file on the left.</p>
            </div>
          ) : (
            <ul className="mt-4 space-y-2.5">
              {documents.map((doc) => (
                <DocumentRow key={doc.id} doc={doc} onDelete={remove} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}