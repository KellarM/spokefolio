import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, KeyRound, LogOut, UserRound } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import PasswordHelpDialog from '@/components/PasswordHelpDialog';

// The account control in the top right: who is signed in, their profile, and signing out.
export default function AccountMenu({ className }) {
  const { user, logout } = useAuth();
  const [passwordHelp, setPasswordHelp] = useState(false);
  const name = user?.full_name || user?.email || 'Your account';
  const initial = name.trim().charAt(0).toUpperCase();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Account menu"
            className={cn(
              'flex items-center gap-2 rounded-full border border-border/60 bg-secondary/70 px-2.5 py-1.5 font-body text-[15px] text-secondary-foreground transition-colors hover:bg-secondary',
              className
            )}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-[13px] font-semibold text-primary-foreground">
              {initial}
            </span>
            <span className="hidden max-w-[150px] truncate sm:inline">{name}</span>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-70" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-64 rounded-2xl border-border/70 bg-popover p-1.5">
          <DropdownMenuLabel className="px-3 py-2">
            <span className="block truncate font-body text-[15px] text-foreground">{name}</span>
            {user?.email && (
              <span className="mt-0.5 block truncate font-body text-[13px] font-normal text-muted-foreground">
                {user.email}
              </span>
            )}
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          <DropdownMenuItem asChild className="cursor-pointer rounded-xl px-3 py-2 text-[15px]">
            <Link to="/profile">
              <UserRound className="mr-2 h-4 w-4" /> Profile
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem
            onSelect={() => setPasswordHelp(true)}
            className="cursor-pointer rounded-xl px-3 py-2 text-[15px]"
          >
            <KeyRound className="mr-2 h-4 w-4" /> Sign in on another device
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onSelect={() => logout(false)}
            className="cursor-pointer rounded-xl px-3 py-2 text-[15px] text-destructive focus:text-destructive"
          >
            <LogOut className="mr-2 h-4 w-4" /> Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <PasswordHelpDialog open={passwordHelp} onOpenChange={setPasswordHelp} />
    </>
  );
}