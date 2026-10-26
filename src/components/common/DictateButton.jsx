import React from 'react';
import { Loader2, Mic, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import useDictation from '@/hooks/useDictation';
import { cn } from '@/lib/utils';

// A small microphone for any writing field: tap, talk, and the words are written in.
// Pass label={null} for the icon-only version.
export default function DictateButton({ onText, label = 'Tap to Talk', className }) {
  const { recording, busy, seconds, start, stop } = useDictation(onText);
  const clock = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  const text = recording ? `Stop · ${clock}` : busy ? 'Writing your words…' : label;

  return (
    <Button
      type="button"
      size="sm"
      variant={recording ? 'default' : 'ghost'}
      onClick={recording ? stop : start}
      disabled={busy}
      aria-label={recording ? 'Stop talking' : 'Tap to talk'}
      className={cn(
        'rounded-full',
        recording ? 'dictate-live' : 'dictate-tap',
        label ? 'text-muted-foreground hover:text-foreground' : 'h-8 w-8 shrink-0 px-0 text-muted-foreground hover:text-foreground',
        className
      )}
    >
      {busy ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : recording ? (
        <Square className="h-3.5 w-3.5" />
      ) : (
        <Mic className="h-3.5 w-3.5" />
      )}
      {label ? <span>{text}</span> : null}
    </Button>
  );
}