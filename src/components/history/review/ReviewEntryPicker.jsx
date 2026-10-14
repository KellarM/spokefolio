import React, { useEffect, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
const escape = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export default function ReviewEntryPicker({ anchor, selected, onChange, onStart, busy }) {
  const [search, setSearch] = useState(''); const [term, setTerm] = useState(''); const [all, setAll] = useState(false);
  useEffect(() => { const timer = setTimeout(() => setTerm(search), 300); return () => clearTimeout(timer); }, [search]);
  const { data, error, isPending, hasNextPage, fetchNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['review-candidates', anchor.id, term, all], initialPageParam: undefined,
    queryFn: async ({ pageParam }) => {
      const user = await base44.auth.me();
      const words = (anchor.title || '').split(/\W+/).filter(w => w.length > 3).map(escape);
      const pattern = term ? escape(term) : words.join('|') || escape(anchor.title || '');
      const match = { $regex: pattern, $options: 'i' };
      const clauses = [{ title: match }, { 'roles.title': match }, ...(term ? [{ organization: match }] : anchor.organization ? [{ organization: { $regex: `^${escape(anchor.organization)}$`, $options: 'i' } }] : [])];
      return base44.entities.CareerEntry.filter({ created_by_id: user.id, ...((all && !term) ? {} : { $or: clauses }) }, { limit: 50, sort: '-created_date', cursor: pageParam });
    }, getNextPageParam: page => page.has_more ? page.next_cursor : undefined
  });
  const toggle = entry => onChange(selected.some(s => s.id === entry.id) ? selected.filter(s => s.id !== entry.id) : [...selected, entry]);
  return <div className="space-y-4"><p className="text-sm text-muted-foreground">Choose related writings to scan. Similar titles and employers are suggested, not automatically merged. Different employers and distinct periods stay separate.</p>
    <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search titles or employers across your history" aria-label="Search career entries" />
    <Button variant="ghost" size="sm" onClick={() => setAll(!all)}>{all ? 'Show related entries' : 'Browse all entries'}</Button>
    <p className="text-sm font-medium">{selected.length} selected (up to 30)</p><div className="flex flex-wrap gap-2">{selected.map(s => <Button key={s.id} size="sm" variant="secondary" disabled={s.id === anchor.id} onClick={() => toggle(s)}>{s.title} · {s.organization || 'No employer'}{s.id !== anchor.id && ' ×'}</Button>)}</div>
    {isPending && <p role="status">Finding related entries…</p>}{error && <p role="alert" className="text-destructive">{error.message}</p>}
    <div className="space-y-2">{data?.pages.flatMap(p => p.items).map(entry => <label key={entry.id} className="flex items-start gap-3 rounded-lg border p-3 text-sm"><Checkbox checked={selected.some(s => s.id === entry.id)} disabled={entry.id === anchor.id || (selected.length >= 30 && !selected.some(s => s.id === entry.id))} onCheckedChange={() => toggle(entry)} /><span>{entry.title} · {entry.organization}<span className="block text-xs text-muted-foreground">{[entry.start_date, entry.end_date].filter(Boolean).join(' – ')} · {entry.summary}</span></span></label>)}</div>
    {!isPending && data?.pages[0]?.items.length === 0 && <p className="text-sm text-muted-foreground">No matching entries. Try another search or browse all entries.</p>}
    {hasNextPage && <Button variant="ghost" disabled={isFetchingNextPage} onClick={() => fetchNextPage()}>Load more</Button>}
    <Button disabled={busy || !selected.length} onClick={onStart}>{busy ? 'Organizing your history…' : 'Scan & organize selected entries'}</Button>
  </div>;
}