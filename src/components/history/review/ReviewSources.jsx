import React from 'react';
import { Button } from '@/components/ui/button';
export default function ReviewSources({ sources, onAdd, destination, setDestination }) {
  return <aside className="min-w-0 space-y-4 rounded-xl border bg-secondary/30 p-4">
    <h3 className="font-heading text-xl">Original writings</h3><p className="text-xs text-muted-foreground">Drag any passage into an editable field, or choose a destination and click Add. Originals stay untouched until you approve.</p>
    <label className="block text-sm">Add passages to<select className="mt-2 w-full rounded-md border bg-card p-2" value={destination} onChange={e => setDestination(e.target.value)}>{['accomplishments','summary','skills','metrics','keywords'].map(key => <option key={key} value={key}>{key}</option>)}</select></label>
    {sources.map(source => {
      const passages = [source.raw_text, source.summary, ...(source.accomplishments || []), ...(source.skills || []).map(s => `Skill: ${s}`), ...(source.metrics || []), ...(source.keywords || []).map(s => `Keyword: ${s}`), ...(source.answers || []), ...(source.roles || []).map(r => `${r.title} (${r.dates || 'Dates unclear'})\n${(r.accomplishments || []).join('\n')}`), ...(source.duty_timeline || []).map(p => `${p.period}: ${p.title}\n${(p.duties || []).join('\n')}\n${(p.skills || []).join(', ')}`)].filter(Boolean).flatMap(t => t.split(/\n+/)).filter(t => t.trim());
      return <details key={source.id} open className="rounded-lg border bg-card p-3"><summary className="cursor-pointer text-sm font-medium">{source.title} · {source.organization}<span className="block text-xs font-normal text-muted-foreground">{[source.start_date, source.end_date].filter(Boolean).join(' – ')} · {source.location}</span></summary>
        <div className="mt-3 space-y-2">{passages.length ? passages.map((text, i) => <div key={i} draggable onDragStart={e => { e.dataTransfer.setData('text/plain', text); e.dataTransfer.effectAllowed = 'copy'; }} className="cursor-grab rounded border border-dashed p-2 text-xs leading-relaxed"><p className="whitespace-pre-wrap break-words">{text}</p><Button type="button" size="sm" variant="ghost" onClick={() => onAdd(text)}>Add</Button></div>) : <p className="text-xs text-muted-foreground">No additional writing saved for this entry.</p>}</div>
      </details>;
    })}
  </aside>;
}