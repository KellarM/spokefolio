import React, { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import AccountMenu from '@/components/AccountMenu';
import HeaderSearch from '@/components/HeaderSearch';
import { StudioLanguageProvider, useStudioLanguage } from '@/lib/StudioLanguage';
import { ProfileProvider } from '@/hooks/useProfile';
import { TourProvider } from '@/lib/TourContext';
import BouncingBallTour from '@/components/tour/BouncingBallTour';

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
    { label: t('nav.documents'), to: '/documents' },
    { label: t('nav.postings'), to: '/postings' },
    { label: t('nav.applications'), to: '/applications' }
  ];

  // The header hides while scrolling down into the page and returns the
  // moment the reader reaches for it: scrolling up, or bringing the
  // cursor near the top edge. At the very top it never leaves.
  const headerRef = useRef(null);
  const lastY = useRef(0);
  const [navHidden, setNavHidden] = useState(false);
  const [navHeight, setNavHeight] = useState(64);

  useEffect(() => {
    const measure = () => setNavHeight(headerRef.current ? headerRef.current.offsetHeight : 64);
    measure();
    window.addEventListener('resize', measure);

    const onScroll = () => {
      const y = window.scrollY;
      if (y <= 8) {
        setNavHidden(false);
      } else if (y > lastY.current + 4 && y > 120) {
        setNavHidden(true);
      } else if (y < lastY.current - 4) {
        setNavHidden(false);
      }
      lastY.current = y;
    };

    const onMouseMove = (event) => {
      if (event.clientY <= 48 && window.scrollY > 8) setNavHidden(false);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('mousemove', onMouseMove);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  return (
    <div className="mec-root">
      <div className="mec-glow" aria-hidden="true" />

      {/* The header's fixed now, so this spacer keeps the page from
          sliding up behind it. */}
      <div style={{ height: navHeight }} aria-hidden="true" />
      <header ref={headerRef} className={`mec-nav ${navHidden ? 'nav-away' : ''}`}>
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

        <div className="flex items-center gap-2.5">
          <HeaderSearch />
          <AccountMenu />
        </div>
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
    <ProfileProvider>
      <StudioLanguageProvider>
        <TourProvider>
          <Nav />
          <BouncingBallTour />
        </TourProvider>
      </StudioLanguageProvider>
    </ProfileProvider>
  );
}
