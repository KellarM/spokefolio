// Visual themes for the résumé Word export, keyed by the same template ids the app
// offers in the picker (src/lib/resumeTemplates.js), so the downloaded document matches
// the on-screen preview.
//
// OOXML conventions: colours are hex without '#', font sizes are half-points,
// letter spacing is twentieths of a point, spacing/before/after are in points*20.

export interface DocxTheme {
  nameFont: string;
  nameSize: number;
  nameColor: string;
  nameSpacing: number;
  nameUpper: boolean;
  nameAlign: 'left' | 'center' | 'right';
  identityBar: string | null;
  identityBarSize: number;
  identityRule: string | null;
  identityRuleSize: number;
  // A solid band behind the identity block, with the ink that prints on it. Styles
  // without a band leave these null and use their own name/headline/contact colours.
  identityFill: string | null;
  identityNameColor: string | null;
  identityHeadlineColor: string | null;
  identityContactColor: string | null;
  headlineFont: string;
  headlineSize: number;
  headlineColor: string;
  headlineSpacing: number;
  headlineUpper: boolean;
  headlineAlign: 'left' | 'center' | 'right';
  contactFont: string;
  contactSize: number;
  contactColor: string;
  contactAlign: 'left' | 'center' | 'right';
  contactSeparator: string;
  sectionFont: string;
  sectionSize: number;
  sectionColor: string;
  sectionSpacing: number;
  sectionUpper: boolean;
  sectionBold: boolean;
  sectionAlign: 'left' | 'center' | 'right';
  sectionRule: string | null;
  sectionRuleSize: number;
  sectionBar: string | null;
  sectionBarSize: number;
  sectionFill: string | null;
  sectionBefore: number;
  sectionAfter: number;
  roleFont: string;
  roleSize: number;
  roleColor: string;
  roleUpper: boolean;
  metaFont: string;
  metaSize: number;
  metaColor: string;
  metaItalic: boolean;
  bodyFont: string;
  bodySize: number;
  bodyColor: string;
  bodyLine: number;
  bulletMarker: string;
  bulletSize: number;
  bulletColor: string;
  skillsFont: string;
  skillsSize: number;
  skillsColor: string;
  skillsBold: boolean;
  skillsSeparator: string;
  skillsSeparatorColor: string;
  margin: number;
  // How the skills list reads in the finished document: one designed line, one skill per
  // line, or two columns.
  skillsLayout: 'line' | 'lines' | 'columns';
}

// The original editorial style: the profile default and the fallback for anything unknown.
const BASE: DocxTheme = {
  nameFont: 'Georgia',
  nameSize: 46,
  nameColor: '1B4159',
  nameSpacing: 10,
  nameUpper: false,
  nameAlign: 'left',
  identityBar: 'B0854A',
  identityBarSize: 24,
  identityRule: null,
  identityRuleSize: 0,
  identityFill: null,
  identityNameColor: null,
  identityHeadlineColor: null,
  identityContactColor: null,
  headlineFont: 'Calibri',
  headlineSize: 17,
  headlineColor: 'B0854A',
  headlineSpacing: 34,
  headlineUpper: true,
  headlineAlign: 'left',
  contactFont: 'Calibri',
  contactSize: 18,
  contactColor: '5B6472',
  contactAlign: 'left',
  contactSeparator: '   \u2022   ',
  sectionFont: 'Calibri',
  sectionSize: 20,
  sectionColor: '1B4159',
  sectionSpacing: 26,
  sectionUpper: true,
  sectionBold: true,
  sectionAlign: 'left',
  sectionRule: 'B0854A',
  sectionRuleSize: 10,
  sectionBar: null,
  sectionBarSize: 0,
  sectionFill: null,
  sectionBefore: 340,
  sectionAfter: 160,
  roleFont: 'Calibri',
  roleSize: 23,
  roleColor: '1B4159',
  roleUpper: false,
  metaFont: 'Calibri',
  metaSize: 18,
  metaColor: 'B0854A',
  metaItalic: true,
  bodyFont: 'Calibri',
  bodySize: 21,
  bodyColor: '1F2937',
  bodyLine: 264,
  bulletMarker: '\u25AA',
  bulletSize: 19,
  bulletColor: 'B0854A',
  skillsFont: 'Calibri',
  skillsSize: 21,
  skillsColor: '1B4159',
  skillsBold: true,
  skillsSeparator: '   \u00B7   ',
  skillsSeparatorColor: 'B0854A',
  margin: 1008,
  skillsLayout: 'line'
};

