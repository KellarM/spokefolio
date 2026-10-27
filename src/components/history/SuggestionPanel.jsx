import React, { useEffect, useState } from 'react';
import { Check, ChevronRight, Loader2, MessageSquarePlus, Mic, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import DictateButton from '@/components/common/DictateButton';
import { appendLine } from '@/hooks/useDictation';
import usePromptVoice from '@/hooks/usePromptVoice';

export default function SuggestionPanel({ entry, busy, onSubmit, onFinish }) {
  const suggestions = entry.suggestions || [];
  const index = entry.suggestion_index || 0;
  const current = suggestions[index];
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState('');

  // Voice Mode for the prompts: the panel speaks each question, the client
  // answers out loud - the detail itself, or no / next / save / close.
  const voice = usePromptVoice({
    getPrompt: () => current || '',
    onAnswer: async (decision, text) => {
      if (decision === 'yes') setComment(text);
      await onSubmit({ decision, comment: text });
    },
    onFinish
  });

  useEffect(() => {
    setShowComment(false);
    setComment('');
  }, [index]);

  if (!suggestions.length) {
    return (
      <div className="paper rounded-2xl p-5">
        <p className="eyebrow">Follow-up prompts</p>
        <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">
          No prompts for this entry. Review what you captured, then save it.
        </p>
        <Button onClick={onFinish} className="mt-4 w-full rounded-full">
          <Check className="mr-2 h-4 w-4" /> Save this entry
        </Button>
      </div>
    );
  }

  if (index >= suggestions.length) {
    return (
      <div className="paper rounded-2xl p-5">
        <p className="eyebrow">Follow-up prompts</p>
        <h3 className="mt-3 font-heading text-[20px]">You have been through every prompt.</h3>
        <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
          Anything else worth adding? Type it into the entry on the left, then save it and dictate your next one.
        </p>
        <Button onClick={onFinish} className="mt-4 w-full rounded-full">
          <Check className="mr-2 h-4 w-4" /> Save this entry
        </Button>
      </div>
    );
  }

  return (
    <div className="paper sticky top-6 rounded-2xl p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="eyebrow">Follow-up prompts</p>
        <span className="text-[11.5px] text-muted-foreground">
          {index + 1} of {suggestions.length}
        </span>
      </div>

      <div className="mt-3 flex gap-1">
        {suggestions.map((_, dot) => (
          <span
            key={dot}
            className={`h-1 flex-1 rounded-full ${dot < index ? 'bg-accent/60' : dot === index ? 'bg-accent' : 'bg-border'}`}
          />
        ))}
      </div>

      <p key={index} className="animate-rise mt-5 font-heading text-[19px] leading-snug">
        {current}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {voice.active ? (
          <>
            <Button type="button" onClick={voice.stopSession} className="dictate-voice-live rounded-full">
              <Mic className="mr-2 h-3.5 w-3.5" /> Stop Voice Mode
            </Button>
            <span className="text-[11.5px] text-muted-foreground">
              {voice.phase === 'speaking' ? 'Speaking…' : voice.phase === 'listening' ? 'Listening…' : voice.phase === 'writing' ? 'Writing it down…' : ''}
            </span>
          </>
        ) : (
          <>
            <Button
              type="button"
              onClick={voice.startSession}
              disabled={busy}
              className="dictate-voice rounded-full"
            >
              <Mic className="mr-2 h-3.5 w-3.5" /> Voice Mode
            </Button>
            <span className="text-[11.5px] text-muted-foreground">
              I read each prompt aloud - answer with the detail, or say no, next, save, or close.
            </span>
          </>
        )}
      </div>

      {showComment ? (
        <div className="mt-4 space-y-3">
          <Textarea
            autoFocus
            rows={4}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Add the detail — numbers, tools, scope, who it helped…"
            className="text-[14px]"
          />
          <DictateButton onText={(transcript) => setComment(appendLine(comment, transcript))} />
          <div className="flex gap-2">
            <Button
              className="flex-1 rounded-full"
              disabled={busy || !comment.trim()}
              onClick={() => onSubmit({ decision: 'yes', comment: comment.trim() })}
            >
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
              Add to this entry
            </Button>
            <Button variant="ghost" className="rounded-full" onClick={() => setShowComment(false)}>
              Back
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-5 space-y-2">
          <Button className="w-full justify-start rounded-full" onClick={() => setShowComment(true)} disabled={busy}>
            <MessageSquarePlus className="mr-2 h-4 w-4" /> Yes — and here is the detail
          </Button>
          <Button
            variant="secondary"
            className="w-full justify-start rounded-full"
            onClick={() => onSubmit({ decision: 'no' })}
            disabled={busy}
          >
            <X className="mr-2 h-4 w-4" /> No
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start rounded-full text-muted-foreground"
            onClick={() => onSubmit({ decision: 'next' })}
            disabled={busy}
          >
            <ChevronRight className="mr-2 h-4 w-4" /> Next prompt
          </Button>
        </div>
      )}
    </div>
  );
}