import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import TemplatePicker from '@/components/resume/TemplatePicker';
import ProfilePhoto from '@/components/home/ProfilePhoto';
import { DEFAULT_TEMPLATE_ID } from '@/lib/resumeTemplates';

export default function TemplateCard({ profile, onSave }) {
  const { toast } = useToast();
  const value = profile.resume_template || DEFAULT_TEMPLATE_ID;

  const choose = async (id) => {
    if (id === value) return;
    try {
      await onSave({ resume_template: id });
    } catch (error) {
      toast({
        title: 'Could not save your style',
        description: error?.response?.data?.error || error.message,
        variant: 'destructive'
      });
    }
  };

  return (
    <Card className="mt-6 border-border/70 shadow-none">
      <CardHeader>
        <CardTitle className="font-heading text-lg font-medium">Your résumé style</CardTitle>
        <CardDescription>
          Every new résumé uses this style. You can still pick a different one for a single application.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <TemplatePicker value={value} onChange={choose} className="max-w-[420px]" />
        <ProfilePhoto profile={profile} onSave={onSave} />
      </CardContent>
    </Card>
  );
}