const OVERRIDES: Record<string, Partial<DocxTheme>> = {
  ats: {
    nameFont: 'Times New Roman',
    nameSize: 40,
    nameColor: '000000',
    nameSpacing: 0,
    nameAlign: 'center',
    identityBar: null,
    headlineFont: 'Times New Roman',
    headlineSize: 18,
    headlineColor: '333333',
    headlineSpacing: 20,
    headlineAlign: 'center',
    contactFont: 'Times New Roman',
    contactColor: '333333',
    contactAlign: 'center',
    contactSeparator: '   |   ',
    sectionFont: 'Times New Roman',
    sectionColor: '000000',
    sectionSpacing: 20,
    sectionRule: null,
    sectionBefore: 260,
    sectionAfter: 120,
    roleFont: 'Times New Roman',
    roleSize: 22,
    roleColor: '000000',
    metaFont: 'Times New Roman',
    metaColor: '333333',
    metaItalic: false,
    bodyFont: 'Times New Roman',
    bodyColor: '000000',
    bulletMarker: '-',
    bulletColor: '333333',
    skillsFont: 'Times New Roman',
    skillsColor: '000000',
    skillsBold: false,
    skillsSeparator: '   |   ',
    skillsSeparatorColor: '333333',
    margin: 1080
  },
  modern: {
    nameFont: 'Calibri',
    nameSize: 44,
    nameColor: '111827',
    nameSpacing: 0,
    identityBar: null,
    identityRule: 'E5E7EB',
    identityRuleSize: 6,
    headlineSize: 16,
    headlineColor: '4F46E5',
    headlineSpacing: 28,
    contactColor: '6B7280',
    sectionSize: 18,
    sectionColor: '4F46E5',
    sectionSpacing: 24,
    sectionRule: null,
    sectionBefore: 320,
    sectionAfter: 140,
    roleSize: 22,
    roleColor: '111827',
    metaColor: '6B7280',
    metaItalic: false,
    bodySize: 20,
    bodyColor: '374151',
    bulletMarker: '\u2022',
    bulletColor: '4F46E5',
    skillsColor: '111827',
    skillsSeparatorColor: '9CA3AF',
    margin: 1080
  },
  minimal: {
    nameFont: 'Calibri',
    nameSize: 40,
    nameSpacing: 0,
    nameColor: '1F2937',
    identityBar: null,
    headlineSize: 15,
    headlineColor: '9CA3AF',
    headlineSpacing: 40,
    contactColor: '9CA3AF',
    contactSize: 17,
    sectionSize: 16,
    sectionColor: '9CA3AF',
    sectionSpacing: 40,
    sectionBold: false,
    sectionRule: null,
    sectionBefore: 420,
    sectionAfter: 140,
    roleSize: 20,
    roleColor: '1F2937',
    metaColor: '9CA3AF',
    metaSize: 17,
    metaItalic: false,
    bodySize: 20,
    bodyColor: '4B5563',
    bodyLine: 300,
    bulletMarker: '\u2013',
    bulletSize: 18,
    bulletColor: '9CA3AF',
    skillsSize: 19,
    skillsColor: '374151',
    skillsBold: false,
    skillsSeparatorColor: 'D1D5DB',
    margin: 1134
  },
  executive: {
    nameFont: 'Georgia',
    nameSize: 46,
    nameColor: '1F2937',
    nameSpacing: 0,
    nameAlign: 'center',
    identityBar: null,
    identityRule: '1F2937',
    identityRuleSize: 6,
    headlineFont: 'Calibri',
    headlineSize: 17,
    headlineColor: '4B5563',
    headlineSpacing: 30,
    headlineAlign: 'center',
    contactFont: 'Georgia',
    contactColor: '4B5563',
    contactAlign: 'center',
    sectionFont: 'Georgia',
    sectionSize: 20,
    sectionColor: '1F2937',
    sectionSpacing: 20,
    sectionRule: '1F2937',
    sectionRuleSize: 6,
    sectionBefore: 320,
    sectionAfter: 150,
    roleFont: 'Georgia',
    roleSize: 22,
    roleColor: '1F2937',
    metaFont: 'Georgia',
    metaColor: '4B5563',
    bodyFont: 'Georgia',
    bodyColor: '1F2937',
    bulletMarker: '\u2022',
    bulletColor: '4B5563',
    skillsFont: 'Georgia',
    skillsColor: '1F2937',
    skillsBold: false,
    skillsSeparatorColor: '4B5563',
    margin: 1080
  },
  emerald: {
    nameFont: 'Georgia',
    nameColor: '0F3D2E',
    nameSpacing: 6,
    identityBar: '0F6B4F',
    headlineColor: '0F6B4F',
    headlineSpacing: 26,
    contactColor: '5B6472',
    sectionSize: 19,
    sectionColor: '0F3D2E',
    sectionSpacing: 24,
    sectionRule: null,
    sectionBar: '0F6B4F',
    sectionBarSize: 24,
    sectionBefore: 320,
    sectionAfter: 150,
    roleSize: 22,
    roleColor: '0F3D2E',
    metaColor: '0F6B4F',
    metaItalic: false,
    bodyColor: '374151',
    bulletMarker: '\u25AA',
    bulletColor: '0F6B4F',
    skillsColor: '0F3D2E',
    skillsSeparatorColor: '0F6B4F'
  },
  crimson: {
    nameFont: 'Georgia',
    nameColor: '7F1D1D',
    nameSpacing: 4,
    identityBar: null,
    identityRule: '7F1D1D',
    identityRuleSize: 6,
    headlineColor: '7F1D1D',
    headlineSpacing: 30,
    contactColor: '4B5563',
    sectionFont: 'Georgia',
    sectionColor: '7F1D1D',
    sectionSpacing: 22,
    sectionRule: '7F1D1D',
    sectionRuleSize: 6,
    sectionBefore: 320,
    sectionAfter: 150,
    roleFont: 'Georgia',
    roleColor: '1F2937',
    metaColor: '7F1D1D',
    bodyColor: '1F2937',
    bulletMarker: '\u2022',
    bulletColor: '7F1D1D',
    skillsColor: '1F2937',
    skillsSeparatorColor: '7F1D1D'
  },
  graphite: {
    nameFont: 'Calibri',
    nameSize: 46,
    nameUpper: true,
    nameSpacing: 20,
    nameColor: '111827',
    identityBar: null,
    identityRule: '111827',
    identityRuleSize: 12,
    headlineSize: 16,
    headlineColor: '374151',
    headlineSpacing: 34,
    contactColor: '6B7280',
    contactSize: 17,
    sectionSize: 19,
    sectionColor: 'FFFFFF',
    sectionFill: '111827',
    sectionSpacing: 24,
    sectionRule: null,
    sectionBefore: 320,
    sectionAfter: 140,
    roleSize: 22,
    roleColor: '111827',
    metaColor: '6B7280',
    metaSize: 17,
    metaItalic: false,
    bodySize: 20,
    bodyColor: '374151',
    bulletMarker: '\u25AA',
    bulletColor: '111827',
    skillsColor: '111827',
    skillsSeparatorColor: '9CA3AF'
  },
  teal: {
    nameFont: 'Calibri',
    nameSize: 40,
    nameColor: '0F172A',
    nameSpacing: 0,
    identityBar: null,
    identityRule: '99F6E4',
    identityRuleSize: 6,
    headlineSize: 15,
    headlineColor: '0F766E',
    headlineSpacing: 30,
    contactColor: '64748B',
    contactSize: 17,
    sectionSize: 17,
    sectionColor: '0F766E',
    sectionSpacing: 30,
    sectionRule: '99F6E4',
    sectionRuleSize: 6,
    sectionBefore: 280,
    sectionAfter: 120,
    roleSize: 21,
    roleColor: '0F172A',
    metaColor: '0F766E',
    metaSize: 17,
    metaItalic: false,
    bodySize: 19,
    bodyColor: '334155',
    bodyLine: 240,
    bulletMarker: '\u2022',
    bulletSize: 17,
    bulletColor: '0F766E',
    skillsSize: 19,
    skillsColor: '0F172A',
    skillsSeparatorColor: '5EEAD4',
    margin: 900
  },
  bronze: {
    nameFont: 'Georgia',
    nameColor: '4A3524',
    nameSpacing: 24,
    identityBar: null,
    identityRule: 'D6C7A9',
    identityRuleSize: 6,
    headlineSize: 16,
    headlineColor: 'B0854A',
    headlineSpacing: 30,
    contactColor: '6B7280',
    sectionFont: 'Georgia',
    sectionColor: '4A3524',
    sectionSpacing: 30,
    sectionRule: 'D6C7A9',
    sectionRuleSize: 6,
    sectionBefore: 320,
    sectionAfter: 150,
    roleFont: 'Georgia',
    roleSize: 22,
    roleColor: '4A3524',
    metaColor: 'B0854A',
    bodyColor: '3F3A33',
    bulletMarker: '\u25AA',
    bulletColor: 'B0854A',
    skillsColor: '4A3524',
    skillsSeparatorColor: 'B0854A'
  },
  slate: {
    nameFont: 'Calibri',
    nameSize: 44,
    nameColor: '0F172A',
    nameSpacing: 0,
    identityBar: null,
    identityRule: '0F172A',
    identityRuleSize: 8,
    headlineSize: 16,
    headlineColor: '475569',
    headlineSpacing: 26,
    contactColor: '334155',
    contactAlign: 'left',
    sectionSize: 18,
    sectionColor: '0F172A',
    sectionSpacing: 26,
    sectionRule: 'CBD5E1',
    sectionRuleSize: 6,
    sectionBefore: 320,
    sectionAfter: 140,
    roleSize: 22,
    roleColor: '0F172A',
    metaColor: '64748B',
    metaItalic: false,
    bodyColor: '334155',
    bulletMarker: '\u2022',
    bulletColor: '64748B',
    skillsColor: '0F172A',
    skillsSeparatorColor: 'CBD5E1'
  },
  mono: {
    nameFont: 'Calibri',
    nameSize: 42,
    nameUpper: true,
    nameSpacing: 30,
    nameColor: '000000',
    nameAlign: 'center',
    headlineAlign: 'center',
    identityBar: null,
    identityRule: '000000',
    identityRuleSize: 6,
    headlineSize: 15,
    headlineColor: '000000',
    headlineSpacing: 34,
    contactColor: '4B5563',
    contactAlign: 'center',
    sectionSize: 19,
    sectionColor: '000000',
    sectionSpacing: 28,
    sectionRule: '9CA3AF',
    sectionRuleSize: 4,
    sectionBefore: 320,
    sectionAfter: 140,
    roleSize: 22,
    roleColor: '000000',
    metaColor: '4B5563',
    metaItalic: false,
    bodySize: 20,
    bodyColor: '1F2937',
    bulletMarker: '\u2013',
    bulletColor: '4B5563',
    skillsColor: '000000',
    skillsBold: false,
    skillsSeparatorColor: '9CA3AF'
  },
  'timeline-navy': {
    nameFont: 'Calibri', nameSize: 44, nameUpper: true, nameSpacing: 24, nameColor: '2F3A4F',
    identityBar: null, identityRule: null, identityRuleSize: 0,
    identityFill: '2F3A4F', identityNameColor: 'FFFFFF', identityHeadlineColor: 'C9D1E0', identityContactColor: 'C9D1E0',
    headlineSize: 17, headlineColor: '5B6472', headlineSpacing: 20, contactColor: '5B6472',
    sectionSize: 20, sectionColor: '2F3A4F', sectionSpacing: 40, sectionRule: '8A97B1', sectionRuleSize: 12,
    sectionBefore: 320, sectionAfter: 140, roleSize: 21, roleColor: '2F3A4F', roleUpper: true,
    metaColor: '5B6472', metaItalic: false, bodySize: 20, bodyColor: '374151',
    bulletMarker: '\u2022', bulletColor: '2F3A4F', skillsColor: '2F3A4F', skillsSeparatorColor: '8A97B1'
  },
  'timeline-plum': {
    nameFont: 'Calibri', nameSize: 44, nameUpper: true, nameSpacing: 24, nameColor: '4A2545',
    identityBar: null, identityRule: null, identityRuleSize: 0,
    identityFill: '4A2545', identityNameColor: 'FFFFFF', identityHeadlineColor: 'E3CDE0', identityContactColor: 'E3CDE0',
    headlineSize: 17, headlineColor: '6B5A6A', headlineSpacing: 20, contactColor: '6B5A6A',
    sectionSize: 20, sectionColor: '4A2545', sectionSpacing: 40, sectionRule: 'B58BB0', sectionRuleSize: 12,
    sectionBefore: 320, sectionAfter: 140, roleSize: 21, roleColor: '4A2545', roleUpper: true,
    metaColor: '6B5A6A', metaItalic: false, bodySize: 20, bodyColor: '374151',
    bulletMarker: '\u2022', bulletColor: '4A2545', skillsColor: '4A2545', skillsSeparatorColor: 'B58BB0'
  },
  'studio-charcoal': {
    nameFont: 'Calibri', nameSize: 42, nameUpper: true, nameSpacing: 50, nameColor: '1A1A1A',
    identityBar: null, headlineSize: 16, headlineColor: '8A8A90', headlineSpacing: 50, contactColor: '6B6B72',
    sectionSize: 19, sectionColor: '1A1A1A', sectionSpacing: 50, sectionRule: '1A1A1A', sectionRuleSize: 12,
    sectionBefore: 360, sectionAfter: 140, roleSize: 21, roleColor: '1A1A1A',
    metaColor: '6B6B72', metaItalic: false, bodySize: 20, bodyColor: '4B4B52',
    bulletMarker: '\u2022', bulletColor: '1A1A1A', skillsColor: '1A1A1A', skillsBold: false, skillsSeparatorColor: '8A8A90'
  },
  'studio-sage': {
    nameFont: 'Calibri', nameSize: 42, nameUpper: true, nameSpacing: 50, nameColor: '2E3B2F',
    identityBar: null, headlineSize: 16, headlineColor: '7C8A7D', headlineSpacing: 50, contactColor: '66726A',
    sectionSize: 19, sectionColor: '2E3B2F', sectionSpacing: 50, sectionRule: '2E3B2F', sectionRuleSize: 12,
    sectionBefore: 360, sectionAfter: 140, roleSize: 21, roleColor: '2E3B2F',
    metaColor: '66726A', metaItalic: false, bodySize: 20, bodyColor: '46504A',
    bulletMarker: '\u2022', bulletColor: '2E3B2F', skillsColor: '2E3B2F', skillsBold: false, skillsSeparatorColor: '7C8A7D'
  },
  'gold-navy': {
    nameFont: 'Georgia', nameSize: 52, nameUpper: true, nameSpacing: 6, nameColor: '1E2A44',
    identityBar: null, identityRule: 'C09A4E', identityRuleSize: 18,
    headlineSize: 16, headlineColor: '5B6472', headlineSpacing: 50, contactColor: '5B6472',
    sectionSize: 19, sectionColor: '1E2A44', sectionSpacing: 44, sectionRule: null, sectionBar: 'C09A4E', sectionBarSize: 32,
    sectionBefore: 340, sectionAfter: 140, roleFont: 'Georgia', roleSize: 23, roleColor: '1E2A44',
    metaColor: '5B6472', metaItalic: false, bodySize: 20, bodyColor: '4B5563',
    bulletMarker: '\u25AA', bulletColor: 'C09A4E', skillsColor: '1E2A44', skillsSeparatorColor: 'C09A4E'
  },
  'gold-burgundy': {
    nameFont: 'Georgia', nameSize: 52, nameUpper: true, nameSpacing: 6, nameColor: '5A1E2B',
    identityBar: null, identityRule: 'C09A4E', identityRuleSize: 18,
    headlineSize: 16, headlineColor: '6B5A5C', headlineSpacing: 50, contactColor: '6B5A5C',
    sectionSize: 19, sectionColor: '5A1E2B', sectionSpacing: 44, sectionRule: null, sectionBar: 'C09A4E', sectionBarSize: 32,
    sectionBefore: 340, sectionAfter: 140, roleFont: 'Georgia', roleSize: 23, roleColor: '5A1E2B',
    metaColor: '6B5A5C', metaItalic: false, bodySize: 20, bodyColor: '4B4446',
    bulletMarker: '\u25AA', bulletColor: 'C09A4E', skillsColor: '5A1E2B', skillsSeparatorColor: 'C09A4E'
  },
  'classic-rule': {
    nameFont: 'Georgia', nameSize: 42, nameUpper: true, nameSpacing: 40, nameColor: '111111',
    identityBar: null, identityRule: '9A9A9A', identityRuleSize: 6,
    headlineFont: 'Georgia', headlineSize: 18, headlineColor: '111111', headlineSpacing: 0, headlineUpper: false,
    contactFont: 'Georgia', contactColor: '4B4B4B',
    sectionFont: 'Georgia', sectionSize: 19, sectionColor: '111111', sectionSpacing: 60, sectionBold: false,
    sectionRule: '9A9A9A', sectionRuleSize: 6, sectionBefore: 300, sectionAfter: 140,
    roleFont: 'Georgia', roleSize: 22, roleColor: '111111', metaFont: 'Georgia', metaColor: '4B4B4B', metaItalic: false,
    bodyFont: 'Georgia', bodySize: 20, bodyColor: '1F1F1F',
    bulletMarker: '\u2022', bulletColor: '111111', skillsFont: 'Georgia', skillsColor: '111111', skillsBold: false, skillsSeparatorColor: '9A9A9A'
  },
  'classic-navy': {
    nameFont: 'Georgia', nameSize: 42, nameUpper: true, nameSpacing: 40, nameColor: '1E3A5F',
    identityBar: null, identityRule: '9FB3CC', identityRuleSize: 6,
    headlineFont: 'Georgia', headlineSize: 18, headlineColor: '1E3A5F', headlineSpacing: 0, headlineUpper: false,
    contactFont: 'Georgia', contactColor: '4B5563',
    sectionFont: 'Georgia', sectionSize: 19, sectionColor: '1E3A5F', sectionSpacing: 60, sectionBold: false,
    sectionRule: '9FB3CC', sectionRuleSize: 6, sectionBefore: 300, sectionAfter: 140,
    roleFont: 'Georgia', roleSize: 22, roleColor: '1E3A5F', metaFont: 'Georgia', metaColor: '4B5563', metaItalic: false,
    bodyFont: 'Georgia', bodySize: 20, bodyColor: '1F2937',
    bulletMarker: '\u2022', bulletColor: '1E3A5F', skillsFont: 'Georgia', skillsColor: '1E3A5F', skillsBold: false, skillsSeparatorColor: '9FB3CC'
  }
};

