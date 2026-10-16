import React from 'react';
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
    <div className="mec-panel">
      <h3 className="mec-h3-top">Your résumé style</h3>
      <p className="mec-lede">
        Every new résumé uses this style. You can still pick a different one for a single application.
      </p>
      <TemplatePicker value={value} onChange={choose} variant="executive" />
      <ProfilePhoto profile={profile} onSave={onSave} />
    </div>
  );
}