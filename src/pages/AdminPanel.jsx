import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Database, RefreshCw, ShieldCheck, Trash2 } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

const ENTITIES = [
  { name: 'CareerEntry', label: 'Career entries' },
  { name: 'CareerHistoryReview', label: 'History reviews' },
  { name: 'JobApplication', label: 'Applications' },
  { name: 'JobPosting', label: 'Job postings' },
  { name: 'ResumeProfile', label: 'Resume profiles' },
  { name: 'SupportingDocument', label: 'Reference documents' },
];

export default function AdminPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [confirmScope, setConfirmScope] = useState(null); // 'mine' | 'all'
  const [confirmText, setConfirmText] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [error, setError] = useState('');

  const isAdmin = user?.role === 'admin';

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const mine = await base44.functions.invoke('adminResetData', { mode: 'stats', scope: 'mine' });
      const all = await base44.functions.invoke('adminResetData', { mode: 'stats', scope: 'all' });
      setStats({ mine: mine.results, all: all.results, at: all.at });
    } catch (e) {
      setError(e?.message || 'Could not load record counts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) loadStats();
  }, [isAdmin, loadStats]);

  const runReset = async () => {
    setResetting(true);
    setError('');
    try {
      const response = await base44.functions.invoke('adminResetData', {
        mode: 'reset',
        scope: confirmScope,
      });
      setReceipt({ scope: confirmScope, results: response.results, at: response.at });
      setConfirmScope(null);
      setConfirmText('');
      await loadStats();
    } catch (e) {
      setError(e?.message || 'Reset failed.');
    } finally {
      setResetting(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <ShieldCheck className="mx-auto h-10 w-10 text-muted-foreground" />
        <h1 className="mt-4 text-xl font-semibold">Admin access required</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your account does not have the admin role for this studio.
        </p>
      </div>
    );
  }

  const total = (scope) =>
    Object.values(stats?.[scope] || {}).reduce((sum, n) => sum + (n || 0), 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Testing console</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Reset the studio to a fresh state before a test run. User accounts are never
          deleted, only the data inside them.
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="h-4 w-4" /> Record counts
          </CardTitle>
          <CardDescription>
            Live counts per entity. Yours reflects your account; total covers every user.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && !stats ? (
            <p className="text-sm text-muted-foreground">Loading counts...</p>
          ) : stats ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Entity</th>
                  <th className="py-2 pr-4 text-right font-medium">Yours</th>
                  <th className="py-2 text-right font-medium">All users</th>
                </tr>
              </thead>
              <tbody>
                {ENTITIES.map(({ name, label }) => (
                  <tr key={name} className="border-b last:border-0">
                    <td className="py-2 pr-4">{label}</td>
                    <td className="py-2 pr-4 text-right font-mono">
                      {stats.mine?.[name] ?? '–'}
                    </td>
                    <td className="py-2 text-right font-mono">
                      {stats.all?.[name] ?? '–'}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td className="py-2 pr-4 font-medium">Total</td>
                  <td className="py-2 pr-4 text-right font-mono font-medium">{total('mine')}</td>
                  <td className="py-2 text-right font-mono font-medium">{total('all')}</td>
                </tr>
              </tbody>
            </table>
          ) : (
            <Button variant="outline" size="sm" onClick={loadStats}>
              <RefreshCw className="mr-2 h-3.5 w-3.5" /> Load counts
            </Button>
          )}
          {stats && (
            <Button variant="outline" size="sm" className="mt-4" onClick={loadStats} disabled={loading}>
              <RefreshCw className="mr-2 h-3.5 w-3.5" /> Refresh
            </Button>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Reset my data</CardTitle>
            <CardDescription>
              Wipes every record in your own account across all six entities. Your
              login stays; the studio starts blank.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={() => setConfirmScope('mine')} disabled={resetting}>
              <Trash2 className="mr-2 h-4 w-4" /> Reset my data
            </Button>
          </CardContent>
        </Card>

        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-destructive" /> Reset ALL data
            </CardTitle>
            <CardDescription>
              Wipes every user&apos;s records across all six entities. True fresh-install
              state. This cannot be undone.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={() => setConfirmScope('all')}
              disabled={resetting}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Reset ALL data
            </Button>
          </CardContent>
        </Card>
      </div>

      {receipt && (
        <Card className="border-emerald-600/40">
          <CardHeader>
            <CardTitle className="text-base text-emerald-700">Reset complete</CardTitle>
            <CardDescription>
              {receipt.scope === 'all' ? 'All user data' : 'Your data'} wiped at{' '}
              {new Date(receipt.at).toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-1 text-sm sm:grid-cols-2">
              {Object.entries(receipt.results).map(([name, n]) => {
                const label = ENTITIES.find((e) => e.name === name)?.label || name;
                return (
                  <li key={name} className="flex justify-between border-b py-1 last:border-0">
                    <span>{label}</span>
                    <span className="font-mono">{n} deleted</span>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!confirmScope} onOpenChange={(open) => { if (!open) { setConfirmScope(null); setConfirmText(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmScope === 'all' ? 'Wipe ALL user data?' : 'Wipe your data?'}
            </DialogTitle>
            <DialogDescription>
              {confirmScope === 'all'
                ? 'This deletes every record for every user across all six entities. There is no undo.'
                : 'This deletes every record in your account across all six entities. There is no undo.'}
              {' '}Type RESET to confirm.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="RESET"
            onKeyDown={(e) => { if (e.key === 'Enter' && confirmText === 'RESET') runReset(); }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setConfirmScope(null); setConfirmText(''); }} disabled={resetting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={confirmText !== 'RESET' || resetting}
              onClick={runReset}
            >
              {resetting ? 'Wiping...' : 'Wipe now'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
