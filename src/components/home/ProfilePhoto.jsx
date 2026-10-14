import React, { useRef, useState } from 'react';
import { Loader2, Trash2, Upload, UserRound } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Image } from '@/components/ui/image';
import useSignedFile from '@/hooks/useSignedFile';

// The portrait that styles marked "Portrait" place beside the name.
export default function ProfilePhoto({ profile, onSave }) {
  const { toast } = useToast();
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const preview = useSignedFile(profile.photo_uri);

  const report = (error) =>
    toast({ title: 'Could not save your portrait', description: error?.response?.data?.error || error.message, variant: 'destructive' });

  const upload = async (event) => {
    const file = event.target.files?.[0];
    if (inputRef.current) inputRef.current.value = '';
    if (!file) return;
    setBusy(true);
    try {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      await onSave({ photo_uri: file_uri });
      toast({ title: 'Portrait saved', description: 'Styles marked Portrait now show it beside your name.' });
    } catch (error) {
      report(error);
    }
    setBusy(false);
  };

  const remove = async () => {
    setBusy(true);
    try {
      await onSave({ photo_uri: '' });
      toast({ title: 'Portrait removed', description: 'Résumés now open with your name only.' });
    } catch (error) {
      report(error);
    }
    setBusy(false);
  };

  return (
    <div className="mt-5 flex items-center gap-4 border-t border-border/70 pt-5">
      <div className="flex h-16 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border/70 bg-secondary">
        {preview ? (
          <Image src={preview} alt="Portrait" fittingType="fill" focalPointX={0.5} focalPointY={0.3} className="h-full w-full" />
        ) : (
          <UserRound className="h-5 w-5 text-muted-foreground" strokeWidth={1.6} />
        )}
      </div>

      <div className="min-w-0">
        <p className="text-[13.5px] font-medium">Portrait</p>
        <p className="mt-0.5 text-[12px] leading-snug text-muted-foreground">
          Used by styles marked Portrait. The other styles leave it out.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" disabled={busy} onClick={() => inputRef.current?.click()} className="rounded-full">
            {busy ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Upload className="mr-1.5 h-3.5 w-3.5" />}
            {profile.photo_uri ? 'Replace' : 'Upload'}
          </Button>
          {profile.photo_uri && (
            <Button variant="ghost" size="sm" disabled={busy} onClick={remove} className="rounded-full text-muted-foreground">
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Remove
            </Button>
          )}
        </div>
        <input ref={inputRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={upload} />
      </div>
    </div>
  );
}