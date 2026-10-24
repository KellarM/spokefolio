import React from 'react';
import { Link } from 'react-router-dom';
import { useStudioLanguage } from '@/lib/StudioLanguage';

export default function RecentApplications({ applications = [] }) {
  const { t } = useStudioLanguage();

  return (
    <section className="mec-panel">
      <div className="mec-rhead">
        <div>
          <div className="mec-eyebrow">{t('home.latest')}</div>
          <h2 className="mec-h2">{t('home.tailoredResumes')}</h2>
        </div>
        <Link to="/applications" className="mec-va">
          {t('home.viewAll')}
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
                <p className="mec-at">{application.job_title || t('common.tailoredResume')}</p>
                <p className="mec-ac">{application.company || t('common.companyNotNamed')}</p>
              </div>
              <span className="mec-badge">
                {t(`status.${application.status || 'ready'}`)}
              </span>
            </Link>
          ))}
        </div>
      )}

      {applications.length === 0 && (
        <div className="mec-empty">
          <p>{t('home.noResumes')}</p>
          <Link
            to="/tailor-application"
            className="mec-va mt-2 inline-flex items-center gap-1 text-[#D4AF37] transition-opacity hover:opacity-80"
          >
            {t('home.pastePostingCta')}
          </Link>
        </div>
      )}
    </section>
  );
}
