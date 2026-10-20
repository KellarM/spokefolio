// The résumé styles a person can choose from.
//
// Each entry carries the palette and typography used by the on-screen résumé preview,
// plus a configuration: whether the style sets a portrait beside the name and the order
// its sections appear in. The Word export mirrors both one-for-one
// (base44/shared/resumeTemplates.ts), so what is on screen is what comes out of Word.
//
// The id is stored on the profile (the default style) and on each application (an override).

export const DEFAULT_TEMPLATE_ID = 'editorial';

// What a template is for. Every style carries a track:
//   ats     — single-column layouts that parse cleanly in employer portals and screening
//             software. Safe to submit anywhere.
//   designed — two-column layouts with visual impact, for résumés a person reads
//             directly (email to a hiring manager, networking, career fairs, portfolio
//             links). Not for automated portals.
// The picker groups and labels styles by track, so no one sends a Designed résumé
// into a machine by accident.
export const TEMPLATE_TRACKS = {
  ats: {
    label: 'ATS-safe',
    hint: 'For portals and screening software',
    blurb: 'Single-column layouts that parse cleanly in employer portals (Workday, Greenhouse, Taleo) and screening software. Safe to submit anywhere.'
  },
  designed: {
    label: 'Designed',
    hint: 'For direct contact',
    blurb: 'Two-column layouts with visual impact, for résumés a person reads directly — email to a hiring manager, networking, career fairs, portfolio links. Not for automated portals.'
  }
};

export const RESUME_SECTIONS = {
  summary: 'Professional summary',
  skills: 'Core skills',
  experience: 'Professional experience',
  education: 'Education',
  certifications: 'Certifications',
  keywords: 'Keywords for screening software'
};

