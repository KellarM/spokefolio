import React from 'react';
import { Textarea } from '@/components/ui/textarea';
export default function ReviewField({ label, value, onChange, list = false, rows = 3 }) {
  const text = list ? (value || []).join('\n') : value || '';
  const update = next => onChange(list ? next.split('\n') : next);
  return <label className="block space-y-2 text-sm"><span className="font-medium">{label}{list && <span className="ml-2 text-xs text-muted-foreground">One per line</span>}</span>
    <Textarea value={text} rows={rows} onChange={e => update(e.target.value)} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); const passage = e.dataTransfer.getData('text/plain'); if (passage) update([text, passage].filter(Boolean).join('\n')); }} />
  </label>;
}