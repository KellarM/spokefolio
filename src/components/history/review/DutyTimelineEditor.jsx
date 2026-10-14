import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ReviewField from '@/components/history/review/ReviewField';
export default function DutyTimelineEditor({ value = [], onChange }) {
  const patch = (index, data) => onChange(value.map((p, i) => i === index ? { ...p, ...data } : p));
  return <section className="space-y-3"><h3 className="font-heading text-lg">Duties & skills over time</h3><p className="text-xs text-muted-foreground">Separate periods of responsibility. Leave uncertain dates marked for clarification.</p>
    {value.map((period, i) => <div className="space-y-3 rounded-lg border p-3" key={i}>
      <label className="block text-sm">Time period<Input className="mt-1" value={period.period || ''} placeholder="Dates or period needs clarification" onChange={e => patch(i, { period: e.target.value })} /></label>
      <label className="block text-sm">Role / phase<Input className="mt-1" value={period.title || ''} onChange={e => patch(i, { title: e.target.value })} /></label>
      <ReviewField label="Duties in this period" value={period.duties} list onChange={duties => patch(i, { duties })} />
      <ReviewField label="Skills in this period" value={period.skills} list onChange={skills => patch(i, { skills })} />
      <Button variant="ghost" size="sm" onClick={() => onChange(value.filter((_, n) => n !== i))}>Remove period</Button>
    </div>)}
    <Button size="sm" variant="secondary" onClick={() => onChange([...value, { period: '', title: '', duties: [], skills: [] }])}>Add time period</Button>
  </section>;
}