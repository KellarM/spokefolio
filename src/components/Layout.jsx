import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import AccountMenu from '@/components/AccountMenu';
import { StudioLanguageProvider, useStudioLanguage } from '@/lib/StudioLanguage';

const LOGO = 'https://media.base44.com/images/public/6ac71edebc00261f3487fa3e/9f96553a6_logo.png';

// The nav speaks the language saved on the profile; the provider above keeps
// every surface under it in step when the language changes.
function Nav() {
  const { t } = useStudioLanguage();
  const { pathname } = useLocation();
  const isActive = (to) => (to === '/' ? pathname === '/' : pathname.startsWith(to));
  const isHome = pathname === '/';

  const NAV = [
    { label: t('nav.overview'), to: '/' },
    { label: t('nav.history'), to: '/history' },
    { label: t('nav.postings'), to: '/postings' },
    { label: t('nav.documents'), to: '/documents' },
    { label: t('nav.applications'), to: '/applications' }
  ];

  return (
    <div className="mec-root">
      <div className="mec-glow" aria-hidden="true" />

      <header className="mec-nav">
        <Link to="/" className="mec-brand">
          <img src={LOGO} alt="Spokefolio Personal Resume Studio" />
          <div>
            <div className="mec-bn">Spokefolio</div>
            <div className="mec-bs">{t('nav.tagline')}</div>
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

      <footer className="flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-[#D4AF37]/20 px-6 py-5 font-body text-[15px] tracking-wider text-[#8a94a8] lg:px-[80px]">
        <span>Spokefolio {t('nav.tagline')}</span>
        <span aria-hidden="true">·</span>
        <Link to="/about" className="hover:text-[#D4AF37]">{t('nav.about')}</Link>
        <span aria-hidden="true">·</span>
        <Link to="/contact" className="hover:text-[#D4AF37]">{t('nav.contact')}</Link>
      </footer>
    </div>
  );
}

export default function Layout() {
  return (
    <StudioLanguageProvider>
      <Nav />
    </StudioLanguageProvider>
  );
}
