#!/usr/bin/env node
// Keeps the four page guides honest.
//
// A guide is prose about controls. The day a control is renamed or removed the
// prose quietly becomes a lie, and a guide that lies is worse than none. This
// runs before every build and fails on three things:
//
//   1. a guide missing one of the six languages, or a language whose sections
//      and items do not match English (a half-finished translation),
//   2. a control the guide describes that no longer exists in the i18n
//      dictionary,
//   3. a control whose wording has changed in the dictionary while the guide
//      still uses the old word.
//
// It reads the guide modules directly, so it needs no test runner.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const LANGUAGES = ['en', 'de', 'fr', 'es', 'it', 'pt'];

const GUIDES = [
  {
    file: 'src/content/referenceFilesGuide.js',
    exportName: 'REFERENCE_FILES_GUIDE',
    // the word the guide uses -> the i18n key that must still contain it
    controls: [
      { mention: 'Previous résumé', key: 'documents.typePreviousResume' },
      { mention: 'Praise', key: 'documents.typePraise' },
      { mention: 'Certification', key: 'documents.typeCertification' }
    ]
  },
  {
    file: 'src/content/careerHistoryGuide.js',
    exportName: 'CAREER_HISTORY_GUIDE',
    controls: [
      { mention: 'Hide', key: 'history.hideEntry' },
      { mention: 'Combine', key: 'history.combineInto' },
      { mention: 'Review', key: 'history.reviewOrganize' }
    ]
  },
  {
    file: 'src/content/jobPostingsGuide.js',
    exportName: 'JOB_POSTINGS_GUIDE',
    controls: [
      { mention: 'Keep', key: 'postings.keepPosting' },
      { mention: 'Dismiss', key: 'common.dismiss' },
      { mention: 'Open posting', key: 'common.openPosting' },
      { mention: 'View the résumé', key: 'common.viewResume' },
      { mention: 'Clear all', key: 'postings.clearAll' }
    ]
  },
  {
    file: 'src/content/applicationsGuide.js',
    exportName: 'APPLICATIONS_GUIDE',
    controls: [
      { mention: 'Applied', key: 'status.applied' },
      { mention: 'Interviewing', key: 'status.interviewing' },
      { mention: 'Offer', key: 'status.offer' },
      { mention: 'Draft', key: 'status.draft' }
    ]
  }
];

const enSource = readFileSync(resolve(root, 'src/i18n/studio/en.js'), 'utf8');
const dictValue = (key) => {
  const match = enSource.match(new RegExp(`'${key.replace(/\./g, '\\.')}'\\s*:\\s*'([^']*)'`));
  return match ? match[1] : null;
};

const problems = [];

for (const guide of GUIDES) {
  const mod = await import(resolve(root, guide.file));
  const all = mod[guide.exportName];
  const base = all?.en;

  if (!base) {
    problems.push(`${guide.file}: no English guide to compare against`);
    continue;
  }

  for (const language of LANGUAGES) {
    const entry = all[language];
    if (!entry) {
      problems.push(`${guide.file}: missing ${language}`);
      continue;
    }
    if (!entry.title || !entry.intro) {
      problems.push(`${guide.file} [${language}]: needs a title and an intro`);
    }
    if (entry.sections.length !== base.sections.length) {
      problems.push(
        `${guide.file} [${language}]: ${entry.sections.length} sections, English has ${base.sections.length}`
      );
    }
    entry.sections.forEach((section, index) => {
      const mirror = base.sections[index];
      if (!mirror) return;
      if (section.items.length !== mirror.items.length) {
        problems.push(
          `${guide.file} [${language}] section ${index + 1} "${section.heading}": ` +
          `${section.items.length} items, English has ${mirror.items.length}`
        );
      }
    });
  }

  const englishText = [base.title, base.intro, ...base.sections.flatMap((s) => [s.heading, ...s.items])]
    .join(' ')
    .toLowerCase();

  for (const control of guide.controls) {
    const value = dictValue(control.key);
    if (!value) {
      problems.push(`${guide.file}: describes "${control.mention}" but ${control.key} is gone from en.js`);
      continue;
    }
    if (!value.toLowerCase().includes(control.mention.toLowerCase())) {
      problems.push(
        `${guide.file}: still says "${control.mention}" but ${control.key} now reads "${value}"`
      );
    }
    if (!englishText.includes(control.mention.toLowerCase())) {
      problems.push(`${guide.file}: never mentions "${control.mention}" in the English guide`);
    }
  }
}

if (problems.length) {
  console.error(`\nGuide check failed (${problems.length}):\n`);
  problems.forEach((problem) => console.error(`  - ${problem}`));
  console.error('\nA guide that describes a control that no longer exists misleads the client.\n');
  process.exit(1);
}

console.log(`Guides check out: ${GUIDES.length} guides, ${LANGUAGES.length} languages each.`);
