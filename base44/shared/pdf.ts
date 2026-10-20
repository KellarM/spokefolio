// Server-side PDF rendering for the résumé and cover letter.
//
// The same document the Word export builds, drawn with pdf-lib: the chosen style's
// typography (base44/shared/resumeTemplates.ts), its section order, and the same two-page
// fit (base44/shared/resumeFit.ts), so the PDF a candidate downloads carries what the Word
// file carries. Only the standard PDF fonts are available, so a style's serif family draws
// as Times and its sans family as Helvetica; decorative treatments (bands behind the
// identity, portraits) are not reproduced. Text stays real and selectable, which keeps the
// file readable by applicant tracking systems.

import { PDFDocument, StandardFonts, rgb } from 'npm:pdf-lib@1.17.1';
import { applyLayoutToTheme, applyStyleOverrides, resolveDocxConfig, resolveDocxTheme } from './resumeTemplates.ts';
import { fitResumeToPages } from './resumeFit.ts';

const PAGE = { width: 612, height: 792 }; // US Letter, points
const INK = rgb(0.12, 0.13, 0.16);
const MUTED = rgb(0.4, 0.42, 0.47);

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

function ink(value: unknown, fallback = INK) {
  const hex = String(value ?? '').replace('#', '').trim();
  if (!/^[0-9a-f]{6}$/i.test(hex)) return fallback;
  return rgb(
    parseInt(hex.slice(0, 2), 16) / 255,
    parseInt(hex.slice(2, 4), 16) / 255,
    parseInt(hex.slice(4, 6), 16) / 255
  );
}

function isSerif(font: unknown) {
  return /georgia|times|serif|garamond|cambria|playfair|merriweather/i.test(String(font ?? ''));
}

// Theme sizes are half-points and spacing is in twentieths of a point (twips).
function halfPoints(value: unknown, fallback: number) {
  return typeof value === 'number' && value > 0 ? value / 2 : fallback;
}

function twips(value: unknown, fallback: number) {
  return typeof value === 'number' && value > 0 ? value / 20 : fallback;
}

interface FontSet {
  regular: any;
  bold: any;
  italic: any;
}

interface Margins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

interface TextOptions {
  font?: any;
  size?: number;
  color?: any;
  align?: 'left' | 'center' | 'right';
  indent?: number;
  after?: number;
  before?: number;
  lineGap?: number;
  upper?: boolean;
}

class Writer {
  doc: PDFDocument;
  page: any;
  y: number;
  fonts: FontSet;
  margin: Margins;

  constructor(doc: PDFDocument, fonts: FontSet, margin: Margins) {
    this.doc = doc;
    this.fonts = fonts;
    this.margin = margin;
    this.page = doc.addPage([PAGE.width, PAGE.height]);
    this.y = PAGE.height - margin.top;
  }

  get width() {
    return PAGE.width - this.margin.left - this.margin.right;
  }

