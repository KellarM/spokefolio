// Server-side PDF rendering for the résumé and cover letter.
//
// The browser's "Download PDF" button prints the on-screen document; that path needs a
// person at the keyboard. When Spokefolio emails a package to the account holder, the
// documents have to be produced here, with no browser. This module draws them with
// pdf-lib using the same résumé data shape and section order the Word export follows
// (shared/docx.ts, shared/resumeTemplates.ts), so the PDF carries the same content in
// the same sequence the user saw. Decorative treatments (bands, portraits) are not
// reproduced: the emailed PDF is a clean, ATS-safe reading copy.

import { PDFDocument, StandardFonts, rgb } from 'npm:pdf-lib@1.17.1';
import { resolveDocxConfig } from './resumeTemplates.ts';

const PAGE = { width: 612, height: 792 }; // US Letter, points
const MARGIN = { top: 54, right: 54, bottom: 54, left: 54 };
const INK = rgb(0.12, 0.13, 0.16);
const MUTED = rgb(0.4, 0.42, 0.47);
const RULE = rgb(0.78, 0.8, 0.84);

const SECTION_LABELS: Record<string, string> = {
  summary: 'Professional summary',
  skills: 'Core skills',
  experience: 'Professional experience',
  education: 'Education',
  certifications: 'Certifications',
  keywords: 'Additional keywords'
};

