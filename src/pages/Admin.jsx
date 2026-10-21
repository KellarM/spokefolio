import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Lock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';

const DAY_LABEL = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function StatTile({ label, value, hint }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export default function Admin() {
  const [password, setPassword] = useState('');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const unlock = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setStats(null);
    try {
      const response = await base44.functions.invoke('getAdminStats', { password });
      const payload = response.data || null;
      if (!payload || !Array.isArray(payload.daily)) {
        throw new Error(payload?.error || 'Stats unavailable. Try again in a moment.');
      }
      setStats(payload);
    } catch (err) {
      setError(err.message || 'Wrong admin password.');
    }
    setLoading(false);
  };

  useEffect(() => {
    document.title = 'Admin · Spokefolio';
  }, []);

  if (!stats) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <form onSubmit={unlock} className="w-full max-w-sm rounded-2xl border border-border bg-card p-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary mb-4">
            <Lock className="w-5 h-5 text-primary-foreground" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Studio admin</h1>
          <p className="mt-1 text-sm text-muted-foreground">Enter the admin password to see activity stats.</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="sf-field mt-5 w-full rounded-lg px-3 py-2.5 text-sm"
            placeholder="Admin password"
            autoFocus
          />
          {error && (
            <p className="mt-3 text-sm text-destructive">{error}</p>
          )}
          <Button type="submit" className="w-full mt-4 h-11" disabled={loading || !password}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />}
            Unlock stats
          </Button>
        </form>
      </div>
    );
  }

  const maxDaily = Math.max(1, ...stats.daily.map((d) => d.opens + d.actions));

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Studio admin</h1>
          <p className="text-sm text-muted-foreground mt-1">Activity across the Spokefolio app.</p>
        </div>
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Back to the app
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <StatTile label="Signups" value={stats.signups} hint="Registered accounts" />
        <StatTile label="Opened the app" value={stats.appOpens} hint={`${stats.appOpenUsers} ${stats.appOpenUsers === 1 ? 'person' : 'people'} reached the studio`} />
        <StatTile label="Used the app" value={stats.usedApp} hint="Created an application, résumé, or history" />
        <StatTile label="Résumés" value={stats.totalResumes} hint={`${stats.applicationsTracked} applications tracked`} />
      </div>

      <div className="rounded-xl border border-border bg-card p-5 mt-5">
        <div className="flex items-baseline justify-between">
          <h2 className="font-semibold text-foreground">Activity, last 14 days</h2>
          <p className="text-xs text-muted-foreground">opens + actions per day</p>
        </div>
        <div className="flex items-end gap-2 mt-4 h-32">
          {stats.daily.map((d) => {
            const total = d.opens + d.actions;
            const height = total ? Math.max(8, Math.round((total / maxDaily) * 100)) : 3;
            const date = new Date(d.date + 'T00:00:00Z');
            return (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1" title={`${d.date}: ${d.opens} opens, ${d.actions} actions`}>
                <span className="text-[10px] text-muted-foreground">{total || ''}</span>
                <div
                  className={`w-full rounded-t ${total ? 'bg-primary' : 'bg-muted'}`}
                  style={{ height: `${height}%` }}
                />
                <span className="text-[10px] text-muted-foreground">{DAY_LABEL[date.getUTCDay()]}</span>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-5">
        Event tracking began 2026-10-21; earlier activity is reconstructed from accounts, résumés, and applications.
        {stats.countsCapped && ' Some counts are approaching the 500-record query cap.'}
      </p>
    </div>
  );
}