export function resolveDocxTheme(id?: string): DocxTheme {
  const override = id ? OVERRIDES[id] : undefined;
  return override ? { ...BASE, ...override } : BASE;
}

// Beyond the visual theme, each style carries a configuration: whether a portrait belongs
// beside the name, and the order its sections are laid out in. Mirrored from the app's
// catalogue (src/lib/resumeTemplates.js) so the Word file follows the preview.
export interface DocxConfig {
  photo: boolean;
  sections: string[];
}

const BASE_CONFIG: DocxConfig = {
  photo: false,
  sections: ['summary', 'skills', 'experience', 'education', 'certifications', 'keywords']
};

const CONFIGS: Record<string, Partial<DocxConfig>> = {
  modern: { photo: true, sections: ['skills', 'summary', 'experience', 'education', 'certifications', 'keywords'] },
  emerald: { photo: true, sections: ['skills', 'summary', 'experience', 'certifications', 'education', 'keywords'] },
  graphite: { photo: true, sections: ['summary', 'skills', 'experience', 'certifications', 'education', 'keywords'] },
  teal: { photo: true, sections: ['experience', 'skills', 'summary', 'education', 'certifications', 'keywords'] },
  bronze: { photo: true, sections: ['summary', 'education', 'experience', 'certifications', 'skills', 'keywords'] },
  slate: { photo: true, sections: ['experience', 'summary', 'skills', 'education', 'certifications', 'keywords'] },
  minimal: { sections: ['summary', 'experience', 'skills', 'education', 'certifications', 'keywords'] },
  executive: { sections: ['summary', 'experience', 'education', 'certifications', 'skills', 'keywords'] },
  crimson: { sections: ['summary', 'experience', 'education', 'skills', 'certifications', 'keywords'] },
  mono: { sections: ['summary', 'experience', 'education', 'certifications', 'skills', 'keywords'] },
  'timeline-navy': { photo: true, sections: ['summary', 'experience', 'education', 'certifications', 'skills', 'keywords'] },
  'timeline-plum': { photo: true, sections: ['summary', 'experience', 'education', 'certifications', 'skills', 'keywords'] },
  'studio-charcoal': { sections: ['summary', 'experience', 'education', 'skills', 'certifications', 'keywords'] },
  'studio-sage': { sections: ['summary', 'experience', 'education', 'skills', 'certifications', 'keywords'] },
  'gold-navy': { photo: true, sections: ['summary', 'skills', 'experience', 'education', 'certifications', 'keywords'] },
  'gold-burgundy': { photo: true, sections: ['summary', 'skills', 'experience', 'education', 'certifications', 'keywords'] },
  'classic-rule': { sections: ['summary', 'experience', 'education', 'skills', 'certifications', 'keywords'] },
  'classic-navy': { sections: ['summary', 'experience', 'education', 'skills', 'certifications', 'keywords'] }
};

