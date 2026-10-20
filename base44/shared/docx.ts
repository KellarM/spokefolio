// Dependency-free .docx writer.
// Builds a valid Word package (OOXML) and stores it as an uncompressed ZIP.

import { applyLayoutToTheme, applyStyleOverrides, resolveDocxConfig, resolveDocxTheme } from './resumeTemplates.ts';
import { fitResumeToPages } from './resumeFit.ts';

const encoder = new TextEncoder();

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes) {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i += 1) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ bytes[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function concatBytes(parts) {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(total);
  let at = 0;
  for (const part of parts) {
    out.set(part, at);
    at += part.length;
  }
  return out;
}

function zipStore(files) {
  const chunks = [];
  const central = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = encoder.encode(file.name);
    const data = file.bytes || encoder.encode(file.content);
    const crc = crc32(data);

    const local = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);
    lv.setUint16(6, 0, true);
    lv.setUint16(8, 0, true);
    lv.setUint16(10, 0, true);
    lv.setUint16(12, 0x0021, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, data.length, true);
    lv.setUint32(22, data.length, true);
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true);
    local.set(nameBytes, 30);

    const cd = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(cd.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, 0, true);
    cv.setUint16(14, 0x0021, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, data.length, true);
    cv.setUint32(24, data.length, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true);
    cv.setUint16(32, 0, true);
    cv.setUint16(34, 0, true);
    cv.setUint16(36, 0, true);
    cv.setUint32(38, 0, true);
    cv.setUint32(42, offset, true);
    cd.set(nameBytes, 46);

    chunks.push(local, data);
    central.push(cd);
    offset += local.length + data.length;
  }

  const centralBytes = concatBytes(central);
  const end = new Uint8Array(22);
  const ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, files.length, true);
  ev.setUint16(10, files.length, true);
  ev.setUint32(12, centralBytes.length, true);
  ev.setUint32(16, offset, true);

  return concatBytes([...chunks, centralBytes, end]);
}

function toBase64(bytes) {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunkSize)));
  }
  return btoa(binary);
}

