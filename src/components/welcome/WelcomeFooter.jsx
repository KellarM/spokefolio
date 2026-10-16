import React from 'react';
import { Link } from 'react-router-dom';

export default function WelcomeFooter() {
  return (
    <footer className="border-t border-border/60 bg-secondary/40">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-heading text-base tracking-tight">Resume Craft</p>
          <p className="mt-1 text-xs text-muted-foreground">
            One career history, tailored documents for every role you go after.
          </p>
        </div>
        <nav className="flex items-center gap-5 text-xs text-muted-foreground">
          <Link to="/login" className="hover:text-foreground">
            Log in
          </Link>
          <Link to="/register" className="hover:text-foreground">
            Create an account
          </Link>
          <Link to="/forgot-password" className="hover:text-foreground">
            Reset password
          </Link>
        </nav>
      </div>
    </footer>
  );
}