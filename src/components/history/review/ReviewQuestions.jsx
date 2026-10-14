import React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import DictateButton from '@/components/common/DictateButton';
import { appendLine } from '@/hooks/useDictation';

export default function ReviewQuestions({ questions = [], answers = [], onChange, onApply, busy }) {
  return (
    <section className="space-y-3 rounded-xl border p-4">
      <h3 className="font-heading text-xl">Follow-up questions</h3>
      <p className="text-xs text-muted-foreground">
        Clarify when duties changed, who you worked for, and which skills belong to each period. Skip anything you cannot
        remember; unknown dates will not be guessed.
      </p>
      {!questions.length && <p className="text-sm">No further clarification requested. You can still edit the draft.</p>}
      {questions.map((question, i) => (
        <div key={i} className="space-y-2 text-sm">
          <span>{question}</span>
          <Textarea
            rows={2}
            value={answers[i] || ''}
            onChange={(e) => onChange(questions.map((_, n) => (n === i ? e.target.value : answers[n] || '')))}
            placeholder="Your answer, or leave blank to skip"
          />
          <DictateButton
            onText={(transcript) =>
              onChange(questions.map((_, n) => (n === i ? appendLine(answers[i], transcript) : answers[n] || '')))
            }
          />
        </div>
      ))}
      {!!questions.length && (
        <Button variant="secondary" disabled={busy || !answers.some((a) => a?.trim())} onClick={onApply}>
          Apply answers to draft
        </Button>
      )}
    </section>
  );
}