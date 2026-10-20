import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { downloadDocxFile } from '@/lib/downloadDocx';

function downloadPdfFile(base64, filename, fallback = 'resume.pdf') {
  const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || fallback;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

// Both downloads are the tailored résumé this application holds, in the style it uses —
// the same document the Word button in the header and the emailed package are built from.
export default function ResumeDownloadButtons({ profile, resume, template, layout, label, className = '' }) {
  const { toast } = useToast();
  const [busy, setBusy] = useState('');

  const run = async (kind) => {
    if (busy) return;
    setBusy(kind);
    try {
      if (kind === 'pdf') {
        const { data } = await base44.functions.invoke('exportResumePdf', { profile, resume, template, layout, label });
        if (!data?.base64) throw new Error('The PDF came back empty.');
        downloadPdfFile(data.base64, data.filename, 'resume.pdf');
        toast({ title: 'Résumé PDF downloaded', description: data.filename });
      } else {
        const { data } = await base44.functions.invoke('exportResumeDocx', { profile, resume, label, template, layout });
        if (!data?.base64) throw new Error('The Word document came back empty.');
        downloadDocxFile(data.base64, data.filename, 'resume.docx');
        toast({ title: 'Word document downloaded', description: data.filename });
      }
    } catch (error) {
      toast({
        title: `Could not build the ${kind === 'pdf' ? 'PDF' : 'Word document'}`,
        description: error?.response?.data?.error || error.message,
        variant: 'destructive'
      });
    }
    setBusy('');
  };

  const spinner = <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />;

  return (
    <div className={`resume-export-buttons ${className}`} style={{ display: 'flex', gap: '8px' }}>
      <button
        type="button"
        onClick={() => run('pdf')}
        disabled={Boolean(busy)}
        className="disabled:opacity-60"
        title="Downloads this tailored résumé as a PDF"
      >
        {busy === 'pdf' ? <>{spinner} Building…</> : 'Download PDF'}
      </button>
      <button
        type="button"
        onClick={() => run('word')}
        disabled={Boolean(busy)}
        className="disabled:opacity-60"
        title="Downloads this tailored résumé as a Word file"
      >
        {busy === 'word' ? <>{spinner} Building…</> : 'Download Word'}
      </button>
    </div>
  );
}