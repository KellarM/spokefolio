import React, { useEffect, useState } from 'react';
import { Loader2, Mail, Send } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';

// Sends the finished package for this application to the account holder's own email:
// résumé and cover letter as PDFs, the job's details, and interview talking points.
// The recipient is read from the signed-in account on the server and cannot be changed here.
export default function SendPackageDialog({
  open,
  onOpenChange,
  application,
  resume,
  coverLetter,
  template,
  layout,
  onBeforeSend,
  onSent
}) {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [includeResume, setIncludeResume] = useState(true);
  const [includeLetter, setIncludeLetter] = useState(true);
  const [includePrep, setIncludePrep] = useState(true);
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    base44.auth
      .me()
      .then((user) => {
        if (!cancelled) setEmail(user?.email || '');
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [open]);

  const hasResume = Boolean(resume?.summary || (Array.isArray(resume?.experience) && resume.experience.length));
  const hasLetter = Boolean((coverLetter || '').trim());
  const nothingSelected = !includeResume && !includeLetter && !includePrep;

  const send = async () => {
    setSending(true);
    try {
      if (onBeforeSend) await onBeforeSend();
      const response = await base44.functions.invoke('sendApplicationPackage', {
        application_id: application.id,
        include_resume: includeResume && hasResume,
        include_letter: includeLetter && hasLetter,
        include_prep: includePrep,
        note,
        resume,
        cover_letter: coverLetter,
        template,
        layout
      });
      const data = response?.data || {};
      toast({
        title: 'Package sent',
        description: `Sent to ${data.sent_to || email}. The PDFs are attached to the email; the anytime links work whenever you are signed in.`
      });
      if (onSent) onSent(data);
      onOpenChange(false);
      setNote('');
    } catch (error) {
      toast({
        title: 'Could not send the package',
        description: error?.response?.data?.error || error.message,
        variant: 'destructive'
      });
    }
    setSending(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-4 w-4" /> Send to my email
          </DialogTitle>
          <DialogDescription>
            Your résumé and cover letter, attached to the email as PDF files, plus the job details and interview talking
            points, delivered to the email on your account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-xl border border-border/70 bg-muted/40 px-3.5 py-2.5 text-[14px]">
            <span className="text-muted-foreground">To:</span>{' '}
            <span className="font-medium">{email || 'your account email'}</span>
          </div>

          <div className="space-y-2.5">
            <label className="flex items-start gap-3 text-[14px]">
              <Checkbox checked={includeResume && hasResume} onCheckedChange={(v) => setIncludeResume(Boolean(v))} disabled={!hasResume} className="mt-0.5" />
              <span>
                Résumé (PDF)
                {!hasResume && <span className="block text-[12px] text-muted-foreground">Build the résumé first.</span>}
              </span>
            </label>
            <label className="flex items-start gap-3 text-[14px]">
              <Checkbox checked={includeLetter && hasLetter} onCheckedChange={(v) => setIncludeLetter(Boolean(v))} disabled={!hasLetter} className="mt-0.5" />
              <span>
                Cover letter (PDF)
                {!hasLetter && <span className="block text-[12px] text-muted-foreground">No cover letter written yet.</span>}
              </span>
            </label>
            <label className="flex items-start gap-3 text-[14px]">
              <Checkbox checked={includePrep} onCheckedChange={(v) => setIncludePrep(Boolean(v))} className="mt-0.5" />
              <span>
                Interview prep
                <span className="block text-[12px] text-muted-foreground">
                  Proof points for their requirements, honest answers for known gaps, likely questions, and questions to ask them.
                </span>
              </span>
            </label>
          </div>

          <div>
            <Label htmlFor="package-note" className="text-[13px]">
              A note to yourself (optional)
            </Label>
            <Textarea
              id="package-note"
              rows={2}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Interview Tuesday 2pm, ask about the opening timeline…"
              className="mt-1.5 text-[14px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" className="rounded-full" onClick={() => onOpenChange(false)} disabled={sending}>
            Cancel
          </Button>
          <Button className="rounded-full" onClick={send} disabled={sending || nothingSelected || !email}>
            {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            {sending ? 'Building and sending…' : 'Send package'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}