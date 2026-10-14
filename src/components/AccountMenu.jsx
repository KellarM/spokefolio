import React from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Shows whose career studio this is and signs them out so another account can log in.
export default function AccountMenu({ className }) {
  const { user, logout } = useAuth();
  const name = user?.full_name || user?.email || 'Your account';
  const initial = name.trim().charAt(0).toUpperCase();

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-[12px] font-medium text-secondary-foreground">
        {initial}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] leading-tight">{name}</p>
        {user?.full_name && user?.email ? (
          <p className="truncate text-[11px] text-muted-foreground">{user.email}</p>
        ) : null}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => logout(false)}
        aria-label="Log out"
        title="Log out"
        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
      >
        <LogOut className="h-4 w-4" strokeWidth={1.75} />
      </Button>
    </div>
  );
}