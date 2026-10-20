import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import AccountMenu from '@/components/AccountMenu';

const LOGO = 'https://media.base44.com/images/public/6ac71edebc00261f3487fa3e/9f96553a6_logo.png';

const NAV = [
  { label: 'Overview', to: '/' },
  { label: 'Career history', to: '/history' },
  { label: 'Job postings', to: '/postings' },
  { label: 'Reference files', to: '/documents' },
  { label: 'Applications', to: '/applications' }
];

export default function Layout() {
  const { pathname } = useLocation();
  const isActive = (to) => (to === '/' ? pathname === '/' : pathname.startsWith(to));
  const isHome = pathname === '/';

  return (
    <div className="mec-root">
      <div className="mec-glow" aria-hidden="true" />

      <header className="mec-nav">
        <Link to="/" className="mec-brand">
          <img src={LOGO} alt="Spokefolio Personal Resume Studio" />
          <div>
            <div className="mec-bn">Spokefolio</div>
            <div className="mec-bs">Personal Resume Studio</div>
          </div>
        </Link>

        <nav className="mec-links">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={isActive(item.to) ? 'on' : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {!isHome && (
          <div className="mec-cta">
            <Link to="/new-application" className="mec-btn mec-gold">
              Tailor a résumé
            </Link>
            <small>Paste any job posting and get a résumé written for it.</small>
          </div>
        )}

        <AccountMenu />
      </header>

      {isHome ? (
        <main className="flex-1">
          <Outlet />
        </main>
      ) : (
        <main className="mx-auto w-full max-w-[1200px] flex-1 px-6 py-10 lg:px-12 lg:py-14">
          <Outlet />
        </main>
      )}

      <footer className="border-t border-[#D4AF37]/20 px-6 py-5 lg:px-[80px]">
        <span className="font-body text-[15px] tracking-wider text-[#8a94a8]">
          Spokefolio Personal Resume Studio
        </span>
      </footer>
    </div>
  );
}