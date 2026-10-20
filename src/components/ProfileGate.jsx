import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import useProfile from '@/hooks/useProfile';
import { profileIsComplete } from '@/lib/profileGate';

// Everything that waits on the profile: a new client is sent to the profile until their name,
// email, phone number and location are saved, and only then reaches the overview and the rest
// of the studio. The profile page itself sits outside this gate, so there is always somewhere
// to land.
export default function ProfileGate() {
  const { profile, loadingProfile } = useProfile();

  if (loadingProfile) {
    return (
      <div className="flex items-center gap-3 py-16 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading your profile…
      </div>
    );
  }

  if (!profileIsComplete(profile)) return <Navigate to="/profile" replace />;

  return <Outlet />;
}