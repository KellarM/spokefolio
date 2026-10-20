// How a finished résumé is graded against the posting it was written for.
//
// Balanced bar: three parts carry the grade. Posting coverage (50) is worked out from the
// model's reading of the posting — every requirement it names, weighted by how much the
// posting leans on it — so the mark is always traceable to a list. Evidence quality (30) is
// the model's judgement of how concretely the writing states what was done and what it
// produced, held steady with measured checks. Format and ATS safety (20) is measured entirely
// from the résumé, the profile and the posting, so a candidate can see which line cost them.
//
// The panel reads the same shape this module returns, so what the candidate sees is what was
// scored.

export type RunDimensionKey = 'coverage' | 'evidence' | 'ats';
export type RunStatus = 'pass' | 'warn' | 'fail';
export type RequirementStatus = 'covered' | 'partial' | 'missing';
export type RequirementImportance = 'critical' | 'important' | 'nice';

export interface RunCheck {
  dimension: RunDimensionKey;
  label: string;
  status: RunStatus;
  detail: string;
  fix?: string;
  weight: number;
}

export interface RunRequirement {
  requirement: string;
  importance: RequirementImportance;
  status: RequirementStatus;
  evidence: string;
  note: string;
}

export interface RunFix {
  dimension: RunDimensionKey;
  title: string;
  detail: string;
  points: number;
}

export interface RunDimension {
  key: RunDimensionKey;
  label: string;
  weight: number;
  score: number;
  note: string;
}

export interface ResumeRunResult {
  score: number;
  band: string;
  summary: string;
  strengths: string[];
  dimensions: RunDimension[];
  requirements: RunRequirement[];
  checks: RunCheck[];
  fixes: RunFix[];
}

const WEIGHTS: Record<RunDimensionKey, number> = { coverage: 50, evidence: 30, ats: 20 };

const IMPORTANCE_WEIGHT: Record<RequirementImportance, number> = { critical: 3, important: 2, nice: 1 };

const STATUS_VALUE: Record<RequirementStatus, number> = { covered: 1, partial: 0.55, missing: 0 };

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'you', 'your', 'our', 'their', 'this', 'that', 'will', 'must',
  'have', 'has', 'are', 'was', 'were', 'from', 'into', 'all', 'any', 'who', 'what', 'when',
  'where', 'able', 'plus', 'per', 'not', 'may', 'can', 'new', 'one', 'two', 'job', 'role'
]);

function clean(value: unknown): string {
  return String(value ?? '').trim();
}

function words(value: unknown): string[] {
  return clean(value).split(/\s+/).filter(Boolean);
}

function wordCount(value: unknown): number {
  return words(value).length;
}

function hasNumber(value: unknown): boolean {
  return /\d/.test(clean(value));
}

function shorten(value: string, max: number): string {
  if (value.length <= max) return value;
  return value.slice(0, max - 1).trimEnd() + '\u2026';
}

function bulletsOf(resume: any): string[] {
  const out: string[] = [];
  for (const role of Array.isArray(resume?.experience) ? resume.experience : []) {
    for (const bullet of Array.isArray(role?.bullets) ? role.bullets : []) {
      const text = clean(bullet);
      if (text) out.push(text);
    }
  }
  return out;
}

// The visible body of the résumé, the same measure the two-page fit works to.
export function visibleWords(resume: any): number {
  let total = wordCount(resume?.headline) + wordCount(resume?.summary);
  for (const bullet of bulletsOf(resume)) total += wordCount(bullet);
  for (const list of [resume?.skills, resume?.certifications, resume?.keywords]) {
    for (const item of Array.isArray(list) ? list : []) total += wordCount(item);
  }
  return total;
}

