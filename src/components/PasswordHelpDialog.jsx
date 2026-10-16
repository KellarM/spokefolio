import React, { useState } from 'react';
import { Check, KeyRound, Loader2, Mail } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// Signing in on another device: a stored password can never be shown, so this explains the
// two real routes — a link that sets a new password you choose, or Google sign-in.
export default function PasswordHelpDialog({ open, onOpenChange }) {
  const { user } = useAuth();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const email = user?.email || '';

  const sendLink = async () => {
    setSending(true);
    try {
      await base44.auth.resetPasswordRequest(email);
    } catch {
      // The API never reveals whether the address exists, so the same confirmation follows.
    }
    setSending(false);
    setSent(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="font-heading text-[22px]">Signing in on your phone</DialogTitle>
        </DialogHeader>

        <p className="text-[14px] leading-relaxed text-muted-foreground">
          Your password is stored scrambled, so no screen can show it, here or anywhere else. Choose a new one you will
          know and it will work on every device.
        </p>

        <ol className="mt-4 space-y-2 text-[13.5px] leading-relaxed text-foreground/90">
          <li>1. Send yourself the link below.</li>
          <li>2. Open that email on your phone.</li>
          <li>3. Pick a new password, then sign in with your email and it.</li>
        </ol>

        {sent ? (
          <div className="mt-5 flex items-start gap-3 rounded-xl border border-accent/25 bg-accent/5 px-4 py-3">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" strokeWidth={2} />
            <p className="text-[13px] leading-relaxed">
              Link sent to {email}. Open it on your phone to set the new password. Your current password keeps working
              until you finish that link.
            </p>
          </div>
        ) : (
          <Button className="mt-5 w-full rounded-full" onClick={sendLink} disabled={sending || !email}>
            {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
            Email me a link to set a new password
          </Button>
        )}

        <div className="mt-5 flex items-start gap-3 border-t border-border/70 pt-4">
          <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            Created your account with Google? Then you need no password at all: use "Continue with Google" on the sign-in
            page on any device.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}