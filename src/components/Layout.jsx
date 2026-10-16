import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Mic, FolderOpen, Briefcase, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Image } from '@/components/ui/image';
import AccountMenu from '@/components/AccountMenu';

const LOGO = 'https://media.base44.com/images/public/6ac71edebc00261f3487fa3e/9f96553a6_logo.png';

const NAV = [
  { label: 'Overview', to: '/', icon: LayoutDashboard },
  { label: 'Career history', to: '/history', icon: Mic },
  { label: 'Reference files', to: '/documents', icon: FolderOpen },
  { label: 'Applications', to: '/applications', icon: Briefcase }
];

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <Image src={LOGO} alt="ResumeCraft AI" className="h-9 w-9 rounded-[8px]" />
      <div>
        <p className="font-heading text-[17px] leading-none">ResumeCraft</p>
        <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Personal studio</p>
      </div>
    </div>
  );
}

export default function Layout() {
  const { pathname } = useLocation();
  const isActive = (to) => (to === '/' ? pathname === '/' : pathname.startsWith(to));

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-[268px] flex-col border-r border-border/70 bg-card lg:flex">
        <div className="h-1.5 w-full bg-gradient-to-r from-primary via-resume-brass to-accent" aria-hidden="true" />
        <div className="px-6 pt-8">
          <Brand />
        </div>
        <nav className="mt-9 space-y-1 px-3">
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] transition-colors',
                  isActive(item.to)
                    ? 'bg-primary/10 font-medium text-primary'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto p-4">
          <AccountMenu className="mb-4 px-1" />
          <Link
            to="/new-application"
            className="flex items-center justify-between gap-2 rounded-xl bg-primary px-4 py-3 text-[13px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Tailor a résumé
            <Sparkles className="h-4 w-4" strokeWidth={1.75} />
          </Link>
          <p className="mt-3 px-1 text-[11px] leading-relaxed text-muted-foreground">
            Paste any job posting and get a résumé written for it.
          </p>
        </div>
      </aside>

      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur lg:hidden">
        <div className="h-1 w-full bg-gradient-to-r from-primary via-resume-brass to-accent" aria-hidden="true" />
        <div className="px-5 pt-4">
          <Brand />
        </div>
        <AccountMenu className="mt-3 px-5" />
        <div className="flex gap-2 overflow-x-auto px-5 py-3">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[13px] transition-colors',
                isActive(item.to)
                  ? 'border-primary/30 bg-primary/10 font-medium text-primary'
                  : 'border-border/70 text-muted-foreground hover:text-foreground'
              )}
            >
              {item.label}
            </Link>
          ))}
          <Link
            to="/new-application"
            className="whitespace-nowrap rounded-full bg-primary px-3.5 py-1.5 text-[13px] font-medium text-primary-foreground"
          >
            Tailor a résumé
          </Link>
        </div>
      </header>

      <main className="lg:pl-[268px]">
        <div className="mx-auto w-full max-w-[1080px] px-5 py-8 sm:px-8 lg:py-14">
          <Outlet />
        </div>
      </main>
    </div>
  );
}