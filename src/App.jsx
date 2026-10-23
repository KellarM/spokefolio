import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { useEffect, useRef, useState } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
// Add page imports here
import Layout from '@/components/Layout';
import Home from '@/pages/Home';
import HistoryCapture from '@/pages/HistoryCapture';
import Postings from '@/pages/Postings';
import Documents from '@/pages/Documents';
import Applications from '@/pages/Applications';
import TailorApplication from '@/pages/TailorApplication';
import ApplicationDetail from '@/pages/ApplicationDetail';
import Admin from '@/pages/Admin';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import ProtectedRoute from '@/components/ProtectedRoute';
import Landing from '@/pages/Landing';
import About from '@/pages/About';
import Contact from '@/pages/Contact';
import Profile from '@/pages/Profile';
import ProfileGate from '@/components/ProfileGate';

const ENTERED_KEY = 'sf_entered';
const ROUTE_KEY = 'sf_route';

// The studio opens at the welcome page on every cold start — the visitor
// signs in or signs up to come in. Once they are inside this tab, a freeze
// or refresh brings them straight back to where they were working instead.
const AuthenticatedApp = () => {
  const { isAuthenticated, isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [gate, setGate] = useState(() => sessionStorage.getItem(ENTERED_KEY) !== '1');
  const authSettled = useRef(false);

  // A login completed mid-session (this includes a fresh sign-up) lets the
  // person in and, when a saved spot exists, takes them back to it.
  useEffect(() => {
    if (isLoadingAuth) return;
    if (!authSettled.current) {
      authSettled.current = true;
      return;
    }
    if (isAuthenticated) {
      sessionStorage.setItem(ENTERED_KEY, '1');
      setGate(false);
      const saved = sessionStorage.getItem(ROUTE_KEY);
      if (saved && saved !== location.pathname + location.search) navigate(saved);
    }
  }, [isAuthenticated, isLoadingAuth]);

  // Someone who is already signed in and asks for the login or sign-up
  // screen is saying "let me in" — open the gate for them.
  useEffect(() => {
    if (!isAuthenticated) return;
    if (location.pathname === '/login' || location.pathname === '/register') {
      sessionStorage.setItem(ENTERED_KEY, '1');
      setGate(false);
    }
  }, [location, isAuthenticated]);

  // Remember the studio spot on every move, so a refresh can return here.
  // The auth pages themselves are never remembered as a place to come back to.
  useEffect(() => {
    if (!isAuthenticated) return;
    const path = location.pathname + location.search;
    const transient = ['/login', '/register', '/forgot-password', '/reset-password'];
    if (!transient.some((prefix) => path.startsWith(prefix))) {
      sessionStorage.setItem(ROUTE_KEY, path);
    }
  }, [location, isAuthenticated]);

  // A refresh inside this tab skips the welcome gate and returns to the spot.
  useEffect(() => {
    if (isLoadingAuth) return;
    if (sessionStorage.getItem(ENTERED_KEY) === '1') {
      const saved = sessionStorage.getItem(ROUTE_KEY);
      if (saved && saved !== location.pathname + location.search) navigate(saved);
    }
  }, [isLoadingAuth]);

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // The welcome gate: a cold start by an already-signed-in visitor still
  // shows the welcome page first. Nothing is signed out — choosing
  // "Log in" walks them straight in.
  if (isAuthenticated && gate) {
    return <Landing />;
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/" replace /> : <Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/admin" element={<Admin />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Landing />} />}>
        <Route element={<Layout />}>
          <Route path="/profile" element={<Profile />} />
          {/* Everything else waits until the profile carries a name, email, phone and location. */}
          <Route element={<ProfileGate />}>
            <Route path="/" element={<Home />} />
            <Route path="/history" element={<HistoryCapture />} />
            <Route path="/postings" element={<Postings />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/applications" element={<Applications />} />
            <Route path="/tailor-application" element={<TailorApplication />} />
            <Route path="/application/:id" element={<ApplicationDetail />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <Routes>
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="*" element={<AuthenticatedApp />} />
          </Routes>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App