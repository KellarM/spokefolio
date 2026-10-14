// Keeps the tailored résumé to two full pages.
//
// Word does its own line breaking, so the fit is measured from the chosen style's own
// typography (font sizes, line spacing, margins - base44/shared/resumeTemplates.ts) and
// compared against a reference résumé that is known to fill exactly two pages: only how a
// style differs from that reference matters, which keeps the estimate honest across the
// airy and the compact styles alike.
//
// When a résumé runs long the weakest bullets are dropped from the oldest roles first, never
// the roles themselves: every job still appears, and a job the candidate has moved up the
// page keeps its detail no matter where it sits in the list.

import { resolveDocxConfig, resolveDocxTheme, type DocxTheme } from './resumeTemplates.ts';
import { dateKey } from './career.ts';

// A résumé that fills two pages: five jobs, twelve bullets, a full summary, and the whole
// credentials, skills and keyword lists.
const REFERENCE = {
  bulletPlan: [3, 3, 2, 2, 2],
  bulletChars: 3000,
  summaryChars: 600,
  skills: 20,
  keywords: 25,
  education: 2,
  certifications: 3
};

// A little slack, so a borderline document lands inside two pages instead of just past them.
const SAFETY = 0.96;

// Every job keeps at least two lines: trimmed to one, a whole role reads as a thin filler.
const MIN_BULLETS = 2;

function lineHeight(t: DocxTheme) {
  return (t.bodySize / 2) * 1.2 * ((t.bodyLine || 264) / 240);
}

function textHeight(text: string, width: number, t: DocxTheme, gap: number) {
  const perLine = Math.max(24, width / (0.47 * (t.bodySize / 2)));
  const lines = Math.max(1, Math.ceil(String(text || '').length / perLine));
  return lines * lineHeight(t) + gap;
}

function sectionHeight(t: DocxTheme) {
  return (t.sectionSize / 2) * 1.25 + (t.sectionBefore + t.sectionAfter) / 20;
}

function jobHeight(role, t: DocxTheme, width: number) {
  const line = lineHeight(t);
  let height = (t.roleSize / 2) * 1.25 + 9;
  if (role.dates || role.location) height += (t.metaSize / 2) * 1.25 + 3.5;
  const bullets = Array.isArray(role.bullets) ? role.bullets : [];
  for (const bullet of bullets) {
    if (!bullet) continue;
    height += textHeight(bullet, width - 13, t, 2) + line * 0.15;
  }
  return height;
}

function estimateHeight(resume, t: DocxTheme, config) {
  const width = (12240 - 2 * t.margin) / 20;
  const has = {
    summary: !!resume.summary,
    skills: (resume.skills || []).length > 0,
    experience: (resume.experience || []).length > 0,
    education: (resume.education || []).length > 0,
    certifications: (resume.certifications || []).length > 0,
    keywords: (resume.keywords || []).length > 0
  };

  // The identity block at the top of the first page.
  let total = (t.nameSize / 2) * 1.25 + 2;
  if (resume.headline) total += (t.headlineSize / 2) * 1.25 + 3;
  total += (t.contactSize / 2) * 1.25 + 3;
  if (t.identityFill) total += 24;

  for (const id of config.sections) {
    if (!has[id]) continue;
    total += sectionHeight(t);

    if (id === 'summary') {
      total += textHeight(resume.summary, width, t, 4);
    } else if (id === 'skills') {
      total += textHeight((resume.skills || []).join('   \u00B7   '), width, t, 4);
    } else if (id === 'keywords') {
      total += textHeight((resume.keywords || []).join('   \u00B7   '), width, t, 3);
    } else if (id === 'certifications') {
      for (const item of resume.certifications || []) total += textHeight(item, width - 13, t, 2);
    } else if (id === 'education') {
      for (const item of resume.education || []) {
        total += (t.roleSize / 2) * 1.25 + 6;
        if (item.detail) total += textHeight(item.detail, width, t, 3);
      }
    } else if (id === 'experience') {
      for (const role of resume.experience || []) total += jobHeight(role, t, width);
    }
  }

  return total;
}

function referenceHeight(t: DocxTheme, config) {
  const bullets = REFERENCE.bulletPlan.reduce((sum, count) => sum + count, 0);
  const bulletChars = Math.round(REFERENCE.bulletChars / bullets);
  const reference = {
    headline: 'Reference headline',
    summary: 's'.repeat(REFERENCE.summaryChars),
    skills: Array.from({ length: REFERENCE.skills }, (_, i) => `Skill number ${i}`),
    keywords: Array.from({ length: REFERENCE.keywords }, (_, i) => `Keyword number ${i}`),
    education: Array.from({ length: REFERENCE.education }, () => ({
      degree: 'Diploma, College',
      institution: 'College',
      dates: '2004',
      detail: 'A line of detail about the programme.'
    })),
    certifications: Array.from({ length: REFERENCE.certifications }, (_, i) => `Certification number ${i}`),
    experience: REFERENCE.bulletPlan.map((count) => ({
      dates: 'January 2019 to June 2021',
      location: 'City',
      bullets: Array.from({ length: count }, () => 'b'.repeat(bulletChars))
    }))
  };
  return estimateHeight(reference, t, config);
}

// The oldest jobs give up a bullet first, so the roles that answer the posting keep their
// evidence longest. Age comes from the dates, not the position: a role moved to the top of
// the résumé is not punished for it.
function dropBullet(resume) {
  let target = -1;
  let oldest = Infinity;
  let most = MIN_BULLETS;
  resume.experience.forEach((role, index) => {
    const bullets = Array.isArray(role.bullets) ? role.bullets : [];
    if (bullets.length <= MIN_BULLETS) return;
    const age = dateKey(role.dates);
    if (age < oldest || (age === oldest && bullets.length > most)) {
      oldest = age;
      most = bullets.length;
      target = index;
    }
  });
  if (target < 0) return false;
  resume.experience[target].bullets.pop();
  return true;
}

function shortenList(resume, key: string, floor: number) {
  const list = resume[key];
  if (Array.isArray(list) && list.length > floor) {
    list.pop();
    return true;
  }
  return false;
}

function shortenSummary(resume) {
  const sentences = String(resume.summary || '').match(/[^.!?]+[.!?]+/g);
  if (!sentences || sentences.length <= 3) return false;
  resume.summary = sentences.slice(0, -1).join('').trim();
  return true;
}

export function fitResumeToPages(resume, templateId?: string) {
  const theme = resolveDocxTheme(templateId);
  const config = resolveDocxConfig(templateId);
  const capacity = referenceHeight(theme, config) * SAFETY;

  const fitted = JSON.parse(JSON.stringify(resume || {}));
  if (!Array.isArray(fitted.experience)) fitted.experience = [];

  let guard = 0;
  while (estimateHeight(fitted, theme, config) > capacity && guard < 300) {
    guard += 1;
    if (dropBullet(fitted)) continue;
    if (shortenList(fitted, 'keywords', 8)) continue;
    if (shortenList(fitted, 'skills', 8)) continue;
    if (shortenList(fitted, 'certifications', 1)) continue;
    if (shortenSummary(fitted)) continue;
    break;
  }

  return fitted;
}