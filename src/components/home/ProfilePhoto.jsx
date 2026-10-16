import React, { useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import useSignedFile from '@/hooks/useSignedFile';

const FALLBACK_PORTRAIT = 'https://media.base44.com/images/public/6acfb4bf0fc7d7424c8470e5/77b781738_generated_77bce270.jpg';

// The portrait that styles marked "Portrait" place beside the name.
export default function ProfilePhoto({ profile, onSave }) {
  const { toast } = useToast();
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const preview = useSignedFile(profile.photo_uri);

  const report = (error) =>
    toast({
      title: 'Could not save your portrait',
      description: error?.response?.data?.error || error.message,
      variant: 'destructive'
    });

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
    <div className="mec-port">
      <div className="mec-ph">
        <img
          src={preview || FALLBACK_PORTRAIT}
          alt="Spotlighted portrait frame"
        />
      </div>

      <div>
        <p className="mec-pt">Portrait</p>
        <p className="mec-ps">
          Used by styles marked Portrait. The other styles leave it out.
        </p>
        <div className="mec-pb">
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="mec-btn mec-ghost mec-sm"
          >
            {profile.photo_uri ? 'Replace' : 'Upload'}
          </button>
          <button
            type="button"
            disabled={busy || !profile.photo_uri}
            onClick={remove}
            className="mec-btn mec-ghost mec-sm mec-quiet"
          >
            Remove
          </button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg"
          className="hidden"
          onChange={upload}
        />
      </div>
    </div>
  );
}