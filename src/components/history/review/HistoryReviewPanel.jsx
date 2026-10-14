import React, { useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
export default function HistoryReviewPanel({ revision, onOpen, onRestore }) {
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const { data, error: loadError, isPending, fetchNextPage, hasNextPage } = useInfiniteQuery({ queryKey: ['history-reviews', revision], initialPageParam: undefined,
    queryFn: async ({ pageParam }) => { const user = await base44.auth.me(); return base44.entities.CareerHistoryReview.filter({ created_by_id: user.id, status: { $ne: 'restored' } }, { limit: 20, sort: '-created_date', fields: ['title','status'], cursor: pageParam }); },
    getNextPageParam: page => page.has_more ? page.next_cursor : undefined });
  const act = async (item, restore = false) => {
    if (restore && !window.confirm('Restore the original entries and remove the organized replacements? Later edits to replacements must be preserved separately first.')) return;
    setBusy(true); setError('');
    try { if (restore) await onRestore(item); else await onOpen(await base44.entities.CareerHistoryReview.get(item.id)); } catch (e) { setError(e?.response?.data?.error || e.message); } finally { setBusy(false); }
  };
  return <details className="mt-5 rounded-xl border bg-card p-4"><summary className="cursor-pointer text-sm font-medium">Saved reviews & original backups</summary>
    <div className="mt-4 space-y-3">{isPending && <p className="text-sm">Loading reviews…</p>}{(error || loadError) && <p className="text-sm text-destructive" role="alert">{error || loadError.message}</p>}
      {!isPending && data?.pages[0]?.items.length === 0 && <p className="text-sm text-muted-foreground">Reviews and recoverable originals will appear here.</p>}
      {data?.pages.flatMap(p => p.items).map(item => <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"><div><p className="text-sm font-medium">{item.title}</p><p className="text-xs text-muted-foreground">{item.status === 'draft' ? 'Draft — originals unchanged' : item.status === 'applied' ? 'Accepted — originals backed up' : 'Interrupted — resume or restore'}</p></div><div className="flex gap-2">
        {['draft','applying'].includes(item.status) && <Button size="sm" variant="secondary" disabled={busy} onClick={() => act(item)}>{item.status === 'draft' ? 'Continue review' : 'Resume replacement'}</Button>}
        {['applied','applying','restoring'].includes(item.status) && <Button size="sm" variant="outline" disabled={busy} onClick={() => act(item, true)}>Restore originals</Button>}
      </div></div>)}
      {hasNextPage && <Button variant="ghost" size="sm" onClick={() => fetchNextPage()}>Load more reviews</Button>}
    </div></details>;
}