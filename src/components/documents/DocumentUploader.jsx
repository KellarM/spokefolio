import React, { useRef, useState } from 'react';
import { FileUp, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const TYPES = [
  { value: 'previous_resume', label: 'Previous résumé' },
  { value: 'project', label: 'Project document' },
  { value: 'testimonial', label: 'Customer praise / testimonial' },
  { value: 'certification', label: 'Certification' },
  { value: 'other', label: 'Other' }
];

export default function DocumentUploader({ onChanged }) {
  const { toast } = useToast();
  const inputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [docType, setDocType] = useState('previous_resume');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  const upload = async () => {
    if (!files.length) return;
    setBusy(true);
    try {
      for (const file of files) {
        const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
        const created = await base44.entities.SupportingDocument.create({
          name: file.name,
          doc_type: docType,
          notes,
          file_uri,
          status: 'processing'
        });
        base44.functions.invoke('extractDocumentReference', {
          document_id: created.id,
          file_uri,
          name: file.name,
          doc_type: docType
        });
      }
      setFiles([]);
      setNotes('');
      if (inputRef.current) inputRef.current.value = '';
      onChanged();
      toast({ title: 'Files added', description: 'Reading them now so their highlights can be reused.' });
    } catch (error) {
      toast({ title: 'Upload failed', description: error?.response?.data?.error || error.message, variant: 'destructive' });
    }
    setBusy(false);
  };

  return (
    <div className="paper rounded-2xl p-5 sm:p-6">
      <p className="eyebrow">Add reference material</p>
      <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
        Previous résumés, project write-ups, customer praise, certifications. I read them and reuse the real detail when
        tailoring a résumé.
      </p>

      <label
        htmlFor="documents-input"
        className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border px-6 py-8 text-center transition-colors hover:border-accent/50 hover:bg-secondary/40"
      >
        <FileUp className="h-5 w-5 text-muted-foreground" strokeWidth={1.6} />
        <span className="mt-3 text-[14px]">Choose files</span>
        <span className="mt-1 text-[12px] text-muted-foreground">PDF, Word, text or images</span>
        <input
          id="documents-input"
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(event) => setFiles(Array.from(event.target.files || []))}
        />
      </label>

      {files.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {files.map((file) => (
            <li key={file.name} className="truncate rounded-lg bg-secondary px-3 py-2 text-[12.5px]">
              {file.name}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <Label className="eyebrow">What is it</Label>
          <div className="mt-2">
            <Select value={docType} onValueChange={setDocType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label htmlFor="document-notes" className="eyebrow">
            Note (optional)
          </Label>
          <Input
            id="document-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="2019 résumé, Acme project brief…"
            className="mt-2"
          />
        </div>
      </div>

      <Button onClick={upload} disabled={busy || !files.length} className="mt-5 rounded-full">
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileUp className="mr-2 h-4 w-4" />}
        Upload and read
      </Button>
    </div>
  );
}