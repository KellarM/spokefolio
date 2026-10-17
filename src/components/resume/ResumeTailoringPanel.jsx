import React, { useMemo, useState } from 'react';
import { rankEntries, estimatePageCount, buildResumeData } from './ResumeExport';

const TIER_STYLES = {
  Recommended: { background: '#e6f6e6', color: '#1e6b1e', border: '1px solid #1e6b1e' },
  Optional: { background: '#fff6e0', color: '#8a6300', border: '1px solid #c9a227' },
  'Low relevance': { background: '#f0f0f0', color: '#666', border: '1px solid #bbb' },
};

const ResumeTailoringPanel = ({ profile, entries = [], application, onSelectionChange }) => {
  const jd = application && application.job_description;

  const ranked = useMemo(() => rankEntries(entries, jd), [entries, jd]);

  const defaultSelection = () => {
    const saved = application && Array.isArray(application.selected_entry_ids)
      ? application.selected_entry_ids : null;
    if (saved && saved.length) return new Set(saved);
    return new Set(ranked.filter((r) => r.tier !== 'Low relevance').map((r) => r.id));
  };

  const [selected, setSelected] = useState(defaultSelection);

  const toggle = (id) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
    if (onSelectionChange) onSelectionChange(Array.from(next));
  };

  const selectedEntries = entries.filter((e) => selected.has(e.id));
  const resumeData = buildResumeData({ profile, entries: selectedEntries, application });
  const pages = estimatePageCount(resumeData);
  const overLimit = pages > 2;

  return (
    <div className="resume-tailoring-panel" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong>Roles for this resume</strong>
        <span style={{ fontWeight: 'bold', color: overLimit ? '#c0392b' : '#1e6b1e' }}>
          Page estimate: {pages} of 2{overLimit ? ' — over limit' : ''}
        </span>
      </div>
      {ranked.length === 0 && <p>No career entries yet — record your history first.</p>}
      {ranked.map(({ entry, score, tier }) => (
        <div key={entry.id} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '10px', padding: '8px 10px', border: '1px solid #ddd', borderRadius: '6px',
          background: selected.has(entry.id) ? '#fff' : '#fafafa',
          opacity: selected.has(entry.id) ? 1 : 0.55,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
            <input type="checkbox" checked={selected.has(entry.id)}
              onChange={() => toggle(entry.id)} style={{ width: '18px', height: '18px' }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 'bold' }}>
                {entry.title || 'Untitled'}{entry.organization ? ` — ${entry.organization}` : ''}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {entry.start_date || ''}{entry.end_date ? ` to ${entry.end_date}` : ' to Present'}
              </div>
            </div>
          </div>
          <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', whiteSpace: 'nowrap', ...TIER_STYLES[tier] }}>
            {tier} ({score})
          </span>
        </div>
      ))}
      {overLimit && (
        <p style={{ color: '#c0392b', fontSize: '13px', margin: 0 }}>
          Over the 2-page target — deselect lower-relevance roles or trim bullets.
        </p>
      )}
    </div>
  );
};

export default ResumeTailoringPanel;