  ensure(height: number) {
    if (this.y - height < this.margin.bottom) {
      this.page = this.doc.addPage([PAGE.width, PAGE.height]);
      this.y = PAGE.height - this.margin.top;
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

  text(raw: unknown, opts: TextOptions = {}) {
    const value = opts.upper ? safe(raw).toUpperCase() : safe(raw);
    if (!value) return;
    const font = opts.font || this.fonts.regular;
    const size = opts.size || 10.5;
    const color = opts.color || INK;
    const indent = opts.indent || 0;
    const lineHeight = size * (opts.lineGap || 1.35);
    if (opts.before) this.y -= opts.before;
    const lines = this.wrap(value, font, size, this.width - indent);
    for (const line of lines) {
      this.ensure(lineHeight);
      const textWidth = font.widthOfTextAtSize(line, size);
      const x = opts.align === 'center'
        ? (PAGE.width - textWidth) / 2
        : opts.align === 'right'
          ? PAGE.width - this.margin.right - textWidth
          : this.margin.left + indent;
      this.page.drawText(line, { x, y: this.y - size, size, font, color });
      this.y -= lineHeight;
    }
    this.y -= opts.after ?? 4;
  }

  // A full-width filled band; the caller writes the text inside it.
  band(color: any, height: number) {
    this.ensure(height);
    this.page.drawRectangle({
      x: 0,
      y: this.y - height,
      width: PAGE.width,
      height,
      color
    });
    this.y -= height;
  }

  rule(color: any, thickness: number, width?: number, align: 'left' | 'center' | 'right' = 'left') {
    const lineWidth = Math.min(width || this.width, this.width);
    const x = align === 'center'
      ? (PAGE.width - lineWidth) / 2
      : align === 'right'
        ? PAGE.width - this.margin.right - lineWidth
        : this.margin.left;
    this.page.drawLine({
      start: { x, y: this.y },
      end: { x: x + lineWidth, y: this.y },
      thickness,
      color
    });
    this.y -= thickness + 2;
  }

  bullet(raw: unknown, opts: TextOptions & { marker?: string; markerColor?: any } = {}) {
    const value = safe(raw);
    if (!value) return;
    const font = opts.font || this.fonts.regular;
    const size = opts.size || 10.5;
    const color = opts.color || INK;
    const indent = opts.indent ?? 14;
    const lineHeight = size * (opts.lineGap || 1.35);
    const marker = safe(opts.marker) || '\u2022';
    const lines = this.wrap(value, font, size, this.width - indent);
    lines.forEach((line, index) => {
      this.ensure(lineHeight);
      if (index === 0) {
        this.page.drawText(marker, {
          x: this.margin.left + 3,
          y: this.y - size,
          size,
          font,
          color: opts.markerColor || color
        });
      }
      this.page.drawText(line, { x: this.margin.left + indent, y: this.y - size, size, font, color });
      this.y -= lineHeight;
    });
    this.y -= opts.after ?? 2;
  }

  // Two columns of short items, the left half beside the right, on one shared baseline.
  columns(left: string[], right: string[], opts: TextOptions = {}) {
    const font = opts.font || this.fonts.regular;
    const size = opts.size || 10.5;
    const color = opts.color || INK;
    const lineHeight = size * (opts.lineGap || 1.35);
    const columnWidth = (this.width - 16) / 2;
    const rows = Math.max(left.length, right.length);
    for (let index = 0; index < rows; index += 1) {
      const leftLines = left[index] ? this.wrap(left[index], font, size, columnWidth) : [];
      const rightLines = right[index] ? this.wrap(right[index], font, size, columnWidth) : [];
      const height = Math.max(leftLines.length, rightLines.length, 1) * lineHeight;
      this.ensure(height);
      const top = this.y;
      leftLines.forEach((line, lineIndex) => {
        this.page.drawText(line, {
          x: this.margin.left,
          y: top - size - lineIndex * lineHeight,
          size,
          font,
          color
        });
      });
      rightLines.forEach((line, lineIndex) => {
        this.page.drawText(line, {
          x: this.margin.left + columnWidth + 16,
          y: top - size - lineIndex * lineHeight,
          size,
          font,
          color
        });
      });
      this.y = top - height;
    }
    this.y -= opts.after ?? 4;
  }
}

async function open(margin: Margins) {
  const doc = await PDFDocument.create();
  const sans: FontSet = {
    regular: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
    italic: await doc.embedFont(StandardFonts.HelveticaOblique)
  };
  const serif: FontSet = {
    regular: await doc.embedFont(StandardFonts.TimesRoman),
    bold: await doc.embedFont(StandardFonts.TimesRomanBold),
    italic: await doc.embedFont(StandardFonts.TimesRomanItalic)
  };
  return { doc, writer: new Writer(doc, sans, margin), families: { sans, serif } };
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

export async function buildResumePdf({
  profile,
  resume,
  template,
  layout,
  overrides
}: {
  profile: any;
  resume: any;
  template?: string;
  layout?: any;
  overrides?: any;
}) {
  // The style's own placement and section order, with the candidate's adjustments and the
  // parts they restyled by clicking them in the preview on top.
  const theme = applyStyleOverrides(applyLayoutToTheme(resolveDocxTheme(template), layout), overrides);
  const config = resolveDocxConfig(template, layout);
  // The same two-page fit the Word file applies, so both carry identical content.
  const data: any = fitResumeToPages(resume || {}, template);

  const side = Math.max(34, twips(theme.margin, 50.4));
  const margin: Margins = { top: side, right: side, bottom: side, left: side };
  const { doc, writer: w, families } = await open(margin);
  const pick = (name: unknown): FontSet => (isSerif(name) ? families.serif : families.sans);

  // --- identity block ---
  const nameFont = pick(theme.nameFont).bold;
  const nameSize = halfPoints(theme.nameSize, 22);
  const nameColor = ink(theme.identityNameColor || theme.nameColor, INK);
  const headlineFont = pick(theme.headlineFont).regular;
  const headlineSize = halfPoints(theme.headlineSize, 11);
  const headlineColor = ink(theme.identityHeadlineColor || theme.headlineColor, MUTED);
  const contactFont = pick(theme.contactFont).regular;
  const contactSize = halfPoints(theme.contactSize, 9.5);
  const contactColor = ink(theme.identityContactColor || theme.contactColor, MUTED);
  const align: 'left' | 'center' | 'right' = theme.nameAlign || 'left';
  const nameAlign = theme.identityFill ? 'left' : align;
  const headlineAlign = theme.identityFill ? 'left' : theme.headlineAlign || align;
  const contactAlign = theme.identityFill ? 'left' : theme.contactAlign || align;
  const nameText = safe(profile?.full_name || 'Your Name');
  const headlineText = data.headline ? safe(data.headline) : '';
  const contact = [profile?.location, profile?.phone, profile?.email, profile?.linkedin, profile?.website]
    .filter(Boolean)
    .map((part) => safe(part))
    .join('   |   ');

  if (theme.identityFill) {
    const pad = 20;
    const columns = w.width - pad * 2;
    const nameLines = w.wrap(theme.nameUpper ? nameText.toUpperCase() : nameText, nameFont, nameSize, columns).length;
    const headlineLines = headlineText ? w.wrap(headlineText, headlineFont, headlineSize, columns).length : 0;
    const contactLines = contact ? w.wrap(contact, contactFont, contactSize, columns).length : 0;
    const height = pad * 2
      + nameLines * nameSize * 1.15
      + (headlineLines ? headlineLines * headlineSize * 1.35 + 5 : 0)
      + (contactLines ? contactLines * contactSize * 1.6 + 2 : 0);
    w.band(ink(theme.identityFill), height);
    // The texts sit back inside the band just drawn.
    w.y += height;
    w.text(nameText, { font: nameFont, size: nameSize, color: nameColor, upper: theme.nameUpper, align: nameAlign, indent: pad, after: 4 });
    if (headlineText) w.text(headlineText, { font: headlineFont, size: headlineSize, color: headlineColor, upper: theme.headlineUpper, align: headlineAlign, indent: pad, after: 3 });
    if (contact) w.text(contact, { font: contactFont, size: contactSize, color: contactColor, align: contactAlign, indent: pad, after: 0 });
    w.y = PAGE.height - margin.top - height;
  } else {
    w.text(nameText, { font: nameFont, size: nameSize, color: nameColor, upper: theme.nameUpper, align: nameAlign, after: 3 });
    if (headlineText) w.text(headlineText, { font: headlineFont, size: headlineSize, color: headlineColor, upper: theme.headlineUpper, align: headlineAlign, after: 4 });
    if (contact) w.text(contact, { font: contactFont, size: contactSize, color: contactColor, align: contactAlign, after: 2 });
  }

  if (theme.identityRule) {
    w.rule(ink(theme.identityRule, MUTED), Math.max(0.8, twips(theme.identityRuleSize, 1)), w.width, align);
  } else if (theme.identityBar) {
    w.rule(ink(theme.identityBar), Math.max(1, twips(theme.identityBarSize, 1.2)), Math.min(72, w.width), align);
  } else {
    w.y -= 6;
  }

  // --- sections ---
  const sectionFont = pick(theme.sectionFont)[theme.sectionBold === false ? 'regular' : 'bold'];
  const sectionSize = halfPoints(theme.sectionSize, 10);
  const sectionColor = ink(theme.sectionColor, INK);
  const sectionBefore = twips(theme.sectionBefore, 16);
  const sectionAfter = twips(theme.sectionAfter, 8);

  const heading = (id: string) => {
    const label = SECTION_LABELS[id] || id;
    const text = theme.sectionUpper === false ? label : label.toUpperCase();
    // The heading sits where the candidate placed it: the style's own alignment by default.
    const headingAlign: 'left' | 'center' | 'right' = theme.sectionAlign || 'left';
    w.y -= sectionBefore;
    if (theme.sectionFill) {
      const height = sectionSize * 1.9 + 8;
      w.band(ink(theme.sectionFill), height);
      const top = w.y + height;
      const textWidth = sectionFont.widthOfTextAtSize(safe(text), sectionSize);
      const x = headingAlign === 'center'
        ? (PAGE.width - textWidth) / 2
        : headingAlign === 'right'
          ? PAGE.width - w.margin.right - textWidth - 6
          : w.margin.left + 6;
      w.page.drawText(safe(text), {
        x,
        y: top - 4 - sectionSize,
        size: sectionSize,
        font: sectionFont,
        color: sectionColor
      });
      w.y -= sectionAfter;
    } else {
      w.text(text, { font: sectionFont, size: sectionSize, color: sectionColor, align: headingAlign, after: 1 });
      if (theme.sectionRule) {
        w.rule(ink(theme.sectionRule, MUTED), Math.max(0.6, twips(theme.sectionRuleSize, 0.6)), w.width, theme.sectionAlign || 'left');
      } else if (theme.sectionBar) {
        w.rule(ink(theme.sectionBar), Math.max(1, twips(theme.sectionBarSize, 1.6)), Math.min(64, w.width), theme.sectionAlign || 'left');
      }
      w.y -= sectionAfter;
    }
  };

  const bodyFont = pick(theme.bodyFont);
  const bodySize = halfPoints(theme.bodySize, 10.5);
  const bodyColor = ink(theme.bodyColor, INK);
  const bodyGap = theme.bodyLine ? theme.bodyLine / 240 : 1.35;
  const roleFont = pick(theme.roleFont).bold;
  const roleSize = halfPoints(theme.roleSize, 11);
  const roleColor = ink(theme.roleColor, INK);
  const metaFont = pick(theme.metaFont)[theme.metaItalic ? 'italic' : 'regular'];
  const metaSize = halfPoints(theme.metaSize, 9.5);
  const metaColor = ink(theme.metaColor, MUTED);
  // The keyword line follows the meta treatment unless it was restyled on its own.
  const keywordFont = theme.keywordFont ? pick(theme.keywordFont)[theme.metaItalic ? 'italic' : 'regular'] : metaFont;
  const keywordSize = halfPoints(theme.keywordSize ?? theme.metaSize, metaSize);
  const keywordColor = ink(theme.keywordColor ?? theme.metaColor, metaColor);
  const bulletSize = halfPoints(theme.bulletSize, bodySize);
  const bulletColor = ink(theme.bulletColor, bodyColor);
  const marker = theme.bulletMarker || '\u2022';

  const blocks: Record<string, () => void> = {
    summary: () => {
      if (data.summary) w.text(data.summary, { font: bodyFont.regular, size: bodySize, color: bodyColor, lineGap: bodyGap, after: 4 });
    },
    skills: () => {
      const skills = (Array.isArray(data.skills) ? data.skills : []).filter(Boolean).map((s: unknown) => safe(s));
      if (!skills.length) return;
      const separator = safe(theme.skillsSeparator) || '\u00B7';
      const font = pick(theme.skillsFont)[theme.skillsBold ? 'bold' : 'regular'];
      const size = halfPoints(theme.skillsSize, bodySize);
      const color = ink(theme.skillsColor, bodyColor);
      // The list reads as one designed line, one skill per line, or two columns.
      if (theme.skillsLayout === 'lines') {
        for (const item of skills) w.text(item, { font, size, color, lineGap: bodyGap, after: 2 });
        w.y -= 3;
        return;
      }
      if (theme.skillsLayout === 'columns') {
        const half = Math.ceil(skills.length / 2);
        w.columns(skills.slice(0, half), skills.slice(half), { font, size, color, lineGap: bodyGap, after: 4 });
        return;
      }
      w.text(skills.join(' ' + separator + ' '), { font, size, color, lineGap: bodyGap, after: 4 });
    },
    experience: () => {
      const roles = (Array.isArray(data.experience) ? data.experience : []).filter(
        (role: any) => role && (role.title || role.organization || (Array.isArray(role.bullets) && role.bullets.length))
      );
      for (const role of roles) {
        w.ensure(40);
        w.y -= 4;
        w.text([role.title, role.organization].filter(Boolean).join(', '), {
          font: roleFont,
          size: roleSize,
          color: roleColor,
          upper: theme.roleUpper,
          after: 1
        });
        const details = [role.dates, role.location].filter(Boolean).join('   \u2022   ');
        if (details) w.text(details, { font: metaFont, size: metaSize, color: metaColor, after: 3 });
        for (const item of Array.isArray(role.bullets) ? role.bullets : []) {
          w.bullet(item, {
            font: bodyFont.regular,
            size: bulletSize,
            color: bodyColor,
            lineGap: bodyGap,
            marker,
            markerColor: bulletColor
          });
        }
      }
    },
    education: () => {
      const items = (Array.isArray(data.education) ? data.education : []).filter(
        (item: any) => item && (item.degree || item.institution || item.detail)
      );
      for (const item of items) {
        w.ensure(30);
        w.y -= 3;
        const line = [item.degree, item.institution].filter(Boolean).join(', ')
          + (item.dates ? '    ' + safe(item.dates) : '');
        w.text(line, { font: roleFont, size: roleSize, color: roleColor, after: 1 });
        if (item.detail) w.text(item.detail, { font: metaFont, size: metaSize, color: metaColor, after: 3 });
      }
    },
    certifications: () => {
      for (const item of Array.isArray(data.certifications) ? data.certifications.filter(Boolean) : []) {
        w.bullet(item, {
          font: bodyFont.regular,
          size: bulletSize,
          color: bodyColor,
          lineGap: bodyGap,
          marker,
          markerColor: bulletColor
        });
      }
    },
    keywords: () => {
      const keywords = (Array.isArray(data.keywords) ? data.keywords : []).filter(Boolean).map((k: unknown) => safe(k));
      if (keywords.length) {
        w.text(keywords.join('   \u00B7   '), {
          font: keywordFont,
          size: keywordSize,
          color: keywordColor,
          lineGap: bodyGap,
          after: 4
        });
      }
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
    heading(id);
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
  const margin: Margins = { top: 54, right: 54, bottom: 54, left: 54 };
  const { doc, writer: w, families } = await open(margin);
  const fonts = families.sans;

  w.text(profile?.full_name || 'Your Name', { font: fonts.bold, size: 20, after: 2 });
  const contact = [profile?.email, profile?.phone, profile?.location, profile?.linkedin, profile?.website].filter(Boolean).join('   |   ');
  if (contact) w.text(contact, { size: 9.5, color: MUTED, after: 6 });
  w.y -= 10;

  const today = new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' });
  w.text(today, { size: 10, color: MUTED, after: 12 });

  if (recipient?.company) w.text(recipient.company, { font: fonts.bold, size: 11, after: 1 });
  if (recipient?.job_title) w.text('Re: ' + recipient.job_title, { font: fonts.italic, size: 10, color: MUTED, after: 14 });

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