import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

const hostOf = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch (error) {
    return '';
  }
};

// Postings arrive as copied text or pulled links, and copied text usually lands as one
// dense block: headings run into sentences, bullets sit inline mid-paragraph. This
// formatter turns that block back into the shape a real posting had. Two tools only:
// a curated set of section headings a posting uses to announce itself (matched
// case-sensitively, longest first, and only when a capital letter follows - a
// heading leads content, it never ends a sentence), and the bullet glyph, which
// gets each duty back onto its own line the way it was written.

const HEADING_PHRASES = [
  'Why consider this role',
  'What you will be doing',
  "What you'll be doing",
  'What you will bring',
  "What you'll bring",
  'What you will do',
  "What you'll do",
  'What we are looking for',
  'What we look for',
  'What we offer',
  'Key responsibilities',
  'Core responsibilities',
  'Primary responsibilities',
  'Duties and responsibilities',
  'About the opportunity',
  'About the position',
  'About the company',
  'About the role',
  'What you bring',
  'The opportunity',
  'The position',
  'The company',
  'The organization',
  'The opportunity ahead',
  'Your background',
  'Who we are',
  'Who you are',
  'About us',
  'About you',
  'The role'
];

const headingRe = new RegExp(
  `\\b(?:${HEADING_PHRASES.map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).sort((a, b) => b.length - a.length).join('|')})[?:]?(?=\\s+[A-Z])`,
  'g'
);

// Single-word headings announce themselves with a colon: "Requirements: ...".
const colonHeadingRe = /\b(Responsibilities|Requirements|Qualifications|Accountabilities|Overview|Summary|Duties|Benefits):(?=\s)/g;

const SENTINEL = '\u0001';

function toBlocks(raw) {
  const marked = raw
    .replace(headingRe, `${SENTINEL}$&${SENTINEL}`)
    .replace(colonHeadingRe, `${SENTINEL}$&${SENTINEL}`);

  const blocks = [];
  const pushPara = (text) => {
    // A heading absorbs its own question mark or colon; strip any stray
    // punctuation a malformed paste might still leave at the front.
    const trimmed = text.replace(/^[?:\s]+/, '').trim();
    if (trimmed) blocks.push({ type: 'para', text: trimmed });
  };
  const pushItem = (text) => {
    const trimmed = text.replace(/\s*\n\s*/g, ' ').trim();
    if (!trimmed) return;
    const last = blocks[blocks.length - 1];
    if (last && last.type === 'list') last.items.push(trimmed);
    else blocks.push({ type: 'list', items: [trimmed] });
  };

  marked.split(SENTINEL).forEach((part, index) => {
    const trimmed = part.trim();
    if (!trimmed) return;

    if (index % 2 === 1) {
      blocks.push({ type: 'heading', text: trimmed });
      return;
    }

    const pieces = trimmed.split(/\s*[•●▪]\s*/);
    // Two posting shapes arrive here. Copied text puts every duty on one line
    // with bullet glyphs; a pulled posting puts each duty on its own line after
    // a colon-ended lead-in ("...responsible for:"). The glyph shape splits on
    // bullets directly. The line shape reads lines in order: a paragraph
    // ending in a colon leads a list, and the unpunctuated lines that follow
    // it are the duties themselves, until a sentence closes the group.
    let inList = false;
    pieces[0].split(/\n+/).forEach((line) => {
      const t = line.trim();
      if (!t) return;
      if (t.endsWith(':')) {
        pushPara(t);
        inList = true;
      } else if (inList && !/[.?!]$/.test(t)) {
        pushItem(t);
      } else {
        pushPara(t);
        inList = false;
      }
    });
    pieces.slice(1).forEach((piece) => pushItem(piece));
  });

  return blocks;
}

function PostingBody({ blocks }) {
  return (
    <div className="mt-4 max-h-[440px] overflow-y-auto rounded-xl bg-secondary/60 p-5 sm:p-6">
      {blocks.map((block, index) => {
        if (block.type === 'heading') {
          return (
            <h3
              key={index}
              className={`font-reading text-[16px] font-semibold tracking-wide text-foreground ${index === 0 ? 'mb-2.5' : 'mt-5 mb-2.5'}`}
            >
              {block.text}
            </h3>
          );
        }
        if (block.type === 'para') {
          return (
            <p
              key={index}
              className={`font-reading text-[15px] leading-[1.72] text-foreground/90 text-justify ${index === 0 ? 'mb-3' : 'mb-3'}`}
            >
              {block.text}
            </p>
          );
        }
        return (
          <ul key={index} className="mb-3 space-y-1.5">
            {block.items.map((item, itemIndex) => (
              <li key={itemIndex} className="flex gap-2.5">
                <span className="mt-[10px] h-[4.5px] w-[4.5px] shrink-0 rounded-full bg-foreground/70" aria-hidden="true" />
                <p className="font-reading text-[15px] leading-[1.62] text-foreground/90 text-justify">{item}</p>
              </li>
            ))}
          </ul>
        );
      })}
    </div>
  );
}

// The posting the résumé was written from, kept beside it so it can be read back later.
export default function JobPostingPanel({ description, sourceUrl }) {
  const [open, setOpen] = useState(false);
  const text = (description || '').trim();
  if (!text) return null;
  const words = text.split(/\s+/).length;
  const host = hostOf(sourceUrl);
  const blocks = toBlocks(text);

  return (
    <section className="mt-7 rounded-2xl border border-primary/35 bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow">The posting you tailored for</p>
          <p className="mt-2 text-[13px] text-muted-foreground">{words} words · saved with this application</p>
          {sourceUrl && (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1.5 inline-flex items-center gap-1.5 text-[12.5px] text-primary underline-offset-4 hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" /> {host || 'Open the original posting'}
            </a>
          )}
        </div>
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="inline-flex items-center gap-1.5 rounded-full border border-border/70 px-3.5 py-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
        >
          {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          {open ? 'Hide posting' : 'Show posting'}
        </button>
      </div>

      {open && <PostingBody blocks={blocks} />}
    </section>
  );
}
