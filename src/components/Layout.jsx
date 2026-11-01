import React, { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import AccountMenu from '@/components/AccountMenu';
import HeaderSearch from '@/components/HeaderSearch';
import { StudioLanguageProvider, useStudioLanguage } from '@/lib/StudioLanguage';
import { ProfileProvider } from '@/hooks/useProfile';
import { TourProvider } from '@/lib/TourContext';
import BouncingBallTour from '@/components/tour/BouncingBallTour';
import { mascotHidden, setMascotHidden } from '@/lib/speech';

import LOGO from '@/assets/spokefolio-logo.png';

// The nav speaks the language saved on the profile; the provider above keeps
// every surface under it in step when the language changes.
function Nav() {
  const { t } = useStudioLanguage();
  const { pathname } = useLocation();
  const isActive = (to) => (to === '/' ? pathname === '/' : pathname.startsWith(to));
  const isHome = pathname === '/';
  // The interview drill reads its two answers side by side and keeps a report
  // beside them. A 1200px clamp cuts the third column off the right edge, so
  // this one page runs the full width of the window. The header and the company
  // picker keep their own measure - a wide page does not mean wide paragraphs.
  const isWide = pathname === '/interview';

  // The mascot is off until someone asks for it. The logo is the ask, and the
  // label under it says so. Once it is on, the label reports that instead of
  // offering an action that has already happened.
  const [mascotOn, setMascotOn] = useState(() => !mascotHidden());
  useEffect(() => {
    const sync = () => setMascotOn(!mascotHidden());
    window.addEventListener('spokefolio:mascotPrefs', sync);
    return () => window.removeEventListener('spokefolio:mascotPrefs', sync);
  }, []);
  const activateMascot = () => {
    if (mascotOn) return;
    setMascotHidden(false);
  };

  const NAV = [
    { label: t('nav.overview'), to: '/', step: null },
    { label: t('nav.documents'), to: '/documents', step: 'steps.one' },
    { label: t('nav.history'), to: '/history', step: 'steps.two' },
    { label: t('nav.postings'), to: '/postings', step: 'steps.three' },
    { label: t('nav.applications'), to: '/applications', step: 'steps.four' },
    { label: t('nav.interview'), to: '/interview', step: 'steps.five' }
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
        <div className="mec-brand-wrap">
          <Link to="/" className="mec-brand" onClick={activateMascot}>
            <img src={LOGO} alt="Spokefolio Personal Resume Studio" />
          </Link>
          {mascotOn ? (
            <span className="mec-activate on">{t('header.mascotOn')}</span>
          ) : (
            <button type="button" className="mec-activate" onClick={activateMascot}>
              {t('header.activateMascot')}
            </button>
          )}
        </div>

        <nav className="mec-links">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={isActive(item.to) ? 'on' : undefined}
            >
              <span>{item.label}</span>
              {item.step && (
                <span className="mt-0.5 block font-mono text-[18px] font-semibold uppercase tracking-[0.08em] text-white">
                  {t(item.step)}
                </span>
              )}
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
        <main className={`mx-auto w-full flex-1 px-6 py-10 lg:px-12 lg:py-14 ${isWide ? 'max-w-none' : 'max-w-[1200px]'}`}>
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