// The manual adjustments a candidate makes on the Résumé style panel, saved on the
// application. Mirrored in the app (src/lib/resumeLayout.js) so the preview and both
// exports follow the same choices.
export interface ResumeLayout {
  placement: 'style' | 'left' | 'center';
  hidden_sections: string[];
  photo: 'style' | 'on' | 'off';
  // The section order dragged on the style panel. Empty means the style's own order.
  order: string[];
}

const ALL_SECTIONS = ['summary', 'skills', 'experience', 'education', 'certifications', 'keywords'];

export function sanitizeResumeLayout(value: unknown): ResumeLayout {
  const raw: any = value && typeof value === 'object' ? value : {};
  const placement: ResumeLayout['placement'] =
    raw.placement === 'left' || raw.placement === 'center' ? raw.placement : 'style';
  const photo: ResumeLayout['photo'] = raw.photo === 'on' || raw.photo === 'off' ? raw.photo : 'style';
  const hidden = Array.isArray(raw.hidden_sections)
    ? raw.hidden_sections.filter((id: unknown) => typeof id === 'string' && ALL_SECTIONS.includes(id as string))
    : [];
  const order = Array.isArray(raw.order)
    ? Array.from(new Set(raw.order.filter((id: unknown) => typeof id === 'string' && ALL_SECTIONS.includes(id as string))))
    : [];
  return { placement, hidden_sections: hidden, photo, order };
}

