import React, { useState } from 'react';
import { Building2, Loader2, Search } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import CompanyBriefDialog from '@/components/applications/CompanyBriefDialog';

// The employer behind one application. The button sits with the posting; everything found
// about the company opens in one place, and what has already been found is saved with the application.
export default function CompanyBrief({ application, onResearched }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [research, setResearch] = useState(application?.company_research || null);
  const [researchedAt, setResearchedAt] = useState(application?.company_researched_at || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const look = async (force) => {
    setLoading(true);
    setError('');
    try {
      const response = await base44.functions.invoke('researchCompany', { application_id: application.id, force });
      const data = response.data || {};
      setResearch(data.research || null);
      setResearchedAt(data.researched_at || '');
      onResearched?.(data.research || null, data.researched_at || '');
      if (force) toast({ title: 'Company breakdown refreshed' });
    } catch (err) {
      setError(err?.response?.data?.error || err.message);
    }
    setLoading(false);
  };

  const openBrief = () => {
    setOpen(true);
    if (!research && !loading) look(false);
  };

  return (
    <section className="mt-4 rounded-2xl border border-border/70 bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow">The company behind this posting</p>
          <p className="mt-2 text-[13px] text-muted-foreground">
            {research
              ? `Breakdown saved${researchedAt ? ` · ${new Date(researchedAt).toLocaleDateString()}` : ''}`
              : `History, size, management, and what labour and employee sources say about ${application.company || 'this employer'}.`}
          </p>
        </div>
        <Button variant="secondary" className="rounded-full" onClick={openBrief} disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : research ? <Building2 className="mr-2 h-4 w-4" /> : <Search className="mr-2 h-4 w-4" />}
          {loading ? 'Researching…' : research ? 'Company breakdown' : 'Research this company'}
        </Button>
      </div>

      {error && !open && <p className="mt-3 text-[13px] text-destructive">{error}</p>}

      <CompanyBriefDialog
        open={open}
        onOpenChange={setOpen}
        company={application.company}
        research={research}
        loading={loading}
        error={error}
        researchedAt={researchedAt}
        onRefresh={() => look(true)}
      />
    </section>
  );
}