import React from 'react';
import { Download, Loader2, PenLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import DictateButton from '@/components/common/DictateButton';
import { appendLine } from '@/hooks/useDictation';

export default function CoverLetterSection({ value, onChange, company, onDownload, downloading, onGenerate, generating }) {
  const hasLetter = Boolean((value || '').trim());

  return (
    <section className="mt-6 rounded-2xl border border-border/70 bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Label htmlFor="cover-letter" className="eyebrow">
            Cover letter
          </Label>
          <p className="mt-1.5 text-[12.5px] text-muted-foreground">
            Written for {company || 'this employer'} from your history. Edit it here, then send it as Word.
          </p>
        </div>
        {hasLetter ? (
          <Button variant="secondary" className="rounded-full" onClick={onDownload} disabled={downloading}>
            {downloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Download cover letter
          </Button>
        ) : (
          <Button className="rounded-full" onClick={onGenerate} disabled={generating}>
            {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PenLine className="mr-2 h-4 w-4" />}
            Write cover letter
          </Button>
        )}
      </div>

      <Textarea
        id="cover-letter"
        rows={14}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Your cover letter will appear here."
        className="mt-4 text-[14px] leading-relaxed"
      />
      <DictateButton className="mt-2" onText={(transcript) => onChange(appendLine(value, transcript))} />
    </section>
  );
}