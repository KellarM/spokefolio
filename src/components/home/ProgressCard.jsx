import React from 'react';
import { Link } from 'react-router-dom';

export default function ProgressCard({
  historyComplete,
  entryCount,
  confirmedCount,
  documentCount,
  applicationCount,
  onUnlock
}) {
  return (
    <div className="mec-panel">
      <div className="mec-eyebrow">Your foundation</div>
      <h3 className="mec-h3">
        {historyComplete ? 'Career history locked in' : 'Build your career history'}
      </h3>
      <p className="mec-lede">
        {historyComplete
          ? 'Every tailored résumé is drawn from this history, so nothing you write can contradict your real experience.'
          : 'Dictate one entry at a time and answer the follow-up prompts. When you are done, say “Resume History is Complete”.'}
      </p>

      <div className="mec-stats">
        <div className="mec-st">
          <b>{entryCount}</b>
          <span>Entries</span>
        </div>
        <div className="mec-st">
          <b>{confirmedCount}</b>
          <span>Confirmed</span>
        </div>
        <div className="mec-st">
          <b>{documentCount}</b>
          <span>Files</span>
        </div>
        <div className="mec-st">
          <b>{applicationCount}</b>
          <span>Résumés</span>
        </div>
      </div>

      <div className="mec-fbtn">
        {historyComplete ? (
          <>
            <Link to="/new-application" className="mec-btn mec-gold mec-sm">
              Tailor a résumé
            </Link>
            <button
              type="button"
              onClick={onUnlock}
              className="mec-btn mec-ghost mec-sm mec-quiet"
            >
              Add more history
            </button>
          </>
        ) : (
          <>
            <Link to="/history" className="mec-btn mec-gold mec-sm">
              Continue capturing
            </Link>
            <Link to="/history" className="mec-btn mec-ghost mec-sm mec-quiet">
              Add more history
            </Link>
          </>
        )}
      </div>
    </div>
  );
}