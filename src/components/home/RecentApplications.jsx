import React from 'react';
import { Link } from 'react-router-dom';

const STATUS_LABELS = {
  draft: 'In progress',
  ready: 'Ready to send',
  not_applied: 'Not yet sent',
  applied: 'Applied',
  contacted: 'Contacted',
  interviewing: 'Interviewing',
  offer: 'Offer',
  not_hired: 'Not hired',
  rejected: 'Closed'
};

export default function RecentApplications({ applications = [] }) {
  return (
    <section className="mec-panel">
      <div className="mec-rhead">
        <div>
          <div className="mec-eyebrow">Latest</div>
          <h2 className="mec-h2">Tailored résumés</h2>
        </div>
        <Link to="/applications" className="mec-va">
          View all →
        </Link>
      </div>

      {applications.length > 0 && (
        <div className="mec-show">
          {applications.map((application) => (
            <Link
              key={application.id}
              to={`/application/${application.id}`}
              className="mec-app"
            >
              <div>
                <p className="mec-at">{application.job_title || 'Tailored résumé'}</p>
                <p className="mec-ac">{application.company || 'Company not named'}</p>
              </div>
              <span className="mec-badge">
                {STATUS_LABELS[application.status] || STATUS_LABELS.ready}
              </span>
            </Link>
          ))}
        </div>
      )}

      {applications.length === 0 && (
        <div className="mec-empty">
          No résumés yet. Paste a job posting to create your first one.
        </div>
      )}
    </section>
  );
}