// pdf-lib's standard fonts only cover WinAnsi; anything outside it would throw.
function safe(text: unknown): string {
  return String(text ?? '')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2013/g, '-')
    .replace(/\u2014/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/\u00A0/g, ' ')
    .replace(/[^\x20-\x7E\u00A1-\u00FF\u2022]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

class Writer {
  doc: PDFDocument;
  page: any;
  y: number;
  fonts: { regular: any; bold: any; italic: any };

  constructor(doc: PDFDocument, fonts: { regular: any; bold: any; italic: any }) {
    this.doc = doc;
    this.fonts = fonts;
    this.page = doc.addPage([PAGE.width, PAGE.height]);
    this.y = PAGE.height - MARGIN.top;
  }

  get maxWidth() {
    return PAGE.width - MARGIN.left - MARGIN.right;
  }

  ensure(height: number) {
    if (this.y - height < MARGIN.bottom) {
      this.page = this.doc.addPage([PAGE.width, PAGE.height]);
      this.y = PAGE.height - MARGIN.top;
    }
  }

  wrap(text: string, font: any, size: number, width: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let line = '';
    for (const word of words) {
      const candidate = line ? line + ' ' + word : word;
      if (font.widthOfTextAtSize(candidate, size) <= width) {
        line = candidate;
      } else {
        if (line) lines.push(line);
        // A single word wider than the column is broken by character.
        if (font.widthOfTextAtSize(word, size) > width) {
          let chunk = '';
          for (const ch of word) {
            if (font.widthOfTextAtSize(chunk + ch, size) <= width) chunk += ch;
            else {
              lines.push(chunk);
              chunk = ch;
            }
          }
          line = chunk;
        } else {
          line = word;
        }
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  text(
    raw: unknown,
    opts: { font?: any; size?: number; color?: any; align?: 'left' | 'center'; after?: number; indent?: number; lineGap?: number } = {}
  ) {
    const value = safe(raw);
    if (!value) return;
    const font = opts.font || this.fonts.regular;
    const size = opts.size || 10.5;
    const color = opts.color || INK;
    const indent = opts.indent || 0;
    const lineHeight = size * (opts.lineGap || 1.35);
    const lines = this.wrap(value, font, size, this.maxWidth - indent);
    for (const line of lines) {
      this.ensure(lineHeight);
      const width = font.widthOfTextAtSize(line, size);
      const x = opts.align === 'center' ? (PAGE.width - width) / 2 : MARGIN.left + indent;
      this.page.drawText(line, { x, y: this.y - size, size, font, color });
      this.y -= lineHeight;
    }
    this.y -= opts.after ?? 4;
  }

  bullet(raw: unknown, size = 10.5) {
    const value = safe(raw);
    if (!value) return;
    const font = this.fonts.regular;
    const indent = 14;
    const lineHeight = size * 1.35;
    const lines = this.wrap(value, font, size, this.maxWidth - indent);
    lines.forEach((line, index) => {
      this.ensure(lineHeight);
      if (index === 0) {
        this.page.drawText('\u2022', { x: MARGIN.left + 3, y: this.y - size, size, font, color: INK });
      }
      this.page.drawText(line, { x: MARGIN.left + indent, y: this.y - size, size, font, color: INK });
      this.y -= lineHeight;
    });
    this.y -= 2;
  }

  section(label: string) {
    this.ensure(30);
    this.y -= 8;
    this.text(label.toUpperCase(), { font: this.fonts.bold, size: 9.5, color: MUTED, after: 2 });
    this.page.drawLine({
      start: { x: MARGIN.left, y: this.y },
      end: { x: PAGE.width - MARGIN.right, y: this.y },
      thickness: 0.6,
      color: RULE
    });
    this.y -= 8;
  }

  space(points: number) {
    this.y -= points;
  }
}

async function open() {
  const doc = await PDFDocument.create();
  const fonts = {
    regular: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
    italic: await doc.embedFont(StandardFonts.HelveticaOblique)
  };
  return { doc, writer: new Writer(doc, fonts) };
}

function identity(w: Writer, profile: any, headline?: string | null) {
  w.text(profile?.full_name || 'Your Name', { font: w.fonts.bold, size: 20, after: 2 });
  if (headline) w.text(headline, { font: w.fonts.bold, size: 11.5, color: MUTED, after: 4 });
  const contact = [profile?.email, profile?.phone, profile?.location, profile?.linkedin, profile?.website].filter(Boolean).join('   |   ');
  if (contact) w.text(contact, { size: 9.5, color: MUTED, after: 6 });
}

function cleanFilename(parts: unknown[], fallback: string) {
  const name = parts
    .map((p) => safe(p))
    .filter(Boolean)
    .join(' - ')
    .replace(/[\\/:*?"<>|]+/g, '')
    .trim();
  return (name || fallback) + '.pdf';
}

export async function buildResumePdf({ profile, resume, template }: { profile: any; resume: any; template?: string }) {
  const { doc, writer: w } = await open();
  const config = resolveDocxConfig(template);
  const data = resume || {};

  identity(w, profile, data.headline);

  const blocks: Record<string, () => void> = {
    summary: () => {
      if (data.summary) w.text(data.summary, { after: 4 });
    },
    skills: () => {
      const skills = (Array.isArray(data.skills) ? data.skills : []).filter(Boolean);
      if (skills.length) w.text(skills.join('   \u00B7   '), { after: 4 });
    },
    experience: () => {
      const roles = (Array.isArray(data.experience) ? data.experience : []).filter(
        (role: any) => role && (role.title || role.organization || (Array.isArray(role.bullets) && role.bullets.length))
      );
      for (const role of roles) {
        w.ensure(40);
        w.space(4);
        w.text([role.title, role.organization].filter(Boolean).join(', '), { font: w.fonts.bold, size: 11, after: 1 });
        const details = [role.dates, role.location].filter(Boolean).join('   \u2022   ');
        if (details) w.text(details, { font: w.fonts.italic, size: 9.5, color: MUTED, after: 3 });
        for (const item of Array.isArray(role.bullets) ? role.bullets : []) w.bullet(item);
      }
    },
    education: () => {
      const items = (Array.isArray(data.education) ? data.education : []).filter(
        (item: any) => item && (item.degree || item.institution || item.detail)
      );
      for (const item of items) {
        w.ensure(30);
        w.space(2);
        const line = [item.degree, item.institution].filter(Boolean).join(', ') + (item.dates ? '    ' + item.dates : '');
        w.text(line, { font: w.fonts.bold, size: 10.5, after: 1 });
        if (item.detail) w.text(item.detail, { size: 9.5, color: MUTED, after: 3 });
      }
    },
    certifications: () => {
      for (const item of Array.isArray(data.certifications) ? data.certifications.filter(Boolean) : []) w.bullet(item);
    },
    keywords: () => {
      const keywords = Array.isArray(data.keywords) ? data.keywords.filter(Boolean) : [];
      if (keywords.length) w.text(keywords.join('   \u00B7   '), { size: 9.5, color: MUTED, after: 4 });
    }
  };

  const has: Record<string, boolean> = {
    summary: Boolean(data.summary),
    skills: Array.isArray(data.skills) && data.skills.filter(Boolean).length > 0,
    experience: Array.isArray(data.experience) && data.experience.length > 0,
    education: Array.isArray(data.education) && data.education.length > 0,
    certifications: Array.isArray(data.certifications) && data.certifications.filter(Boolean).length > 0,
    keywords: Array.isArray(data.keywords) && data.keywords.filter(Boolean).length > 0
  };

  for (const id of config.sections) {
    if (!has[id] || !blocks[id]) continue;
    w.section(SECTION_LABELS[id] || id);
    blocks[id]();
  }

  const bytes = await doc.save();
  return { bytes, filename: cleanFilename([profile?.full_name, 'Resume'], 'Resume'), pages: doc.getPageCount() };
}

export async function buildCoverLetterPdf({
  profile,
  cover_letter,
  recipient
}: {
  profile: any;
  cover_letter: string;
  recipient?: { company?: string; job_title?: string };
}) {
  const { doc, writer: w } = await open();
  identity(w, profile, null);
  w.space(10);

  const today = new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' });
  w.text(today, { size: 10, color: MUTED, after: 12 });

  if (recipient?.company) w.text(recipient.company, { font: w.fonts.bold, size: 11, after: 1 });
  if (recipient?.job_title) w.text('Re: ' + recipient.job_title, { font: w.fonts.italic, size: 10, color: MUTED, after: 14 });

  const paragraphs = String(cover_letter || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  for (const paragraph of paragraphs) w.text(paragraph, { size: 10.5, after: 9, lineGap: 1.45 });

  const bytes = await doc.save();
  return {
    bytes,
    filename: cleanFilename([profile?.full_name, recipient?.company, 'Cover Letter'], 'Cover Letter'),
    pages: doc.getPageCount()
  };
}