// Where the identity block and the section headings sit, when the candidate has moved them.
export function applyLayoutToTheme(theme: DocxTheme, layout?: ResumeLayout): DocxTheme {
  if (!layout || layout.placement === 'style') return theme;
  const align: 'left' | 'center' = layout.placement === 'center' ? 'center' : 'left';
  return { ...theme, nameAlign: align, headlineAlign: align, contactAlign: align, sectionAlign: align };
}

export function resolveDocxConfig(id?: string, layout?: ResumeLayout): DocxConfig {
  const override = id ? CONFIGS[id] : undefined;
  const base = override ? { ...BASE_CONFIG, ...override } : BASE_CONFIG;
  if (!layout) return base;
  // The order dragged on the style panel first, then anything the style shows that the
  // dragged list does not mention, minus the sections switched off.
  const dragged = layout.order.filter((section) => base.sections.includes(section));
  const ordered = Array.from(new Set([...dragged, ...base.sections]));
  return {
    photo: layout.photo === 'on' ? true : layout.photo === 'off' ? false : base.photo,
    sections: ordered.filter((section) => !layout.hidden_sections.includes(section))
  };
}

// ---- Restyling one part of the résumé ----
//
// In the editable preview a candidate can click a part of the document — the name, the
// headline, the contact line, every section heading, the separation line, the skills list —
// and change how it prints. One setting covers every instance of that part, and the Word
// export, the PDF and the read-only preview all draw from it. Mirrored in the app
// (src/lib/resumeElementStyles.js).

