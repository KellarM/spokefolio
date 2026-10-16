import React from 'react';
import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthContext';

export default function WelcomeNav() {
  const { isAuthenticated } = useAuth();

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/welcome" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <FileText className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="font-heading text-lg tracking-tight">Spokefolio</span>
        </Link>

        {isAuthenticated ? (
          <Button size="sm" className="rounded-full px-5" asChild>
            <Link to="/">Open my workspace</Link>
          </Button>
        ) : (
          <nav className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/login">Log in</Link>
            </Button>
            <Button size="sm" className="rounded-full px-5" asChild>
              <Link to="/register">Get started</Link>
            </Button>
          </nav>
        )}
      </div>
    </header>
  );
}