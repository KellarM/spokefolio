import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import ReviewField from '@/components/history/review/ReviewField';
import DutyTimelineEditor from '@/components/history/review/DutyTimelineEditor';
export default function ReviewDraftEditor({ entry, onChange }) {
  const set = patch => onChange({ ...entry, ...patch });
  return <div className="space-y-5 rounded-xl border bg-card p-4"><h3 className="font-heading text-xl">Organized draft</h3>
    <div className="grid gap-3 sm:grid-cols-2">{[['title','Role / title'],['organization','Employer'],['location','Location'],['start_date','Start'],['end_date','End']].map(([key,label]) => <label key={key} className="text-sm">{label}<Input className="mt-1" value={entry[key] || ''} onChange={e => set({ [key]: e.target.value })} /></label>)}</div>
    <ReviewField label="Summary" value={entry.summary} onChange={summary => set({ summary })} />
    <DutyTimelineEditor value={entry.duty_timeline || []} onChange={duty_timeline => set({ duty_timeline })} />
    {[['accomplishments','Duties & accomplishments'],['skills','Skills & tools'],['metrics','Numbers to keep'],['keywords','Keywords']].map(([key,label]) => <ReviewField key={key} label={label} list value={entry[key]} onChange={value => set({ [key]: value })} />)}
    {entry.grouped && <section className="space-y-3"><h4 className="font-medium">Roles inside this employer</h4>{(entry.roles || []).map((role,i) => <div key={i} className="space-y-2 rounded-lg border p-3">
      {['title','dates'].map(key => <label className="block text-sm" key={key}>{key}<Input value={role[key] || ''} onChange={e => set({ roles: entry.roles.map((r,n) => n === i ? { ...r, [key]: e.target.value } : r) })} /></label>)}
      <ReviewField label="Role accomplishments" list value={role.accomplishments} onChange={accomplishments => set({ roles: entry.roles.map((r,n) => n === i ? { ...r, accomplishments } : r) })} />
      <Button size="sm" variant="ghost" onClick={() => set({ roles: entry.roles.filter((_,n) => n !== i) })}>Remove role</Button>
    </div>)}<Button size="sm" variant="secondary" onClick={() => set({ roles: [...(entry.roles || []), { title: '', dates: '', accomplishments: [] }] })}>Add role</Button></section>}
  </div>;
}