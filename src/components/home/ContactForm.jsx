import React, { useEffect, useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

const FIELDS = [
  { key: 'full_name', label: 'Full name', placeholder: 'Jane Doe' },
  { key: 'email', label: 'Email', placeholder: 'jane@email.com' },
  { key: 'phone', label: 'Phone', placeholder: '(555) 010-2233' },
  { key: 'location', label: 'Location', placeholder: 'Toronto, ON' },
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'linkedin.com/in/janedoe' },
  { key: 'website', label: 'Website', placeholder: 'janedoe.com' }
];

export default function ContactForm({ profile, onSave }) {
  const { toast } = useToast();
  const [form, setForm] = useState(profile || {});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(profile || {});
  }, [profile]);

  const submit = async () => {
    setSaving(true);
    try {
      await onSave(form);
      toast({ title: 'Details saved' });
    } catch (error) {
      toast({ title: 'Could not save your details', description: error?.response?.data?.error || error.message, variant: 'destructive' });
    }
    setSaving(false);
  };

  return (
    <Card className="border-border/70 shadow-none">
      <CardHeader>
        <CardTitle className="font-heading text-lg font-medium">Your details</CardTitle>
        <CardDescription>These sit at the top of every résumé you generate.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
          {FIELDS.map((field) => (
            <div key={field.key}>
              <Label htmlFor={field.key} className="eyebrow">
                {field.label}
              </Label>
              <Input
                id={field.key}
                value={form[field.key] || ''}
                placeholder={field.placeholder}
                onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                className="mt-2 h-10"
              />
            </div>
          ))}
        </div>

        <div className="rounded-xl bg-secondary/60 px-4 py-3.5">
          <Label className="eyebrow">Headline</Label>
          <p className="mt-2 text-[14px] text-foreground/90">
            {form.headline || 'Written for you when you tailor your first résumé'}
          </p>
          <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
            Updates automatically with every résumé you tailor to a job.
          </p>
        </div>

        <Button onClick={submit} disabled={saving} className="rounded-full">
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save details
        </Button>
      </CardContent>
    </Card>
  );
}