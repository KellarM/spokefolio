import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, FileText } from 'lucide-react';
import StatusBadge from '@/components/applications/StatusBadge';

export default function RecentApplications({ applications = [] }) {
  return (
    <section className="mt-12">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Latest</p>
          <h2 className="mt-2 font-heading text-[22px]">Tailored résumés</h2>
        </div>
        <Link to="/applications" className="flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground">
          View all <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {applications.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-border px-6 py-10 text-center">
          <FileText className="mx-auto h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
          <p className="mt-3 text-[14px] text-muted-foreground">No résumés yet. Paste a job posting to create your first one.</p>
        </div>
      ) : (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {applications.map((application) => (
            <Link
              key={application.id}
              to={`/application/${application.id}`}
              className="group rounded-2xl border border-border/70 bg-card px-5 py-4 transition-all hover:border-accent/40 hover:shadow-[0_18px_40px_-32px_rgba(16,24,40,0.5)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-heading text-[17px]">{application.job_title || 'Tailored résumé'}</p>
                  <p className="mt-1 truncate text-[13px] text-muted-foreground">{application.company || 'Company not named'}</p>
                </div>
                <StatusBadge status={application.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}