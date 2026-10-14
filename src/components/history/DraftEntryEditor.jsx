import React from 'react';
import { Check, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import BulletListEditor from '@/components/editors/BulletListEditor';
import TagInput from '@/components/editors/TagInput';
import SuggestionPanel from '@/components/history/SuggestionPanel';
import DutyTimelineEditor from '@/components/history/review/DutyTimelineEditor';

const TYPES = [
  { value: 'work', label: 'Work experience' },
  { value: 'project', label: 'Project' },
  { value: 'education', label: 'Education' },
  { value: 'certification', label: 'Certification' },
  { value: 'achievement', label: 'Achievement' },
  { value: 'testimonial', label: 'Customer praise' },
  { value: 'skill', label: 'Skill' },
  { value: 'other', label: 'Other' }
];

function Field({ label, children }) {
  return (
    <div>
      <Label className="eyebrow">{label}</Label>
      <div className="mt-2">{children}</div>
    </div>
  );
}

export default function DraftEntryEditor({ entry, busy, onChange, onAnswer, onSave, onDiscard }) {
  const set = (patch) => onChange(patch);
  const note = entry.status === 'confirmed' ? 'Saved entry' : 'Entry in progress';

  return (
    <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
      <div className="paper animate-rise rounded-2xl p-5 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="eyebrow">{note}</p>
            <h2 className="mt-2 font-heading text-[24px] leading-snug">{entry.title || 'Untitled entry'}</h2>
          </div>
          <Button variant="ghost" size="sm" className="rounded-full text-muted-foreground" onClick={onDiscard}>
            <Trash2 className="mr-2 h-3.5 w-3.5" /> Discard
          </Button>
        </div>

        <div className="mt-6 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Type">
              <Select value={entry.entry_type || 'work'} onValueChange={(value) => set({ entry_type: value })}>
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
            </Field>
            <Field label="Role or title">
              <Input value={entry.title || ''} onChange={(e) => set({ title: e.target.value })} />
            </Field>
            <Field label="Employer / client">
              <Input value={entry.organization || ''} onChange={(e) => set({ organization: e.target.value })} />
            </Field>
            <Field label="Location">
              <Input value={entry.location || ''} onChange={(e) => set({ location: e.target.value })} placeholder="Toronto, ON · Remote" />
            </Field>
            <Field label="Start">
              <Input value={entry.start_date || ''} onChange={(e) => set({ start_date: e.target.value })} placeholder="Mar 2019" />
            </Field>
            <Field label="End">
              <Input value={entry.end_date || ''} onChange={(e) => set({ end_date: e.target.value })} placeholder="Present" />
            </Field>
          </div>

          {entry.grouped && (
            <div className="rounded-xl border border-accent/25 bg-accent/5 px-4 py-3">
              <p className="eyebrow">Roles inside this employer</p>
              <ul className="mt-3 space-y-3">
                {(entry.roles || []).map((role, index) => (
                  <li key={index}>
                    <p className="text-[13.5px] font-medium text-foreground">
                      {role.title || 'Role'}
                      {role.dates ? <span className="ml-2 font-normal text-muted-foreground">{role.dates}</span> : null}
                    </p>
                    <ul className="mt-1 space-y-1 text-[12.5px] text-muted-foreground">
                      {(role.accomplishments || []).map((bullet, bulletIndex) => (
                        <li key={bulletIndex}>• {bullet}</li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[12px] text-muted-foreground">
                These roles stay together as one employer on every tailored resume.
              </p>
            </div>
          )}

          <Field label="Summary">
            <Textarea rows={2} value={entry.summary || ''} onChange={(e) => set({ summary: e.target.value })} />
          </Field>

          {!!entry.duty_timeline?.length && <DutyTimelineEditor value={entry.duty_timeline} onChange={(duty_timeline) => set({ duty_timeline })} />}

          <Field label="Accomplishments">
            <BulletListEditor
              items={entry.accomplishments || []}
              onChange={(values) => set({ accomplishments: values })}
              placeholder="Add an accomplishment"
            />
          </Field>

          <Field label="Skills and tools">
            <TagInput tags={entry.skills || []} onChange={(values) => set({ skills: values })} />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Numbers to keep">
              <TagInput tags={entry.metrics || []} onChange={(values) => set({ metrics: values })} placeholder="18% cost cut" />
            </Field>
            <Field label="Keywords">
              <TagInput tags={entry.keywords || []} onChange={(values) => set({ keywords: values })} />
            </Field>
          </div>

          {Array.isArray(entry.answers) && entry.answers.length > 0 && (
            <details className="rounded-xl border border-border/70 px-4 py-3">
              <summary className="cursor-pointer text-[13px] text-muted-foreground">
                Prompt history ({entry.answers.length})
              </summary>
              <ul className="mt-3 space-y-1.5 text-[12.5px] text-muted-foreground">
                {entry.answers.map((answer, index) => (
                  <li key={index}>{answer}</li>
                ))}
              </ul>
            </details>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            <Button onClick={onSave} disabled={busy} className="rounded-full">
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
              Save entry
            </Button>
            <p className="self-center text-[12px] text-muted-foreground">
              Edits save automatically; saving confirms this entry in your master history.
            </p>
          </div>
        </div>
      </div>

      <SuggestionPanel entry={entry} busy={busy} onSubmit={onAnswer} onFinish={onSave} />
    </div>
  );
}