export const RESUME_TEMPLATES = [
  {
    id: 'editorial',
    track: 'ats',
    name: 'Editorial Navy',
    blurb: 'Serif name, brass rule, navy section headings',
    config: { photo: false, sections: ['summary', 'skills', 'experience', 'education', 'certifications', 'keywords'] },
    mini: { sheet: 'bg-[#FDFCFA]', ink: 'bg-[#1B4159]', accent: 'bg-[#B0854A]', rule: 'bg-[#B0854A]', line: 'bg-[#D8D4CE]' },
    preview: {
      sheet: 'bg-[#FDFCFA]',
      header: 'border-l-[5px] border-l-[#B0854A] pl-4 sm:pl-5',
      name: 'font-heading text-[30px] leading-tight tracking-tight text-[#1B4159] sm:text-[38px]',
      headline: 'quiet-field text-[12px] font-semibold uppercase tracking-[0.18em] text-[#B0854A]',
      contact: 'mt-2 text-[13px] text-[#5B6472]',
      sectionRow: 'border-b border-b-[#B0854A]/60 pb-2',
      sectionTitle: 'text-[11px] font-semibold uppercase tracking-[0.22em] text-[#1B4159]',
      roleTitle: 'quiet-field font-heading text-[16px] text-[#1B4159]',
      roleMeta: 'quiet-field text-[12.5px] italic text-[#B0854A]',
      body: 'text-[15px] leading-relaxed text-[#1F2937]'
    }
  },
  {
    id: 'ats',
    track: 'ats',
    name: 'Plain ATS',
    blurb: 'Times New Roman, centred, no colour or decoration',
    config: { photo: false, sections: ['summary', 'skills', 'experience', 'education', 'certifications', 'keywords'] },
    mini: { sheet: 'bg-[#FFFFFF]', ink: 'bg-[#000000]', accent: 'bg-[#000000]', rule: 'bg-[#000000]', line: 'bg-[#D4D4D4]' },
    preview: {
      sheet: 'bg-[#FFFFFF]',
      header: 'text-center border-b border-[#000000]/60 pb-3',
      name: "font-['Times_New_Roman',serif] text-[30px] leading-tight text-[#000000]",
      headline: "quiet-field text-center text-[12.5px] uppercase tracking-[0.08em] text-[#000000]",
      contact: "mt-2 text-center text-[13px] text-[#404040]",
      sectionRow: 'border-b border-[#000000]/60 pb-1.5',
      sectionTitle: 'text-[12.5px] font-bold uppercase tracking-[0.08em] text-[#000000]',
      roleTitle: "quiet-field font-['Times_New_Roman',serif] text-[15px] font-semibold text-[#000000]",
      roleMeta: "quiet-field text-[13px] text-[#404040]",
      body: "font-['Times_New_Roman',serif] text-[14.5px] leading-relaxed text-[#000000]"
    }
  },
  {
    id: 'modern',
    track: 'ats',
    name: 'Modern Sans',
    blurb: 'Sans throughout, skills up front, indigo labels',
    config: { photo: true, sections: ['skills', 'summary', 'experience', 'education', 'certifications', 'keywords'] },
    mini: { sheet: 'bg-[#FFFFFF]', ink: 'bg-[#111827]', accent: 'bg-[#4F46E5]', rule: 'bg-[#E5E7EB]', line: 'bg-[#E5E7EB]' },
    preview: {
      sheet: 'bg-[#FFFFFF]',
      header: 'border-b border-[#E5E7EB] pb-4',
      name: 'text-[30px] font-semibold tracking-tight text-[#111827] sm:text-[36px]',
      headline: 'quiet-field text-[12px] font-semibold uppercase tracking-[0.2em] text-[#4F46E5]',
      contact: 'mt-2 text-[12.5px] text-[#6B7280]',
      sectionRow: 'pb-2 border-b border-[#F3F4F6]',
      sectionTitle: 'text-[11.5px] font-semibold uppercase tracking-[0.18em] text-[#4F46E5]',
      roleTitle: 'quiet-field text-[15.5px] font-semibold text-[#111827]',
      roleMeta: 'quiet-field text-[12.5px] text-[#6B7280]',
      body: 'text-[14.5px] leading-relaxed text-[#374151]'
    }
  },
  {
    id: 'minimal',
    track: 'ats',
    name: 'Quiet Minimal',
    blurb: 'Airy spacing, experience first, no rules',
    config: { photo: false, sections: ['summary', 'experience', 'skills', 'education', 'certifications', 'keywords'] },
    mini: { sheet: 'bg-[#FFFFFF]', ink: 'bg-[#1F2937]', accent: 'bg-[#9CA3AF]', rule: 'bg-[#F3F4F6]', line: 'bg-[#EDEDED]' },
    preview: {
      sheet: 'bg-[#FFFFFF]',
      header: 'pb-2',
      name: 'text-[26px] font-light tracking-[0.02em] text-[#1F2937] sm:text-[32px]',
      headline: 'quiet-field text-[11.5px] uppercase tracking-[0.3em] text-[#9CA3AF]',
      contact: 'mt-2 text-[12.5px] text-[#9CA3AF]',
      sectionRow: 'pb-2',
      sectionTitle: 'text-[10.5px] font-medium uppercase tracking-[0.34em] text-[#9CA3AF]',
      roleTitle: 'quiet-field text-[15px] text-[#1F2937]',
      roleMeta: 'quiet-field text-[12px] text-[#9CA3AF]',
      body: 'text-[14.5px] leading-[1.85] text-[#4B5563]'
    }
  },
  {
    id: 'executive',
    track: 'ats',
    name: 'Executive Serif',
    blurb: 'Centred Georgia letterhead, credentials before skills',
    config: { photo: false, sections: ['summary', 'experience', 'education', 'certifications', 'skills', 'keywords'] },
    mini: { sheet: 'bg-[#FFFDF9]', ink: 'bg-[#1F2937]', accent: 'bg-[#1F2937]', rule: 'bg-[#C7C2B8]', line: 'bg-[#E3DFD6]' },
    preview: {
      sheet: 'bg-[#FFFDF9]',
      header: 'text-center border-b border-[#1F2937]/25 pb-4',
      name: 'font-heading text-[30px] tracking-wide text-[#1F2937] sm:text-[36px]',
      headline: 'quiet-field text-center text-[12px] uppercase tracking-[0.24em] text-[#4B5563]',
      contact: 'mt-2 text-center text-[12.5px] text-[#4B5563]',
      sectionRow: 'border-b border-[#1F2937]/25 pb-1.5',
      sectionTitle: 'font-heading text-[11.5px] uppercase tracking-[0.2em] text-[#1F2937]',
      roleTitle: 'quiet-field font-heading text-[15.5px] font-semibold text-[#1F2937]',
      roleMeta: 'quiet-field text-[12.5px] italic text-[#4B5563]',
      body: 'font-heading text-[14.5px] leading-relaxed text-[#1F2937]'
    }
  },
  {
    id: 'emerald',
    track: 'ats',
    name: 'Emerald Boardroom',
    blurb: 'Skills-led green layout with an accent bar',
    config: { photo: true, sections: ['skills', 'summary', 'experience', 'certifications', 'education', 'keywords'] },
    mini: { sheet: 'bg-[#FFFFFF]', ink: 'bg-[#0F3D2E]', accent: 'bg-[#0F6B4F]', rule: 'bg-[#CFE4DA]', line: 'bg-[#E3E8E5]' },
    preview: {
      sheet: 'bg-[#FFFFFF]',
      header: 'border-l-[5px] border-l-[#0F6B4F] pl-4 sm:pl-5',
      name: 'font-heading text-[29px] leading-tight text-[#0F3D2E] sm:text-[35px]',
      headline: 'quiet-field text-[12px] font-semibold uppercase tracking-[0.16em] text-[#0F6B4F]',
      contact: 'mt-2 text-[12.5px] text-[#5B6472]',
      sectionRow: 'border-l-[3px] border-l-[#0F6B4F] pl-2.5 pb-1.5',
      sectionTitle: 'text-[11.5px] font-semibold uppercase tracking-[0.16em] text-[#0F3D2E]',
      roleTitle: 'quiet-field text-[15.5px] font-semibold text-[#0F3D2E]',
      roleMeta: 'quiet-field text-[12.5px] text-[#0F6B4F]',
      body: 'text-[14.5px] leading-relaxed text-[#374151]'
    }
  },
  {
    id: 'crimson',
    track: 'ats',
    name: 'Crimson Classic',
    blurb: 'Deep red headings, credentials before skills',
    config: { photo: false, sections: ['summary', 'experience', 'education', 'skills', 'certifications', 'keywords'] },
    mini: { sheet: 'bg-[#FFFCFA]', ink: 'bg-[#7F1D1D]', accent: 'bg-[#7F1D1D]', rule: 'bg-[#E7CFCF]', line: 'bg-[#EDE2E2]' },
    preview: {
      sheet: 'bg-[#FFFCFA]',
      header: 'border-b border-[#7F1D1D]/40 pb-3',
      name: 'font-heading text-[30px] leading-tight text-[#7F1D1D] sm:text-[36px]',
      headline: 'quiet-field text-[12px] uppercase tracking-[0.2em] text-[#7F1D1D]',
      contact: 'mt-2 text-[12.5px] text-[#4B5563]',
      sectionRow: 'border-b border-[#7F1D1D]/50 pb-1.5',
      sectionTitle: 'font-heading text-[11.5px] font-semibold uppercase tracking-[0.18em] text-[#7F1D1D]',
      roleTitle: 'quiet-field font-heading text-[15.5px] font-semibold text-[#1F2937]',
      roleMeta: 'quiet-field text-[12.5px] italic text-[#7F1D1D]',
      body: 'text-[14.5px] leading-relaxed text-[#1F2937]'
    }
  },
  {
    id: 'graphite',
    track: 'ats',
    name: 'Graphite Bold',
    blurb: 'Black section bands, certificate-led, tight rhythm',
    config: { photo: true, sections: ['summary', 'skills', 'experience', 'certifications', 'education', 'keywords'] },
    mini: { sheet: 'bg-[#FFFFFF]', ink: 'bg-[#111827]', accent: 'bg-[#111827]', rule: 'bg-[#111827]', line: 'bg-[#E5E7EB]' },
    preview: {
      sheet: 'bg-[#FFFFFF]',
      header: 'border-b-[3px] border-b-[#111827] pb-3',
      name: 'text-[30px] font-bold uppercase tracking-[0.06em] text-[#111827] sm:text-[34px]',
      headline: 'quiet-field text-[11.5px] font-semibold uppercase tracking-[0.24em] text-[#374151]',
      contact: 'mt-2 text-[12.5px] text-[#6B7280]',
      sectionRow: 'bg-[#111827] px-3 py-1.5',
      sectionTitle: 'text-[10.5px] font-bold uppercase tracking-[0.22em] text-white',
      roleTitle: 'quiet-field text-[15.5px] font-bold text-[#111827]',
      roleMeta: 'quiet-field text-[12.5px] text-[#6B7280]',
      body: 'text-[14.5px] leading-relaxed text-[#374151]'
    }
  },
  {
    id: 'teal',
    track: 'ats',
    name: 'Teal Compact',
    blurb: 'Experience-led dense layout with teal accents',
    config: { photo: true, sections: ['experience', 'skills', 'summary', 'education', 'certifications', 'keywords'] },
    mini: { sheet: 'bg-[#FCFEFE]', ink: 'bg-[#0F172A]', accent: 'bg-[#0F766E]', rule: 'bg-[#99F6E4]', line: 'bg-[#E2E8F0]' },
    preview: {
      sheet: 'bg-[#FCFEFE]',
      header: 'border-b border-[#99F6E4] pb-2.5',
      name: 'text-[27px] font-semibold tracking-tight text-[#0F172A] sm:text-[32px]',
      headline: 'quiet-field text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0F766E]',
      contact: 'mt-1.5 text-[12px] text-[#64748B]',
      sectionRow: 'border-b border-[#99F6E4] pb-1',
      sectionTitle: 'text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[#0F766E]',
      roleTitle: 'quiet-field text-[14.5px] font-semibold text-[#0F172A]',
      roleMeta: 'quiet-field text-[12px] text-[#0F766E]',
      body: 'text-[13.5px] leading-[1.6] text-[#334155]'
    }
  },
  {
    id: 'bronze',
    track: 'ats',
    name: 'Bronze Heritage',
    blurb: 'Letterspaced serif name, education elevated',
    config: { photo: true, sections: ['summary', 'education', 'experience', 'certifications', 'skills', 'keywords'] },
    mini: { sheet: 'bg-[#FFFDF7]', ink: 'bg-[#4A3524]', accent: 'bg-[#B0854A]', rule: 'bg-[#D6C7A9]', line: 'bg-[#E8E2D5]' },
    preview: {
      sheet: 'bg-[#FFFDF7]',
      header: 'border-b border-[#D6C7A9] pb-3',
      name: 'font-heading text-[30px] tracking-[0.12em] text-[#4A3524] sm:text-[35px]',
      headline: 'quiet-field text-[11.5px] uppercase tracking-[0.28em] text-[#B0854A]',
      contact: 'mt-2 text-[12.5px] text-[#6B7280]',
      sectionRow: 'border-b border-[#D6C7A9] pb-1.5',
      sectionTitle: 'font-heading text-[11.5px] uppercase tracking-[0.24em] text-[#4A3524]',
      roleTitle: 'quiet-field font-heading text-[15.5px] text-[#4A3524]',
      roleMeta: 'quiet-field text-[12.5px] italic text-[#B0854A]',
      body: 'text-[14.5px] leading-relaxed text-[#3F3A33]'
    }
  },
  {
    id: 'slate',
    track: 'ats',
    name: 'Slate Split',
    blurb: 'Experience first, slate rules, navy headings',
    config: { photo: true, sections: ['experience', 'summary', 'skills', 'education', 'certifications', 'keywords'] },
    mini: { sheet: 'bg-[#FFFFFF]', ink: 'bg-[#0F172A]', accent: 'bg-[#334155]', rule: 'bg-[#0F172A]', line: 'bg-[#E2E8F0]' },
    preview: {
      sheet: 'bg-[#FFFFFF]',
      header: 'border-b-2 border-b-[#0F172A] pb-3',
      name: 'text-[29px] font-semibold tracking-tight text-[#0F172A] sm:text-[34px]',
      headline: 'quiet-field text-[11.5px] font-semibold uppercase tracking-[0.16em] text-[#475569]',
      contact: 'mt-2 text-[12.5px] text-[#334155]',
      sectionRow: 'border-b border-[#CBD5E1] pb-1.5',
      sectionTitle: 'text-[11px] font-semibold uppercase tracking-[0.2em] text-[#0F172A]',
      roleTitle: 'quiet-field text-[15.5px] font-semibold text-[#0F172A]',
      roleMeta: 'quiet-field text-[12.5px] text-[#64748B]',
      body: 'text-[14.5px] leading-relaxed text-[#334155]'
    }
  },
  {
    id: 'mono',
    track: 'ats',
    name: 'Monochrome',
    blurb: 'Black and grey only, credentials before skills',
    config: { photo: false, sections: ['summary', 'experience', 'education', 'certifications', 'skills', 'keywords'] },
    mini: { sheet: 'bg-[#FFFFFF]', ink: 'bg-[#000000]', accent: 'bg-[#000000]', rule: 'bg-[#9CA3AF]', line: 'bg-[#E5E7EB]' },
    preview: {
      sheet: 'bg-[#FFFFFF]',
      header: 'border-b border-black pb-3',
      name: 'text-center text-[27px] font-semibold uppercase tracking-[0.26em] text-black sm:text-[31px]',
      headline: 'quiet-field text-center text-[11px] uppercase tracking-[0.3em] text-[#4B5563]',
      contact: 'mt-2 text-center text-[12.5px] text-[#4B5563]',
      sectionRow: 'border-b border-[#9CA3AF] pb-1.5',
      sectionTitle: 'text-[11px] font-semibold uppercase tracking-[0.26em] text-black',
      roleTitle: 'quiet-field text-[15px] font-semibold text-black',
      roleMeta: 'quiet-field text-[12.5px] text-[#4B5563]',
      body: 'text-[14px] leading-relaxed text-[#1F2937]'
    }
  },
  // Variations inspired by four reference layouts: timeline, studio, gold-and-navy, classic rule.
  {
    id: 'timeline-navy',
    track: 'ats',
    name: 'Timeline Navy',
    blurb: 'Wide navy headings, slate rule, portrait beside name',
    config: { photo: true, sections: ['summary', 'experience', 'education', 'certifications', 'skills', 'keywords'] },
    mini: { sheet: 'bg-[#FFFFFF]', ink: 'bg-[#2F3A4F]', accent: 'bg-[#2F3A4F]', rule: 'bg-[#8A97B1]', line: 'bg-[#E2E5EC]' },
    preview: {
      sheet: 'bg-[#FFFFFF]',
      header: 'bg-[#2F3A4F] -mx-6 -mt-8 mb-2 px-6 py-6 sm:-mx-12 sm:-mt-14 sm:px-12 sm:py-8',
      name: 'text-[28px] font-bold uppercase tracking-[0.1em] text-white sm:text-[34px]',
      headline: 'quiet-field text-[13px] uppercase tracking-[0.1em] text-[#C9D1E0]',
      contact: 'mt-2 text-[12.5px] text-[#C9D1E0]',
      sectionRow: 'border-b-2 border-b-[#8A97B1] pb-1.5',
      sectionTitle: 'text-[12.5px] font-bold uppercase tracking-[0.2em] text-[#2F3A4F]',
      roleTitle: 'quiet-field text-[15px] font-bold uppercase text-[#2F3A4F]',
      roleMeta: 'quiet-field text-[12.5px] text-[#5B6472]',
      body: 'text-[14px] leading-relaxed text-[#374151]'
    }
  },
  {
    id: 'timeline-plum',
    track: 'ats',
    name: 'Timeline Plum',
    blurb: 'Same timeline look in deep plum',
    config: { photo: true, sections: ['summary', 'experience', 'education', 'certifications', 'skills', 'keywords'] },
    mini: { sheet: 'bg-[#FFFFFF]', ink: 'bg-[#4A2545]', accent: 'bg-[#4A2545]', rule: 'bg-[#B58BB0]', line: 'bg-[#EBE0EA]' },
    preview: {
      sheet: 'bg-[#FFFFFF]',
      header: 'bg-[#4A2545] -mx-6 -mt-8 mb-2 px-6 py-6 sm:-mx-12 sm:-mt-14 sm:px-12 sm:py-8',
      name: 'text-[28px] font-bold uppercase tracking-[0.1em] text-white sm:text-[34px]',
      headline: 'quiet-field text-[13px] uppercase tracking-[0.1em] text-[#E3CDE0]',
      contact: 'mt-2 text-[12.5px] text-[#E3CDE0]',
      sectionRow: 'border-b-2 border-b-[#B58BB0] pb-1.5',
      sectionTitle: 'text-[12.5px] font-bold uppercase tracking-[0.2em] text-[#4A2545]',
      roleTitle: 'quiet-field text-[15px] font-bold uppercase text-[#4A2545]',
      roleMeta: 'quiet-field text-[12.5px] text-[#5B6472]',
      body: 'text-[14px] leading-relaxed text-[#374151]'
    }
  },
  {
    id: 'studio-charcoal',
    track: 'ats',
    name: 'Studio Charcoal',
    blurb: 'Soft grey sheet, spaced caps, heavy black rules',
    config: { photo: false, sections: ['summary', 'experience', 'education', 'skills', 'certifications', 'keywords'] },
    mini: { sheet: 'bg-[#EEEEF0]', ink: 'bg-[#1A1A1A]', accent: 'bg-[#1A1A1A]', rule: 'bg-[#1A1A1A]', line: 'bg-[#CFCFD3]' },
    preview: {
      sheet: 'bg-[#EEEEF0]',
      header: 'pb-4',
      name: 'text-[28px] font-medium uppercase tracking-[0.28em] text-[#1A1A1A] sm:text-[34px]',
      headline: 'quiet-field text-[12px] uppercase tracking-[0.3em] text-[#8A8A90]',
      contact: 'mt-2 text-[12.5px] text-[#6B6B72]',
      sectionRow: 'border-b-2 border-b-[#1A1A1A] pb-1.5',
      sectionTitle: 'text-[12px] font-bold uppercase tracking-[0.3em] text-[#1A1A1A]',
      roleTitle: 'quiet-field text-[14.5px] font-semibold text-[#1A1A1A]',
      roleMeta: 'quiet-field text-[12.5px] text-[#6B6B72]',
      body: 'text-[14px] leading-relaxed text-[#4B4B52]'
    }
  },
  {
    id: 'studio-sage',
    track: 'ats',
    name: 'Studio Sage',
    blurb: 'Studio layout on a warm sage sheet',
    config: { photo: false, sections: ['summary', 'experience', 'education', 'skills', 'certifications', 'keywords'] },
    mini: { sheet: 'bg-[#EEF1EA]', ink: 'bg-[#2E3B2F]', accent: 'bg-[#2E3B2F]', rule: 'bg-[#2E3B2F]', line: 'bg-[#D3D9CC]' },
    preview: {
      sheet: 'bg-[#EEF1EA]',
      header: 'pb-4',
      name: 'text-[28px] font-medium uppercase tracking-[0.28em] text-[#2E3B2F] sm:text-[34px]',
      headline: 'quiet-field text-[12px] uppercase tracking-[0.3em] text-[#7C8A7D]',
      contact: 'mt-2 text-[12.5px] text-[#66726A]',
      sectionRow: 'border-b-2 border-b-[#2E3B2F] pb-1.5',
      sectionTitle: 'text-[12px] font-bold uppercase tracking-[0.3em] text-[#2E3B2F]',
      roleTitle: 'quiet-field text-[14.5px] font-semibold text-[#2E3B2F]',
      roleMeta: 'quiet-field text-[12.5px] text-[#66726A]',
      body: 'text-[14px] leading-relaxed text-[#46504A]'
    }
  },
  {
    id: 'gold-navy',
    track: 'ats',
    name: 'Gold & Navy',
    blurb: 'Bold serif name, gold accent bars, skills up front',
    config: { photo: true, sections: ['summary', 'skills', 'experience', 'education', 'certifications', 'keywords'] },
    mini: { sheet: 'bg-[#F1F2F4]', ink: 'bg-[#1E2A44]', accent: 'bg-[#C09A4E]', rule: 'bg-[#C09A4E]', line: 'bg-[#D9DCE2]' },
    preview: {
      sheet: 'bg-[#F1F2F4]',
      header: 'border-b-[3px] border-b-[#C09A4E] pb-4',
      name: 'font-heading text-[32px] font-semibold uppercase leading-tight text-[#1E2A44] sm:text-[42px]',
      headline: 'quiet-field text-[12px] uppercase tracking-[0.3em] text-[#5B6472]',
      contact: 'mt-2 text-[12.5px] text-[#5B6472]',
      sectionRow: 'border-l-[4px] border-l-[#C09A4E] pl-2.5 pb-1',
      sectionTitle: 'text-[12px] font-bold uppercase tracking-[0.28em] text-[#1E2A44]',
      roleTitle: 'quiet-field font-heading text-[16px] font-semibold text-[#1E2A44]',
      roleMeta: 'quiet-field text-[12px] font-semibold text-[#5B6472]',
      body: 'text-[14px] leading-relaxed text-[#4B5563]'
    }
  },
  {
    id: 'gold-burgundy',
    track: 'ats',
    name: 'Gold & Burgundy',
    blurb: 'Gold & Navy layout in burgundy',
    config: { photo: true, sections: ['summary', 'skills', 'experience', 'education', 'certifications', 'keywords'] },
    mini: { sheet: 'bg-[#F6F1F0]', ink: 'bg-[#5A1E2B]', accent: 'bg-[#C09A4E]', rule: 'bg-[#C09A4E]', line: 'bg-[#E4D8D8]' },
    preview: {
      sheet: 'bg-[#F6F1F0]',
      header: 'border-b-[3px] border-b-[#C09A4E] pb-4',
      name: 'font-heading text-[32px] font-semibold uppercase leading-tight text-[#5A1E2B] sm:text-[42px]',
      headline: 'quiet-field text-[12px] uppercase tracking-[0.3em] text-[#6B5A5C]',
      contact: 'mt-2 text-[12.5px] text-[#6B5A5C]',
      sectionRow: 'border-l-[4px] border-l-[#C09A4E] pl-2.5 pb-1',
      sectionTitle: 'text-[12px] font-bold uppercase tracking-[0.28em] text-[#5A1E2B]',
      roleTitle: 'quiet-field font-heading text-[16px] font-semibold text-[#5A1E2B]',
      roleMeta: 'quiet-field text-[12px] font-semibold text-[#6B5A5C]',
      body: 'text-[14px] leading-relaxed text-[#4B4446]'
    }
  },
  {
    id: 'classic-rule',
    track: 'ats',
    name: 'Classic Rule',
    blurb: 'Letterspaced serif name, thin rules between sections',
    config: { photo: false, sections: ['summary', 'experience', 'education', 'skills', 'certifications', 'keywords'] },
    mini: { sheet: 'bg-[#FAFAFA]', ink: 'bg-[#111111]', accent: 'bg-[#111111]', rule: 'bg-[#9A9A9A]', line: 'bg-[#DEDEDE]' },
    preview: {
      sheet: 'bg-[#FAFAFA]',
      header: 'pb-3',
      name: 'font-heading text-[28px] uppercase tracking-[0.2em] text-[#111111] sm:text-[34px]',
      headline: 'quiet-field font-heading text-[13px] font-semibold text-[#111111]',
      contact: 'mt-2 text-[12.5px] text-[#4B4B4B]',
      sectionRow: 'border-t border-t-[#9A9A9A] pt-3',
      sectionTitle: 'font-heading text-[12px] uppercase tracking-[0.3em] text-[#111111]',
      roleTitle: 'quiet-field font-heading text-[14.5px] font-bold text-[#111111]',
      roleMeta: 'quiet-field text-[12.5px] text-[#4B4B4B]',
      body: 'font-heading text-[13.5px] leading-relaxed text-[#1F1F1F]'
    }
  },
  {
    id: 'classic-navy',
    track: 'ats',
    name: 'Classic Navy',
    blurb: 'Classic Rule with navy ink and a blue rule',
    config: { photo: false, sections: ['summary', 'experience', 'education', 'skills', 'certifications', 'keywords'] },
    mini: { sheet: 'bg-[#FFFFFF]', ink: 'bg-[#1E3A5F]', accent: 'bg-[#1E3A5F]', rule: 'bg-[#9FB3CC]', line: 'bg-[#DDE4EE]' },
    preview: {
      sheet: 'bg-[#FFFFFF]',
      header: 'pb-3',
      name: 'font-heading text-[28px] uppercase tracking-[0.2em] text-[#1E3A5F] sm:text-[34px]',
      headline: 'quiet-field font-heading text-[13px] font-semibold text-[#1E3A5F]',
      contact: 'mt-2 text-[12.5px] text-[#4B5563]',
      sectionRow: 'border-t border-t-[#9FB3CC] pt-3',
      sectionTitle: 'font-heading text-[12px] uppercase tracking-[0.3em] text-[#1E3A5F]',
      roleTitle: 'quiet-field font-heading text-[14.5px] font-bold text-[#1E3A5F]',
      roleMeta: 'quiet-field text-[12.5px] text-[#4B5563]',
      body: 'font-heading text-[13.5px] leading-relaxed text-[#1F2937]'
    }
  }
];

export function getTemplate(id) {
  return RESUME_TEMPLATES.find((template) => template.id === id) || RESUME_TEMPLATES[0];
}

// An application's own choice wins over the profile default; anything unknown falls
// back to the original editorial style.
export function resolveTemplateId(applicationTemplate, profileTemplate) {
  const candidate = applicationTemplate || profileTemplate;
  return RESUME_TEMPLATES.some((template) => template.id === candidate) ? candidate : DEFAULT_TEMPLATE_ID;
}