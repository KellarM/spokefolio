import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Database, Lock, RefreshCw, ShieldCheck, Trash2 } from 'lucide-react';
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

const UNLOCKED_KEY = 'sf_admin_unlocked';

export default function AdminPanel() {
  const { user } = useAuth();
  const roleAdmin = user?.role === 'admin';

  const [unlocked, setUnlocked] = useState(
    () => roleAdmin || sessionStorage.getItem(UNLOCKED_KEY) === '1'
  );
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [unlocking, setUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState('');

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [confirmScope, setConfirmScope] = useState(null); // 'mine' | 'all'
  const [confirmText, setConfirmText] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [error, setError] = useState('');

  const passwordAdmin = unlocked && !roleAdmin;
  const canResetMine = roleAdmin; // password logins have no account of their own

  const adminCredentials = () =>
    unlocked && !roleAdmin
      ? {
          admin_login: sessionStorage.getItem('sf_admin_login') || '',
          admin_password: sessionStorage.getItem('sf_admin_pw') || '',
        }
      : {};

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const all = await base44.functions.invoke('adminResetData', {
        mode: 'stats',
        scope: 'all',
        ...adminCredentials(),
      });
      let mine = null;
      if (roleAdmin) {
        const own = await base44.functions.invoke('adminResetData', {
          mode: 'stats',
          scope: 'mine',
          ...adminCredentials(),
        });
        mine = own.results;
      }
      setStats({ mine, all: all.results, at: all.at });
    } catch (e) {
      setError(e?.message || 'Could not load record counts.');
    } finally {
      setLoading(false);
    }
  }, [roleAdmin, unlocked]);

  useEffect(() => {
    if (unlocked) loadStats();
  }, [unlocked, loadStats]);

  const unlock = async () => {
    setUnlocking(true);
    setUnlockError('');
    try {
      await base44.functions.invoke('adminResetData', {
        mode: 'verify',
        admin_login: login,
        admin_password: password,
      });
      sessionStorage.setItem(UNLOCKED_KEY, '1');
      sessionStorage.setItem('sf_admin_login', login);
      sessionStorage.setItem('sf_admin_pw', password);
      setUnlocked(true);
      setLogin('');
      setPassword('');
    } catch (e) {
      setUnlockError(e?.message || 'Invalid admin login or password.');
    } finally {
      setUnlocking(false);
    }
  };

  const runReset = async () => {
    setResetting(true);
    setError('');
    try {
      const response = await base44.functions.invoke('adminResetData', {
        mode: 'reset',
        scope: confirmScope,
        ...adminCredentials(),
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

  // --- Password gate: no account needed ---
  if (!unlocked) {
    return (
      <div className="mx-auto max-w-md py-16">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Lock className="h-4 w-4" /> Admin console
            </CardTitle>
            <CardDescription>
              Sign in with your admin credentials. No account or email required.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              placeholder="Login"
              autoComplete="username"
            />
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && login && password) unlock(); }}
              placeholder="Password"
              autoComplete="current-password"
            />
            {unlockError && <p className="text-sm text-destructive">{unlockError}</p>}
            <Button className="w-full" onClick={unlock} disabled={!login || !password || unlocking}>
              {unlocking ? 'Signing in...' : 'Sign in'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const total = (rows) =>
    Object.values(rows || {}).reduce((sum, n) => sum + (n || 0), 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Testing console</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Reset the studio to a fresh state before a test run. User accounts are never
          deleted, only the data inside them.
          {passwordAdmin && ' You are signed in as Admin.'}
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
            {roleAdmin
              ? 'Live counts per entity. Yours reflects your account; total covers every user.'
              : 'Live counts per entity across every user.'}
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
                  {roleAdmin && <th className="py-2 pr-4 text-right font-medium">Yours</th>}
                  <th className="py-2 text-right font-medium">All users</th>
                </tr>
              </thead>
              <tbody>
                {ENTITIES.map(({ name, label }) => (
                  <tr key={name} className="border-b last:border-0">
                    <td className="py-2 pr-4">{label}</td>
                    {roleAdmin && <td className="py-2 pr-4 text-right font-mono">{stats.mine?.[name] ?? '–'}</td>}
                    <td className="py-2 text-right font-mono">{stats.all?.[name] ?? '–'}</td>
                  </tr>
                ))}
                <tr>
                  <td className="py-2 pr-4 font-medium">Total</td>
                  {roleAdmin && <td className="py-2 pr-4 text-right font-mono font-medium">{total(stats.mine)}</td>}
                  <td className="py-2 text-right font-mono font-medium">{total(stats.all)}</td>
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
        {canResetMine && (
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
        )}

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

      {!roleAdmin && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" />
          Credentials are checked server-side. Change them any time via the
          ADMIN_RESET_LOGIN / ADMIN_RESET_PASSWORD secrets in the Base44 editor.
        </p>
      )}
    </div>
  );
}
