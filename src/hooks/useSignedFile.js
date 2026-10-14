import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

// Turns a privately stored file into a temporary link the screen can show.
export default function useSignedFile(fileUri, expiresIn = 3600) {
  const [url, setUrl] = useState('');

  useEffect(() => {
    let active = true;

    if (!fileUri) {
      setUrl('');
      return () => {
        active = false;
      };
    }

    base44.integrations.Core.CreateFileSignedUrl({ file_uri: fileUri, expires_in: expiresIn })
      .then(({ signed_url }) => {
        if (active) setUrl(signed_url);
      })
      .catch(() => {
        if (active) setUrl('');
      });

    return () => {
      active = false;
    };
  }, [fileUri, expiresIn]);

  return url;
}