import React from 'react';
import { useToast } from '@/components/ui/use-toast';
import TemplatePicker from '@/components/resume/TemplatePicker';
import ProfilePhoto from '@/components/home/ProfilePhoto';
import { DEFAULT_TEMPLATE_ID } from '@/lib/resumeTemplates';
import { useStudioLanguage } from '@/lib/StudioLanguage';

export default function TemplateCard({ profile, onSave }) {
  const { t } = useStudioLanguage();
  const { toast } = useToast();
  const value = profile.resume_template || DEFAULT_TEMPLATE_ID;

  const choose = async (id) => {
    if (id === value) return;
    try {
      await onSave({ resume_template: id });
    } catch (error) {
      toast({
        title: t('profile.couldNotSaveStyle'),
        description: error?.response?.data?.error || error.message,
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="mec-panel">
      <h3 className="mec-h3-top">{t('profile.yourStyle')}</h3>
      <p className="mec-lede">
        {t('profile.styleLede')}
      </p>
      <TemplatePicker value={value} onChange={choose} variant="executive" />
      <ProfilePhoto profile={profile} onSave={onSave} />
    </div>
  );
}