export interface ResumeElementStyle {
  color?: string;
  font?: 'serif' | 'sans';
  case?: 'style' | 'upper';
  size?: 'style' | 'smaller' | 'larger';
  rule?: 'line' | 'solid' | 'bar' | 'none';
  display?: 'line' | 'lines' | 'columns';
}

export type ResumeStyleOverrides = Record<string, ResumeElementStyle>;

// The settings each part of the résumé accepts.
const ELEMENT_KEYS: Record<string, string[]> = {
  name: ['color', 'font', 'case', 'size'],
  headline: ['color', 'font', 'case', 'size'],
  contact: ['color', 'font', 'size'],
  heading: ['color', 'font', 'case', 'size'],
  rule: ['color', 'rule'],
  skills: ['color', 'font', 'size', 'display']
};

const CHOICES: Record<string, string[]> = {
  font: ['serif', 'sans'],
  case: ['style', 'upper'],
  size: ['style', 'smaller', 'larger'],
  rule: ['line', 'solid', 'bar', 'none'],
  display: ['line', 'lines', 'columns']
};

export function sanitizeResumeStyleOverrides(value: unknown): ResumeStyleOverrides {
  const raw: any = value && typeof value === 'object' ? value : {};
  const out: ResumeStyleOverrides = {};
  for (const [element, keys] of Object.entries(ELEMENT_KEYS)) {
    const entry = raw[element];
    if (!entry || typeof entry !== 'object') continue;
    const kept: ResumeElementStyle = {};
    for (const key of keys) {
      const choice = entry[key];
      if (choice === undefined || choice === null) continue;
      if (key === 'color') {
        if (/^#[0-9a-f]{6}$/i.test(String(choice))) kept.color = String(choice);
      } else if (CHOICES[key] && CHOICES[key].includes(String(choice))) {
        (kept as any)[key] = String(choice);
      }
    }
    if (Object.keys(kept).length) out[element] = kept;
  }
  return out;
}

const SIZE_FACTOR: Record<string, number> = { smaller: 0.88, larger: 1.18 };
const FONT_NAME: Record<string, string> = { serif: 'Georgia', sans: 'Calibri' };

function sized(value: unknown, choice?: string): number {
  const factor = choice ? SIZE_FACTOR[choice] : undefined;
  if (!factor || typeof value !== 'number' || value <= 0) return value as number;
  return Math.round(value * factor);
}

// The theme the exports draw with, once the restyled parts are applied on top of the style.
export function applyStyleOverrides(theme: DocxTheme, overrides?: ResumeStyleOverrides): DocxTheme {
  if (!overrides || !Object.keys(overrides).length) return theme;
  const next: DocxTheme = { ...theme };
  const hex = (value?: string) => (value ? value.replace('#', '').toUpperCase() : undefined);
  const family = (choice?: string) => (choice ? FONT_NAME[choice] : undefined);

  const name = overrides.name || {};
  if (hex(name.color)) {
    next.nameColor = hex(name.color) as string;
    // A style that prints its identity on a band draws the name in the band's own ink.
    if (next.identityFill) next.identityNameColor = hex(name.color) as string;
  }
  if (family(name.font)) next.nameFont = family(name.font) as string;
  if (name.case === 'upper') next.nameUpper = true;
  next.nameSize = sized(next.nameSize, name.size);

  const headline = overrides.headline || {};
  if (hex(headline.color)) {
    next.headlineColor = hex(headline.color) as string;
    if (next.identityFill) next.identityHeadlineColor = hex(headline.color) as string;
  }
  if (family(headline.font)) next.headlineFont = family(headline.font) as string;
  if (headline.case === 'upper') next.headlineUpper = true;
  next.headlineSize = sized(next.headlineSize, headline.size);

  const contact = overrides.contact || {};
  if (hex(contact.color)) {
    next.contactColor = hex(contact.color) as string;
    if (next.identityFill) next.identityContactColor = hex(contact.color) as string;
  }
  if (family(contact.font)) next.contactFont = family(contact.font) as string;
  next.contactSize = sized(next.contactSize, contact.size);

  const heading = overrides.heading || {};
  if (hex(heading.color)) next.sectionColor = hex(heading.color) as string;
  if (family(heading.font)) next.sectionFont = family(heading.font) as string;
  if (heading.case === 'upper') next.sectionUpper = true;
  next.sectionSize = sized(next.sectionSize, heading.size);

  // The separation line: the style's own line recoloured, replaced by a hairline, a solid
  // rule or a short bar, or dropped altogether.
  const rule = overrides.rule || {};
  const ruleInk = hex(rule.color);
  if (rule.rule === 'none') {
    next.sectionRule = null;
    next.sectionBar = null;
  } else if (rule.rule) {
    const ruleLine = ruleInk || next.sectionRule || next.sectionBar || '111827';
    if (rule.rule === 'bar') {
      next.sectionRule = null;
      next.sectionBar = ruleLine;
      next.sectionBarSize = 24;
    } else {
      next.sectionBar = null;
      next.sectionRule = ruleLine;
      next.sectionRuleSize = rule.rule === 'solid' ? 16 : 6;
    }
  } else if (ruleInk) {
    if (next.sectionRule) next.sectionRule = ruleInk;
    else if (next.sectionBar) next.sectionBar = ruleInk;
  }

  const skills = overrides.skills || {};
  if (hex(skills.color)) next.skillsColor = hex(skills.color) as string;
  if (family(skills.font)) next.skillsFont = family(skills.font) as string;
  next.skillsSize = sized(next.skillsSize, skills.size);
  if (skills.display) next.skillsLayout = skills.display;

  return next;
}