function keyWords(value: unknown): string[] {
  return words(value)
    .map((word) => word.replace(/[^a-z0-9+#.]/gi, '').toLowerCase())
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));
}

function ratioStatus(ratio: number, pass: number, warn: number): RunStatus {
  if (ratio >= pass) return 'pass';
  if (ratio >= warn) return 'warn';
  return 'fail';
}

// A weighted pass rate over a set of checks: a pass counts fully, a warning half.
function checkScore(checks: RunCheck[], dimension: RunDimensionKey): number {
  const scoped = checks.filter((check) => check.dimension === dimension);
  if (!scoped.length) return 0;
  let weight = 0;
  let gained = 0;
  for (const check of scoped) {
    weight += check.weight;
    gained += check.weight * (check.status === 'pass' ? 1 : check.status === 'warn' ? 0.5 : 0);
  }
  return Math.round((gained / weight) * 100);
}

export function coverageScore(requirements: RunRequirement[]): number {
  let weight = 0;
  let gained = 0;
  for (const item of requirements) {
    const itemWeight = IMPORTANCE_WEIGHT[item.importance] ?? 2;
    weight += itemWeight;
    gained += itemWeight * (STATUS_VALUE[item.status] ?? 0);
  }
  if (!weight) return 0;
  return Math.round((gained / weight) * 100);
}

export function runBand(score: number): string {
  if (score >= 85) return 'Strong match';
  if (score >= 70) return 'Competitive';
  if (score >= 55) return 'Needs work';
  return 'Off target';
}

// Everything measured from the documents themselves. No model involved: these are the lines
// the candidate can point at and fix.
export function runChecks({ profile, resume, entries, job, coverLetter }: any): RunCheck[] {
  const checks: RunCheck[] = [];
  const posting = clean(job?.job_description).toLowerCase();
  const bullets = bulletsOf(resume);
  const roles = (Array.isArray(resume?.experience) ? resume.experience : []).filter(
    (role: any) => role && (role.title || (Array.isArray(role.bullets) ? role.bullets.length : 0))
  );

  // --- the header the employer reads first ---
  const missingContact = [
    ['full_name', 'name'],
    ['email', 'email'],
    ['phone', 'phone'],
    ['location', 'location']
  ].filter(([key]) => !clean(profile?.[key])).map(([, label]) => label);
  checks.push({
    dimension: 'ats',
    label: 'Contact block',
    weight: 3,
    status: missingContact.length ? 'fail' : 'pass',
    detail: missingContact.length
      ? `Not printing at the top: ${missingContact.join(', ')}.`
      : 'Name, email, phone and location all print at the top.',
    fix: missingContact.length ? 'Complete your contact details on the Profile page.' : undefined
  });

  // --- does the page answer the posting in the posting's own words ---
  const titleWords = keyWords(job?.job_title);
  const headlineText = clean(`${resume?.headline || ''} ${resume?.summary || ''}`).toLowerCase();
  const titleHits = titleWords.filter((word) => headlineText.includes(word));
  const titleRatio = titleWords.length ? titleHits.length / titleWords.length : 1;
  checks.push({
    dimension: 'coverage',
    label: 'Role title echoed',
    weight: 2,
    status: ratioStatus(titleRatio, 0.6, 0.34),
    detail: titleWords.length
      ? `The headline and summary use ${titleHits.length} of the ${titleWords.length} words in the posting's title.`
      : 'The posting does not name a role title, so there is nothing to echo.',
    fix: titleWords.length
      ? "Work the posting's job title into the headline and the first sentence of the summary."
      : undefined
  });

  const keywords = (Array.isArray(resume?.keywords) ? resume.keywords : []).map(clean).filter(Boolean);
  const echoed = keywords.filter((word) => posting.includes(word.toLowerCase()));
  const echoRatio = keywords.length ? echoed.length / keywords.length : 0;
  checks.push({
    dimension: 'coverage',
    label: 'Keyword line echoes the posting',
    weight: 3,
    status: keywords.length ? ratioStatus(echoRatio, 0.55, 0.3) : 'fail',
    detail: keywords.length
      ? `${echoed.length} of the ${keywords.length} terms on the keyword line appear in the posting.`
      : 'The keyword line is empty, so the screening software has nothing to match.',
    fix: keywords.length
      ? 'Swap keyword-line terms for wording the posting itself uses.'
      : 'Add a keyword line built from the posting, using only terms you genuinely cover.'
  });

  // --- evidence sitting in the history that never made it onto the page ---
  const onPage = [resume?.headline, resume?.summary, resume?.skills, resume?.keywords, bullets]
    .flat()
    .map((part) => clean(part).toLowerCase())
    .join(' ');
  const historyItems: string[] = [];
  for (const entry of Array.isArray(entries) ? entries : []) {
    for (const list of [entry?.skills, entry?.keywords]) {
      for (const item of Array.isArray(list) ? list : []) {
        const text = clean(item);
        if (text.length > 1 && !historyItems.some((seen) => seen.toLowerCase() === text.toLowerCase())) {
          historyItems.push(text);
        }
      }
    }
  }
  // Only what the posting itself asks for counts: a targeted résumé is right to leave most of
  // a long history off the page, so flagging all of it would be noise.
  const unused = historyItems.filter(
    (item) => !onPage.includes(item.toLowerCase()) && posting.includes(item.toLowerCase())
  );
  checks.push({
    dimension: 'coverage',
    label: 'Asked-for evidence left off the page',
    weight: 2,
    status: unused.length ? 'warn' : 'pass',
    detail: unused.length
      ? `The posting asks for ${unused.slice(0, 6).join(', ')}${unused.length > 6 ? ` and ${unused.length - 6} more` : ''}. Your history evidences ${unused.length === 1 ? 'it' : 'them'}, but this résumé does not mention ${unused.length === 1 ? 'it' : 'them'}.`
      : 'Every skill the posting names that your history evidences is already on the page.',
    fix: unused.length
      ? 'Add these to the skills or keyword line — your history already evidences them, so nothing is invented.'
      : undefined
  });

  // --- how the writing reads ---
  const quantified = bullets.filter(hasNumber).length;
  const quantifiedRatio = bullets.length ? quantified / bullets.length : 0;
  checks.push({
    dimension: 'evidence',
    label: 'Bullets carry numbers',
    weight: 3,
    status: bullets.length ? ratioStatus(quantifiedRatio, 0.6, 0.35) : 'fail',
    detail: bullets.length
      ? `${quantified} of ${bullets.length} bullet lines carry a number or a percentage.`
      : 'There are no bullet lines on the résumé yet.',
    fix: 'Give the vaguest bullets the numbers your history already holds — volumes, counts, percentages, dollars, time saved.'
  });

  const wellSized = bullets.filter((bullet) => {
    const count = wordCount(bullet);
    return count >= 15 && count <= 45;
  }).length;
  const sizedRatio = bullets.length ? wellSized / bullets.length : 0;
  checks.push({
    dimension: 'evidence',
    label: 'Bullet length',
    weight: 2,
    status: bullets.length ? ratioStatus(sizedRatio, 0.75, 0.5) : 'fail',
    detail: bullets.length
      ? `${wellSized} of ${bullets.length} bullets run 15 to 45 words.`
      : 'There are no bullet lines to measure yet.',
    fix: 'Trim or expand the bullets outside 15 to 45 words so each one carries a scope and a result.'
  });

  // --- the checks the screening software makes for itself ---
  const summaryWords = wordCount(resume?.summary);
  checks.push({
    dimension: 'ats',
    label: 'Summary length',
    weight: 2,
    status: summaryWords >= 80 && summaryWords <= 200 ? 'pass' : summaryWords >= 50 && summaryWords <= 260 ? 'warn' : 'fail',
    detail: `The summary runs ${summaryWords} words.`,
    fix: 'Keep the summary between 80 and 200 words, leading with the strongest posting matches.'
  });

  const skillCount = (Array.isArray(resume?.skills) ? resume.skills : []).filter(Boolean).length;
  checks.push({
    dimension: 'ats',
    label: 'Skills list',
    weight: 2,
    status: skillCount >= 12 && skillCount <= 24 ? 'pass' : skillCount >= 8 && skillCount <= 32 ? 'warn' : 'fail',
    detail: `The skills list holds ${skillCount} items.`,
    fix: 'Aim for 12 to 24 skills, ordered by relevance to this posting.'
  });

  checks.push({
    dimension: 'ats',
    label: 'Keyword line size',
    weight: 2,
    status: keywords.length >= 14 && keywords.length <= 35 ? 'pass' : keywords.length >= 8 && keywords.length <= 55 ? 'warn' : 'fail',
    detail: `The keyword line holds ${keywords.length} terms.`,
    fix: 'Aim for 14 to 35 keywords, drawn from the posting.'
  });

  const incompleteRoles = roles.filter((role: any) => !clean(role.title) || !clean(role.dates));
  checks.push({
    dimension: 'ats',
    label: 'Every role block complete',
    weight: 2,
    status: roles.length && !incompleteRoles.length ? 'pass' : incompleteRoles.length ? 'warn' : 'fail',
    detail: roles.length
      ? `${roles.length} role blocks, ${incompleteRoles.length} missing a title or dates.`
      : 'No role blocks on the résumé yet.',
    fix: 'Give every role block its job title and its dates.'
  });

  const letterWords = wordCount(coverLetter);
  checks.push({
    dimension: 'ats',
    label: 'Cover letter ready',
    weight: 1,
    status: letterWords >= 120 ? 'pass' : 'warn',
    detail: letterWords ? `The cover letter runs ${letterWords} words.` : 'No cover letter is attached to this application yet.',
    fix: letterWords ? undefined : 'Write the cover letter for this posting so the package is ready to send.'
  });

  const body = visibleWords(resume);
  checks.push({
    dimension: 'ats',
    label: 'Fills the two pages',
    weight: 1,
    status: body >= 560 && body <= 700 ? 'pass' : body >= 450 && body <= 760 ? 'warn' : 'fail',
    detail: `The visible body runs about ${body} words against the two-page target.`,
    fix: 'Add the real detail your history still holds, or trim the restated lines, to fill two pages.'
  });

  return checks;
}

function readRequirements(value: unknown): RunRequirement[] {
  const list = Array.isArray(value) ? value : [];
  return list
    .map((item: any) => ({
      requirement: clean(item?.requirement),
      importance: (['critical', 'important', 'nice'].includes(item?.importance) ? item.importance : 'important') as RequirementImportance,
      status: (['covered', 'partial', 'missing'].includes(item?.status) ? item.status : 'partial') as RequirementStatus,
      evidence: clean(item?.evidence),
      note: clean(item?.note)
    }))
    .filter((item) => item.requirement)
    .slice(0, 12);
}

function clampScore(value: unknown, fallback: number): number {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(0, Math.min(100, Math.round(number)));
}

function pointShare(gap: number, share: number): number {
  return Math.max(1, Math.round(gap * share));
}

// The whole run: the measured checks, the model's reading of the posting and the writing, and
// the one number that follows from them.
export function buildResumeRun({ profile, resume, entries, job, coverLetter, judgement }: any): ResumeRunResult {
  const checks = runChecks({ profile, resume, entries, job, coverLetter });
  const requirements = readRequirements(judgement?.requirements);
  const coverage = coverageScore(requirements);
  const evidenceChecks = checkScore(checks, 'evidence');
  const judged = clampScore(judgement?.evidence_score, evidenceChecks);
  // The model judges how the writing reads; the measured checks keep the mark honest.
  const evidence = Math.round(judged * 0.7 + evidenceChecks * 0.3);
  const ats = checkScore(checks, 'ats');
  const score = Math.round(coverage * 0.5 + evidence * 0.3 + ats * 0.2);

  const counts = { covered: 0, partial: 0, missing: 0 };
  for (const item of requirements) counts[item.status] += 1;
  const failedAts = checks.filter((check) => check.dimension === 'ats' && check.status === 'fail').length;
  const warnedAts = checks.filter((check) => check.dimension === 'ats' && check.status === 'warn').length;

  const dimensions: RunDimension[] = [
    {
      key: 'coverage',
      label: 'Posting coverage',
      weight: WEIGHTS.coverage,
      score: coverage,
      note: requirements.length
        ? `${counts.covered} of ${requirements.length} posting priorities are answered in full, ${counts.partial} partly and ${counts.missing} not yet.`
        : 'The posting priorities could not be read this time. Run the check again in a moment.'
    },
    {
      key: 'evidence',
      label: 'Evidence quality',
      weight: WEIGHTS.evidence,
      score: evidence,
      note: clean(judgement?.evidence_note) || 'Judged by how concretely each line states what was done and what it produced.'
    },
    {
      key: 'ats',
      label: 'Format & screening safety',
      weight: WEIGHTS.ats,
      score: ats,
      note: failedAts
        ? `${failedAts} format ${failedAts === 1 ? 'check needs' : 'checks need'} attention${warnedAts ? `, and ${warnedAts} more ${warnedAts === 1 ? 'is' : 'are'} worth a look` : ''}.`
        : warnedAts
          ? `Every hard check passes; ${warnedAts} could still be tightened.`
          : 'Every format check reads clean — the screening software will read this without trouble.'
    }
  ];

  // What would raise the mark most, each carrying the points it is worth.
  const gaps: Record<RunDimensionKey, number> = {
    coverage: (WEIGHTS.coverage * (100 - coverage)) / 100,
    evidence: (WEIGHTS.evidence * (100 - evidence)) / 100,
    ats: (WEIGHTS.ats * (100 - ats)) / 100
  };
  const importanceTotal = requirements.reduce((sum, item) => sum + IMPORTANCE_WEIGHT[item.importance], 0) || 1;

  const requirementFixes: RunFix[] = requirements
    .filter((item) => item.status !== 'covered')
    .map((item) => ({
      dimension: 'coverage' as RunDimensionKey,
      title: `${item.status === 'missing' ? 'Add evidence for' : 'Strengthen'}: ${shorten(item.requirement, 88)}`,
      detail:
        item.note ||
        item.evidence ||
        (item.status === 'missing'
          ? 'Nothing on the résumé answers this yet. Leave it out rather than claiming it, and prepare an answer for the interview.'
          : 'The experience is there; make the résumé state it in the posting\u2019s own words.'),
      points: pointShare(gaps.coverage, IMPORTANCE_WEIGHT[item.importance] / importanceTotal)
    }));

  const measuredFixes: RunFix[] = [];
  const weightByDimension: Record<string, number> = {};
  for (const check of checks) {
    if (check.status === 'pass' || !check.fix) continue;
    weightByDimension[check.dimension] = (weightByDimension[check.dimension] || 0) + check.weight;
  }
  for (const check of checks) {
    if (check.status === 'pass' || !check.fix) continue;
    measuredFixes.push({
      dimension: check.dimension,
      title: check.label,
      detail: `${check.detail} ${check.fix}`,
      points: 0
    });
  }

  const modelFixes: RunFix[] = (Array.isArray(judgement?.fixes) ? judgement.fixes : [])
    .map((item: any) => ({
      dimension: 'evidence' as RunDimensionKey,
      title: clean(item?.title),
      detail: clean(item?.detail),
      points: 0
    }))
    .filter((item) => item.title)
    .slice(0, 3);

  // The measured checks and the model's content notes share whatever their part of the grade
  // still leaves on the table, so the points shown add up to something honest.
  const dimensionItems: RunFix[] = [...measuredFixes, ...modelFixes];
  const perDimensionCount: Record<string, number> = {};
  for (const item of dimensionItems) {
    perDimensionCount[item.dimension] = (perDimensionCount[item.dimension] || 0) + 1;
  }
  for (const item of measuredFixes) {
    const share = (weightByDimension[item.dimension] || 1) / (perDimensionCount[item.dimension] || 1);
    item.points = pointShare(gaps[item.dimension], share / (weightByDimension[item.dimension] || 1));
  }
  for (const item of modelFixes) {
    item.points = pointShare(gaps[item.dimension], 1 / (perDimensionCount[item.dimension] || 1));
  }

  const fixes = [...requirementFixes, ...dimensionItems].sort((a, b) => b.points - a.points).slice(0, 5);

  const strengths = (Array.isArray(judgement?.strengths) ? judgement.strengths : [])
    .map(clean)
    .filter(Boolean)
    .slice(0, 4);

  return {
    score,
    band: runBand(score),
    summary:
      clean(judgement?.summary) ||
      `This résumé answers ${counts.covered} of the ${requirements.length} priorities the posting names, and its format reads cleanly.`,
    strengths,
    dimensions,
    requirements,
    checks,
    fixes
  };
}