// The portrait arrives as base64 and has to go back into the package as real bytes.
function fromBase64(value) {
  const binary = atob(String(value || ''));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Every colour, font and spacing value below comes from the chosen résumé style
// (base44/shared/resumeTemplates.ts), so the Word file matches the on-screen preview.

function esc(value) {
  return String(value === null || value === undefined ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function run(text, opts = {}) {
  const size = opts.size || 21;
  const font = opts.font || 'Calibri';
  const props = [
    `<w:rFonts w:ascii="${font}" w:hAnsi="${font}"/>`,
    opts.bold ? '<w:b/>' : '',
    opts.italic ? '<w:i/>' : '',
    typeof opts.spacing === 'number' ? `<w:spacing w:val="${opts.spacing}"/>` : '',
    `<w:sz w:val="${size}"/><w:szCs w:val="${size}"/>`,
    `<w:color w:val="${opts.color || '1F2937'}"/>`
  ].join('');
  const tab = opts.tabAfter ? '<w:tab/>' : '';
  return `<w:r><w:rPr>${props}</w:rPr><w:t xml:space="preserve">${esc(text)}</w:t>${tab}</w:r>`;
}

function para(runs, opts = {}) {
  const spacing = `<w:spacing w:before="${opts.before || 0}" w:after="${opts.after === undefined ? 60 : opts.after}" w:line="${opts.line || 264}" w:lineRule="auto"/>`;
  const indent = opts.hanging
    ? `<w:ind w:left="${opts.indent || 284}" w:hanging="${opts.indent || 284}"/>`
    : opts.indent
      ? `<w:ind w:left="${opts.indent}"/>`
      : '';
  const tabs = opts.hanging
    ? `<w:tabs><w:tab w:val="left" w:pos="${opts.indent || 284}"/></w:tabs>`
    : Array.isArray(opts.tabStops) && opts.tabStops.length
      ? `<w:tabs>${opts.tabStops.map((pos) => `<w:tab w:val="left" w:pos="${pos}"/>`).join('')}</w:tabs>`
      : '';
  const edges = [];
  if (opts.rule) edges.push(`<w:bottom w:val="single" w:sz="${opts.ruleSize || 6}" w:space="3" w:color="${opts.rule}"/>`);
  if (opts.bar) edges.push(`<w:left w:val="single" w:sz="${opts.barSize || 24}" w:space="8" w:color="${opts.bar}"/>`);
  const border = edges.length ? `<w:pBdr>${edges.join('')}</w:pBdr>` : '';
  const fill = opts.fill ? `<w:shd w:val="clear" w:color="auto" w:fill="${opts.fill}"/>` : '';
  const justify = opts.align ? `<w:jc w:val="${opts.align}"/>` : '';
  // "Keep with next" belongs on headings only: on every paragraph Word treats the whole
  // body as one unbreakable block and pushes it off the first page.
  const keepNext = opts.keepNext ? '<w:keepNext/>' : '';
  return `<w:p><w:pPr>${keepNext}${border}${fill}${tabs}${spacing}${indent}${justify}</w:pPr>${runs}</w:p>`;
}

function sectionTitle(label, t) {
  return para(
    run(t.sectionUpper ? label.toUpperCase() : label, {
      bold: t.sectionBold,
      size: t.sectionSize,
      color: t.sectionColor,
      font: t.sectionFont,
      spacing: t.sectionSpacing
    }),
    {
      keepNext: true,
      before: t.sectionBefore,
      after: t.sectionAfter,
      align: t.sectionAlign,
      rule: t.sectionRule,
      ruleSize: t.sectionRuleSize,
      bar: t.sectionBar,
      barSize: t.sectionBarSize,
      fill: t.sectionFill,
      indent: t.sectionBar ? 160 : 0
    }
  );
}

// Ink that has to print on a filled band. A style without a band keeps its own colours.
function bandInk(t, kind, fallback) {
  if (!t.identityFill) return fallback;
  if (kind === 'headline') return t.identityHeadlineColor || t.identityNameColor || 'FFFFFF';
  if (kind === 'contact') return t.identityContactColor || t.identityHeadlineColor || t.identityNameColor || 'FFFFFF';
  return t.identityNameColor || 'FFFFFF';
}

const NO_BORDERS = ['top', 'left', 'bottom', 'right', 'insideH', 'insideV']
  .map((side) => `<w:${side} w:val="none" w:sz="0" w:space="0" w:color="auto"/>`)
  .join('');

// The identity block both documents open with, drawn in the chosen style's name,
// headline and contact treatment.
function identityBlock(profile, subtitle, t) {
  const parts = [];
  const bar = t.identityBar ? { bar: t.identityBar, barSize: t.identityBarSize } : {};
  const name = profile.full_name || 'Your Name';
  parts.push(
    para(run(t.nameUpper ? name.toUpperCase() : name, { bold: true, size: t.nameSize, color: bandInk(t, 'name', t.nameColor), font: t.nameFont, spacing: t.nameSpacing }), {
      ...bar,
      align: t.nameAlign,
      rule: t.identityRule,
      ruleSize: t.identityRuleSize,
      after: subtitle ? 30 : 60,
      line: 260
    })
  );
  if (subtitle) {
    parts.push(
      para(
        run(t.headlineUpper ? subtitle.toUpperCase() : subtitle, {
          bold: true,
          size: t.headlineSize,
          color: bandInk(t, 'headline', t.headlineColor),
          font: t.headlineFont,
          spacing: t.headlineSpacing
        }),
        { ...bar, align: t.headlineAlign, after: 60 }
      )
    );
  }
  const contact = [profile.email, profile.phone, profile.location, profile.linkedin, profile.website].filter(Boolean);
  if (contact.length) {
    parts.push(
      para(run(contact.join(t.contactSeparator), { size: t.contactSize, color: bandInk(t, 'contact', t.contactColor), font: t.contactFont }), {
        ...bar,
        align: t.contactAlign,
        after: 60
      })
    );
  }
  return parts;
}

// A solid band behind the identity block, bled to the page edges: the shaded cell
// carries both the colour and the padding, the way the on-screen preview draws it.
function bandBlock(identity, t) {
  return `<w:tbl><w:tblPr><w:tblW w:w="12240" w:type="dxa"/><w:tblInd w:w="-${t.margin}" w:type="dxa"/><w:tblBorders>${NO_BORDERS}</w:tblBorders><w:tblLayout w:type="fixed"/><w:tblCellMar><w:top w:w="240" w:type="dxa"/><w:left w:w="${t.margin}" w:type="dxa"/><w:bottom w:w="240" w:type="dxa"/><w:right w:w="${t.margin}" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid><w:gridCol w:w="12240"/></w:tblGrid><w:tr><w:tc><w:tcPr><w:tcW w:w="12240" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="${t.identityFill}"/><w:vAlign w:val="center"/></w:tcPr>${identity}</w:tc></w:tr></w:tbl><w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/></w:pPr></w:p>`;
}

// ---- The portrait, for the styles whose configuration carries one ----

const EMU_PER_PX = 9525;
const PHOTO_MAX_W = 1050000;
const PHOTO_MAX_H = 1290000;

function drawingParagraph(photo) {
  const pxW = Number(photo.widthPx) || 0;
  const pxH = Number(photo.heightPx) || 0;
  if (!pxW || !pxH) return '<w:p/>';
  const scale = Math.min(PHOTO_MAX_W / (pxW * EMU_PER_PX), PHOTO_MAX_H / (pxH * EMU_PER_PX));
  const cx = Math.max(1, Math.round(pxW * EMU_PER_PX * scale));
  const cy = Math.max(1, Math.round(pxH * EMU_PER_PX * scale));
  return `<w:p><w:pPr><w:jc w:val="right"/><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/></w:pPr><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:docPr id="1" name="Portrait"/><wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="1" name="Portrait"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rId2"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`;
}

// Identity details on the left, portrait on the right, in a borderless table. When the
// style carries a band, that table is shaded and bled to the page edges too.
function photoHeader(identity, photo, t) {
  const band = t.identityFill;
  const width = band ? 12240 : 12240 - t.margin * 2;
  const photoW = 1900;
  const textW = width - photoW - (band ? t.margin * 2 : 0);
  const shading = band ? `<w:shd w:val="clear" w:color="auto" w:fill="${band}"/>` : '';
  const indent = band ? `<w:tblInd w:w="-${t.margin}" w:type="dxa"/>` : '';
  const cellMargins = band
    ? `<w:tblCellMar><w:top w:w="240" w:type="dxa"/><w:left w:w="${t.margin}" w:type="dxa"/><w:bottom w:w="240" w:type="dxa"/><w:right w:w="${t.margin}" w:type="dxa"/></w:tblCellMar>`
    : '';
  return `<w:tbl><w:tblPr><w:tblW w:w="${width}" w:type="dxa"/>${indent}<w:tblBorders>${NO_BORDERS}</w:tblBorders><w:tblLayout w:type="fixed"/>${cellMargins}</w:tblPr><w:tblGrid><w:gridCol w:w="${textW}"/><w:gridCol w:w="${photoW}"/></w:tblGrid><w:tr><w:tc><w:tcPr><w:tcW w:w="${textW}" w:type="dxa"/>${shading}<w:vAlign w:val="center"/></w:tcPr>${identity.join('')}</w:tc><w:tc><w:tcPr><w:tcW w:w="${photoW}" w:type="dxa"/>${shading}<w:tcMar><w:left w:w="240" w:type="dxa"/></w:tcMar><w:vAlign w:val="center"/></w:tcPr>${drawingParagraph(photo)}</w:tc></w:tr></w:tbl><w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/></w:pPr></w:p>`;
}

const SECTION_LABELS: Record<string, string> = {
  summary: 'Professional summary',
  skills: 'Core skills',
  experience: 'Professional experience',
  education: 'Education',
  certifications: 'Certifications',
  keywords: 'Additional keywords'
};

function bulletLine(item, t) {
  return para(
    run(t.bulletMarker, { size: t.bulletSize, color: t.bulletColor, font: t.bodyFont, tabAfter: true }) +
      run(item, { size: t.bodySize, color: t.bodyColor, font: t.bodyFont }),
    { after: 40, hanging: true, indent: 260, line: t.bodyLine }
  );
}

// Skills and keywords read as a designed line rather than plain text.
function skillsLine(items, t) {
  return items
    .map(
      (item, index) =>
        run(item, { bold: t.skillsBold, size: t.skillsSize, color: t.skillsColor, font: t.skillsFont }) +
        (index < items.length - 1
          ? run(t.skillsSeparator, { bold: t.skillsBold, size: t.skillsSize, color: t.skillsSeparatorColor, font: t.skillsFont })
          : '')
    )
    .join('');
}

// The skills list reads as one designed line, one skill per line, or two columns.
function skillsBlock(items, t) {
  const ink = { bold: t.skillsBold, size: t.skillsSize, color: t.skillsColor, font: t.skillsFont };
  if (t.skillsLayout === 'lines') {
    return items.map((item) => para(run(item, ink), { after: 40, line: t.bodyLine }));
  }
  if (t.skillsLayout === 'columns') {
    const half = Math.ceil(items.length / 2);
    const left = items.slice(0, half);
    const right = items.slice(half);
    const tabStop = Math.round((12240 - t.margin * 2) / 2);
    return left.map((item, index) =>
      para(run(item, { ...ink, tabAfter: Boolean(right[index]) }) + (right[index] ? run(right[index], ink) : ''), {
        after: 40,
        line: t.bodyLine,
        tabStops: [tabStop]
      })
    );
  }
  return [para(skillsLine(items, t), { after: 80, line: t.bodyLine })];
}

function buildBody(profile, resume, t, config, photo) {
  const identity = identityBlock(profile, resume.headline, t);
  const parts = config.photo && photo ? [photoHeader(identity, photo, t)] : t.identityFill ? [bandBlock(identity.join(''), t)] : [...identity];
  const blocks = {};

  if (resume.summary) {
    blocks.summary = [
      para(run(resume.summary, { size: t.bodySize, color: t.bodyColor, font: t.bodyFont }), { after: 80, line: t.bodyLine })
    ];
  }

  const skills = (Array.isArray(resume.skills) ? resume.skills : []).filter(Boolean);
  if (skills.length) {
    blocks.skills = skillsBlock(skills, t);
  }

  const roles = (Array.isArray(resume.experience) ? resume.experience : []).filter(
    (role) => role && (role.title || role.organization || (Array.isArray(role.bullets) && role.bullets.length))
  );
  if (roles.length) {
    const items = [];
    for (const role of roles) {
      const heading = [role.title, role.organization].filter(Boolean).join(', ');
      const details = [role.dates, role.location].filter(Boolean).join('   \u2022   ');
      items.push(
        para(run(t.roleUpper ? heading.toUpperCase() : heading, { bold: true, size: t.roleSize, color: t.roleColor, font: t.roleFont }), {
          before: 180,
          after: details ? 20 : 60,
          keepNext: true
        })
      );
      if (details) {
        items.push(para(run(details, { size: t.metaSize, color: t.metaColor, font: t.metaFont, italic: t.metaItalic }), { after: 70 }));
      }
      for (const item of Array.isArray(role.bullets) ? role.bullets : []) {
        if (item) items.push(bulletLine(item, t));
      }
    }
    blocks.experience = items;
  }

  const education = (Array.isArray(resume.education) ? resume.education : []).filter(
    (item) => item && (item.degree || item.institution || item.detail)
  );
  if (education.length) {
    const items = [];
    for (const item of education) {
      const line = [item.degree, item.institution].filter(Boolean).join(', ');
      items.push(
        para(
          run(line, { bold: true, size: t.roleSize, color: t.roleColor, font: t.roleFont }) +
            (item.dates ? run('    ' + item.dates, { size: t.metaSize, color: t.metaColor, font: t.metaFont, italic: t.metaItalic }) : ''),
          { before: 120, after: 40, keepNext: true }
        )
      );
      if (item.detail) {
        items.push(para(run(item.detail, { size: t.bodySize - 1, color: t.metaColor, font: t.bodyFont }), { after: 60 }));
      }
    }
    blocks.education = items;
  }

  const certifications = Array.isArray(resume.certifications) ? resume.certifications.filter(Boolean) : [];
  if (certifications.length) {
    blocks.certifications = certifications.map((item) => bulletLine(item, t));
  }

  const keywords = Array.isArray(resume.keywords) ? resume.keywords.filter(Boolean) : [];
  if (keywords.length) {
    blocks.keywords = [
      para(
        run(keywords.join('   \u00B7   '), {
          size: t.keywordSize ?? t.metaSize,
          color: t.keywordColor ?? t.metaColor,
          font: t.keywordFont ?? t.bodyFont
        }),
        { after: 60 }
      )
    ];
  }

  // The style's configuration decides which sections appear and in what order.
  for (const id of config.sections) {
    const items = blocks[id];
    if (!items || !items.length) continue;
    parts.push(sectionTitle(SECTION_LABELS[id] || id, t), ...items);
  }

  return parts.join('');
}

function packDocx(body, filename, style, portrait) {
  const margin = style.margin;
  const imageExt = portrait ? (portrait.ext === 'png' ? 'png' : 'jpeg') : null;
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"><w:body>${body}<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="${margin}" w:right="${margin}" w:bottom="${margin}" w:left="${margin}" w:header="720" w:footer="720" w:gutter="0"/></w:sectPr></w:body></w:document>`;

  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="${style.font}" w:hAnsi="${style.font}" w:cs="${style.font}"/><w:sz w:val="${style.size}"/><w:szCs w:val="${style.size}"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="0" w:line="${style.line}" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style></w:styles>`;

  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>${imageExt ? `<Default Extension="${imageExt}" ContentType="image/${imageExt}"/>` : ''}<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>`;

  const rootRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`;

  const imageRel = imageExt
    ? `<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image1.${imageExt}"/>`
    : '';
  const documentRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>${imageRel}</Relationships>`;

  const entries = [
    { name: '[Content_Types].xml', content: contentTypes },
    { name: '_rels/.rels', content: rootRels },
    { name: 'word/document.xml', content: documentXml },
    { name: 'word/_rels/document.xml.rels', content: documentRels },
    { name: 'word/styles.xml', content: stylesXml }
  ];
  if (imageExt) entries.push({ name: `word/media/image1.${imageExt}`, bytes: fromBase64(portrait.base64) });

  const bytes = zipStore(entries);

  return { base64: toBase64(bytes), filename: safeFilename(filename) };
}

function safeFilename(base, fallback = 'document') {
  const clean = String(base || '')
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120);
  return (clean || fallback) + '.docx';
}

const packStyle = (t) => ({ margin: t.margin, font: t.bodyFont, size: t.bodySize, line: t.bodyLine });

export function buildResumeDocx({ profile, resume, label, template, photo, layout, overrides }) {
  // The style's own placement and section order, with the candidate's adjustments and the
  // parts they restyled by clicking them in the preview on top.
  const theme = applyStyleOverrides(applyLayoutToTheme(resolveDocxTheme(template), layout), overrides);
  const config = resolveDocxConfig(template, layout);
  const portrait = config.photo && photo ? photo : null;
  const person = (profile && profile.full_name) || 'Resume';
  // However long the content grew, the file prints as two full pages.
  const fitted = fitResumeToPages(resume || {}, template);
  const extra = label || (fitted && fitted.headline) || '';
  const body = buildBody(profile || {}, fitted, theme, config, portrait);
  return packDocx(body, [person, extra].filter(Boolean).join(' - '), packStyle(theme), portrait);
}

// The cover letter keeps the editorial house style whatever résumé style is chosen.
export function buildCoverLetterDocx({ profile, cover_letter, recipient }) {
  const details = profile || {};
  const org = (recipient && recipient.company) || '';
  const role = (recipient && recipient.job_title) || '';
  const theme = resolveDocxTheme('editorial');
  const parts = [];

  parts.push(...identityBlock(details, null, theme));

  const today = new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' });
  parts.push(para(run(today, { size: 20, color: theme.contactColor, font: theme.bodyFont }), { before: 160, after: 180 }));

  if (org) parts.push(para(run(org, { size: 22, bold: true, color: theme.nameColor, font: theme.bodyFont }), { after: 20 }));
  if (role) parts.push(para(run('Re: ' + role, { size: 20, color: theme.headlineColor, font: theme.bodyFont, italic: true }), { after: 220 }));

  const lines = String(cover_letter || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  for (const line of lines) {
    parts.push(para(run(line, { size: 21, color: theme.bodyColor, font: theme.bodyFont }), { after: 140, line: 276 }));
  }

  return packDocx(
    parts.join(''),
    [details.full_name || 'Cover Letter', org, 'Cover Letter'].filter(Boolean).join(' - '),
    packStyle(theme)
  );
}