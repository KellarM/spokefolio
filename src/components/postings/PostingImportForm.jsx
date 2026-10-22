import React, { useState } from 'react';
import { AlertCircle, ClipboardPaste, Link2, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useStudioLanguage } from '@/lib/StudioLanguage';


// Brings one posting into the app from a link or from pasted text, and hands the details back.
export default function PostingImportForm({ onExtracted, title, hint }) {
  const { t } = useStudioLanguage();
  const MODES = [
    { value: 'link', label: t('postings.pasteLink'), icon: Link2 },
    { value: 'text', label: t('postings.pasteText'), icon: ClipboardPaste }
  ];
  const [mode, setMode] = useState('link');
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const ready = mode === 'link' ? url.trim().length > 8 : text.trim().length >= 60;

  const read = async () => {
    setBusy(true);
    setError('');
    setNote('');
    try {
      const response = await base44.functions.invoke(
        'importJobPosting',
        mode === 'link' ? { url: url.trim() } : { text: text.trim() }
      );
      const data = response.data || {};

      if (data.status === 'unreadable') {
        // Nothing is invented from a page that could not be read: the text route takes over instead.
        setNote(data.note || t('postings.unreadable'));
        setMode('text');
        setBusy(false);
        return;
      }

      onExtracted({
        company: data.company || '',
        job_title: data.job_title || '',
        job_description: data.job_description || '',
        work_address: data.work_address || '',
        source_url: data.source_url || (mode === 'text' ? url.trim() : '')
      });
    } catch (e) {
      setError(e?.response?.data?.error || e.message);
    }
    setBusy(false);
  };

  return (
    <section className="rounded-2xl border border-dashed border-border px-4 py-4 sm:px-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow">{title || t('postings.bringInPosting')}</p>
          {hint && <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">{hint}</p>}
        </div>
        <div className="flex gap-1.5">
          {MODES.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => {
                  setMode(item.value);
                  setError('');
                }}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] transition-colors ${
                  mode === item.value
                    ? 'border-primary/30 bg-primary/10 font-medium text-primary'
                    : 'border-border/70 text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-3.5 w-3.5" /> {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {mode === 'link' ? (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Input
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder={t('postings.linkPlaceholder')}
            className="sm:flex-1"
          />
          <Button onClick={read} disabled={busy || !ready} className="rounded-full">
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('postings.readPosting')}
          </Button>
        </div>
      ) : (
        <div className="mt-4">
          <Textarea
            rows={6}
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={t('postings.textPlaceholder')}
            className="text-[14px] leading-relaxed"
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[12px] text-muted-foreground">{t('postings.textKeptExact')}</p>
            <Button onClick={read} disabled={busy || !ready} className="rounded-full">
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('postings.useThisPosting')}
            </Button>
          </div>
        </div>
      )}

      {note && (
        <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50/70 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-amber-900">
          {note}
        </p>
      )}
      {error && (
        <p className="mt-3 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-destructive">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {error}
        </p>
      )}
    </section>
  );
}