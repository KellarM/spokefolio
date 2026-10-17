import React from 'react';

export const buildAtsHtml = (resumeData) => {
  const {
    name = '', contactLine = '', headline = '', summary = '',
    coreSkills = [], experience = [], education = [],
    certifications = [], additionalSections = [],
  } = resumeData || {};

  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const section = (title, inner) =>
    inner && String(inner).trim() ? `<h2>${esc(title)}</h2>${inner}` : '';
  const skillsHtml = Array.isArray(coreSkills) && coreSkills.length
    ? `<p class="skills">${coreSkills.map(esc).join(' &bull; ')}</p>` : '';
  const summaryHtml = summary ? `<p>${esc(summary)}</p>` : '';
  const expHtml = (experience || []).map((job) => `
    <div class="job">
      <p class="job-title">${esc(job.title || '')}${job.organization ? ` &mdash; ${esc(job.organization)}` : ''}${job.location ? `, ${esc(job.location)}` : ''}</p>
      ${job.dateRange ? `<p class="job-dates">${esc(job.dateRange)}</p>` : ''}
      ${(job.bullets || []).length ? `<ul>${job.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>` : ''}
    </div>`).join('');
  const eduHtml = (education || []).map((e) => `
    <div class="job">
      <p class="job-title">${esc(e.title || '')}${e.organization ? ` &mdash; ${esc(e.organization)}` : ''}</p>
      ${e.dateRange ? `<p class="job-dates">${esc(e.dateRange)}</p>` : ''}
    </div>`).join('');
  const certHtml = (certifications || []).length
    ? `<ul>${certifications.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>` : '';
  const extraHtml = (additionalSections || []).map((s) =>
    section(s.title, `<ul>${(s.items || []).map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`)
  ).join('');
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${esc(name || 'Resume')}</title>
<style>
  @page { margin: 14mm 16mm; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 11pt; color: #000; line-height: 1.4; max-width: 190mm; margin: 0 auto; }
  h1 { font-size: 18pt; margin: 0 0 2pt; }
  .headline { font-size: 12pt; margin: 0 0 2pt; font-weight: bold; }
  .contact { font-size: 10pt; margin: 0 0 14pt; }
  h2 { font-size: 12pt; margin: 14pt 0 4pt; border-bottom: 1pt solid #000; padding-bottom: 2pt; text-transform: uppercase; letter-spacing: 0.5pt; }
  p { margin: 0 0 4pt; }
  ul { margin: 2pt 0 8pt 16pt; padding: 0; }
  li { margin: 0 0 3pt; }
  .job { margin: 0 0 10pt; }
  .job-title { font-weight: bold; margin: 0; }
  .job-dates { font-style: italic; margin: 0 0 3pt; font-size: 10pt; }
  .skills { margin: 0 0 6pt; }
</style>
</head>
<body>
  <h1>${esc(name)}</h1>
  ${headline ? `<p class="headline">${esc(headline)}</p>` : ''}
  <p class="contact">${esc(contactLine)}</p>
  ${section('Professional Summary', summaryHtml)}
  ${section('Core Skills', skillsHtml)}
  ${section('Work Experience', expHtml)}
  ${section('Education', eduHtml)}
  ${section('Certifications', certHtml)}
  ${extraHtml}
</body>
</html>`;
};

// --- JD relevance scoring ---

const tokenize = (text) => String(text || '')
  .toLowerCase().replace(/[^a-z0-9\s]/g, ' ')
  .split(/\s+/).filter((w) => w.length > 3);

export const scoreEntryAgainstJd = (entry, jobDescription) => {
  const jdTokens = new Set(tokenize(jobDescription));
  const entryText = [
    entry.title, entry.organization, entry.summary,
    ...(Array.isArray(entry.skills) ? entry.skills : []),
    ...(Array.isArray(entry.keywords) ? entry.keywords : []),
    ...(Array.isArray(entry.accomplishments) ? entry.accomplishments : []),
  ].join(' ');
  const hits = new Set(tokenize(entryText).filter((t) => jdTokens.has(t)));
  return hits.size;
};

export const rankEntries = (entries, jobDescription) => {
  const scored = (entries || []).map((e) => ({
    id: e.id, entry: e, score: scoreEntryAgainstJd(e, jobDescription),
  }));
  const max = Math.max(1, ...scored.map((s) => s.score));
  return scored
    .sort((a, b) => (b.score - a.score)
      || String(b.entry.end_date || '').localeCompare(String(a.entry.end_date || '')))
    .map((s) => ({
      ...s,
      tier: s.score >= Math.max(3, max * 0.5) ? 'Recommended'
        : s.score > 0 ? 'Optional' : 'Low relevance',
    }));
};

const reorderBullets = (bullets, jobDescription) => {
  if (!jobDescription) return bullets || [];
  const jdTokens = new Set(tokenize(jobDescription));
  return (bullets || [])
    .map((b, i) => ({
      b, i,
      score: tokenize(b).reduce((n, t) => n + (jdTokens.has(t) ? 1 : 0), 0),
    }))
    .sort((a, b) => (b.score - a.score) || (a.i - b.i))
    .map((s) => s.b);
};

// --- 2-page budget estimation ---

const estimateLines = (resumeData) => {
  let lines = 4;
  if (resumeData.headline) lines += 1;
  if (resumeData.summary) lines += 1 + Math.ceil(String(resumeData.summary).length / 95);
  if ((resumeData.coreSkills || []).length) lines += 1 + Math.ceil(resumeData.coreSkills.join(' • ').length / 95);
  (resumeData.experience || []).forEach((job) => {
    lines += 3;
    (job.bullets || []).forEach((b) => { lines += Math.max(1, Math.ceil(b.length / 95)); });
  });
  (resumeData.education || []).forEach(() => { lines += 3; });
  (resumeData.additionalSections || []).forEach(() => { lines += 3; });
  return lines;
};

export const estimatePageCount = (resumeData) =>
  Math.max(1, Math.ceil(estimateLines(resumeData) / 46));

const confirmIfOverLimit = (resumeData) => {
  const pages = estimatePageCount(resumeData);
  if (pages > 2) {
    return window.confirm(
      `This resume is about ${pages} pages — over the 2-page target. Open the export anyway?`
    );
  }
  return true;
};

// --- Exports (both gated by the 2-page check) ---

export const exportResumeToPdf = (resumeData) => {
  if (!confirmIfOverLimit(resumeData)) return;
  const html = buildAtsHtml(resumeData);
  const w = window.open('', '_blank', 'width=880,height=1020');
  if (!w) {
    window.alert('Please allow pop-ups for Spokefolio so we can open the print view.');
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
  w.focus();
  w.addEventListener('afterprint', () => { try { w.close(); } catch (e) { /* already closed */ } });
  setTimeout(() => { try { w.print(); } catch (e) { /* user closed manually */ } }, 250);
};

export const exportResumeToWord = (resumeData, fileName) => {
  if (!confirmIfOverLimit(resumeData)) return;
  const html = buildAtsHtml(resumeData).replace(
    '<html>',
    '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">'
  );
  const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const clean = (fileName || (resumeData && resumeData.name) || 'resume')
    .replace(/[^a-z0-9_-]+/gi, '_');
  a.download = `${clean}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const ResumeExportButtons = ({ resumeData, fileName, className = '' }) => (
  <div className={`resume-export-buttons ${className}`} style={{ display: 'flex', gap: '8px' }}>
    <button type="button" onClick={() => exportResumeToPdf(resumeData)}
      title="Opens the print dialog — choose Save as PDF">Download PDF</button>
    <button type="button" onClick={() => exportResumeToWord(resumeData, fileName)}
      title="Downloads a Word-openable document">Download Word</button>
  </div>
);

// --- Data adapter (v1.1: selection + bullet reordering) ---

const asArray = (v) => {
  if (Array.isArray(v)) return v.filter(Boolean);
  if (typeof v === 'string' && v.trim()) {
    return v.split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean);
  }
  return [];
};

const dateRange = (start, end) => {
  const s = start || '';
  const e = end || '';
  if (!s && !e) return '';
  if (!e) return `${s} &mdash; Present`;
  return `${s} &mdash; ${e}`;
};

export const buildResumeData = ({
  profile, entries = [], application = null, selectedIds = null,
}) => {
  const p = profile || {};
  const jd = application && application.job_description;

  let pool = [...(entries || [])];
  if (Array.isArray(selectedIds)) {
    pool = pool.filter((e) => selectedIds.includes(e.id));
  }
  pool.sort((a, b) => String(b.end_date || '').localeCompare(String(a.end_date || '')));

  const educationEntries = pool.filter((e) => String(e.entry_type || '').toLowerCase() === 'education');
  const experienceEntries = pool.filter((e) => String(e.entry_type || '').toLowerCase() !== 'education');

  const experience = experienceEntries.map((e) => ({
    title: e.title || '',
    organization: e.organization || '',
    location: e.location || '',
    dateRange: dateRange(e.start_date, e.end_date),
    bullets: reorderBullets(asArray(e.accomplishments), jd),
  }));

  const education = educationEntries.map((e) => ({
    title: e.title || '',
    organization: e.organization || '',
    dateRange: dateRange(e.start_date, e.end_date),
  }));

  const contactLine = [p.location, p.phone, p.email, p.linkedin, p.website]
    .filter(Boolean).join(' | ');

  return {
    name: p.full_name || 'Your Name',
    contactLine,
    headline: p.headline || '',
    summary: p.master_summary || (application && application.match_summary) || '',
    coreSkills: asArray(p.core_skills),
    experience,
    education,
    certifications: [],
    additionalSections: [],
  };
};

export default ResumeExportButtons;