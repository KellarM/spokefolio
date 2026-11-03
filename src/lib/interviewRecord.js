import { jsPDF } from 'jspdf';

// A mock interview, on paper.
//
// Everything the record needs is already on the session: the question the
// interviewer asked, the two answers it offered from different jobs, what the
// candidate actually said, and how that landed. This turns it into a document
// they can print, keep and mark up before the real room.
//
// Written deliberately plainly: no canvas, no screenshot, so the text stays
// selectable and a screen reader can read the thing it produced.

const MARGIN = 46;
const PAGE_W = 595.28; // A4 portrait, points
const PAGE_H = 841.89;
const CONTENT_W = PAGE_W - MARGIN * 2;

const INK = [17, 20, 26];
const MUTED = [110, 118, 132];
const GOLD = [154, 116, 16];
const RULE = [214, 218, 226];

function wrap(doc, text, size, style = 'normal', colour = INK, width = CONTENT_W) {
  doc.setFont('helvetica', style);
  doc.setFontSize(size);
  doc.setTextColor(...colour);
  return doc.splitTextToSize(String(text || ''), width);
}

export function buildInterviewRecord({ application, session, labels = {} }) {
  const L = {
    title: 'MOCK INTERVIEW RECORD',
    question: 'QUESTION',
    offered: 'ANSWERS YOU COULD GIVE',
    said: 'WHAT YOU SAID',
    landed: 'HOW IT LANDED',
    improve: 'To improve',
    model: 'THE ANSWER TO GIVE',
    nothing: 'No answer was saved for this question.',
    summary: 'READINESS REPORT',
    strengths: 'What worked',
    rehearse: 'Rehearse',
    proof: 'Proof points to keep',
    company: 'Company',
    role: 'Posting',
    date: 'Session',
    questions: 'Questions',
    footer: 'Spokefolio · Personal Resume Studio',
    ...labels,
  };

  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  let y = MARGIN;
  let page = 1;

  const newPage = () => {
    doc.addPage();
    page += 1;
    y = MARGIN;
  };

  const need = (h) => {
    if (y + h > PAGE_H - MARGIN - 24) newPage();
  };

  const line = (text, opts = {}) => {
    const {
      size = 10, style = 'normal', colour = INK, gap = 4, indent = 0, width,
    } = opts;
    const rows = wrap(doc, text, size, style, colour, width || CONTENT_W - indent);
    rows.forEach((row) => {
      need(size + gap);
      doc.text(row, MARGIN + indent, y);
      y += size + 2;
    });
    y += gap;
  };

  const eyebrow = (text, gapBefore = 12) => {
    y += gapBefore;
    need(14);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...GOLD);
    doc.text(String(text).toUpperCase(), MARGIN, y);
    y += 6;
    doc.setDrawColor(...RULE);
    doc.setLineWidth(0.6);
    doc.line(MARGIN, y, PAGE_W - MARGIN, y);
    y += 10;
  };

  const bullets = (items) => {
    (items || []).forEach((item) => {
      const text = typeof item === 'string' ? item : (item?.text || item?.point || '');
      if (!text) return;
      line(`•  ${text}`, { size: 9.5, indent: 6, gap: 2 });
    });
  };

  // ---- masthead
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...INK);
  doc.text(L.title, MARGIN, y + 6);
  y += 20;

  doc.setDrawColor(...GOLD);
  doc.setLineWidth(1.6);
  doc.line(MARGIN, y, MARGIN + 64, y);
  y += 14;

  const started = session?.started_at ? new Date(session.started_at) : new Date();
  const turns = Array.isArray(session?.turns) ? session.turns : [];
  const meta = [
    [L.company, application?.company || '—'],
    [L.role, application?.job_title || application?.role || '—'],
    [L.date, started.toLocaleDateString('en-CA', { dateStyle: 'long' })],
    [L.questions, String(turns.length)],
  ];
  meta.forEach(([k, v]) => {
    need(16);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(String(k).toUpperCase(), MARGIN, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...INK);
    doc.text(String(v), MARGIN + 92, y);
    y += 15;
  });

  if (session?.greeting) {
    eyebrow('The room');
    line(session.greeting, { size: 9.5, style: 'italic', colour: MUTED });
  }

  // ---- one block per question
  turns.forEach((turn, index) => {
    eyebrow(`${L.question} ${index + 1}`, 14);
    line(turn?.question || '—', { size: 11, style: 'bold', gap: 6 });

    const examples = Array.isArray(turn?.examples) ? turn.examples : [];
    if (examples.length) {
      need(20);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(...GOLD);
      doc.text(L.offered, MARGIN, y);
      y += 11;
      examples.forEach((example, i) => {
        const head = `Answer ${i + 1}${example?.story ? ` · ${example.story}` : ''}`;
        line(head, { size: 8, style: 'bold', colour: MUTED, gap: 2 });
        line(example?.answer || '', { size: 9, gap: 6, indent: 8 });
      });
    }

    need(20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...GOLD);
    doc.text(L.said, MARGIN, y);
    y += 11;
    const said = String(turn?.answer || '').trim();
    line(said || L.nothing, { size: 10, style: said ? 'normal' : 'italic', gap: 6 });

    const fb = turn?.feedback || null;
    if (fb && (fb.landed || fb.improve)) {
      y += 2;
      doc.setDrawColor(...RULE);
      doc.setLineWidth(0.5);
      doc.line(MARGIN, y, PAGE_W - MARGIN, y);
      y += 11;
      need(16);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(...GOLD);
      doc.text(L.landed, MARGIN, y);
      y += 11;
      if (fb.landed) line(fb.landed, { size: 9.5, gap: 4 });
      if (fb.improve) line(`${L.improve}: ${fb.improve}`, { size: 9.5, colour: MUTED, gap: 4 });
      if (fb.model_answer) {
        y += 4;
        need(16);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(...GOLD);
        doc.text(L.model, MARGIN, y);
        y += 11;
        line(fb.model_answer, { size: 9.5, gap: 4 });
      }
    }
  });

  // ---- the readiness report, if the drill produced one
  const summary = session?.summary || null;
  if (summary && (summary.readiness || summary.strengths?.length || summary.rehearse?.length
    || summary.best_proof_points?.length)) {
    eyebrow(L.summary, 16);
    if (summary.readiness) line(summary.readiness, { size: 10, gap: 6 });
    if (summary.strengths?.length) {
      line(L.strengths, { size: 8, style: 'bold', colour: GOLD, gap: 2 });
      bullets(summary.strengths);
    }
    if (summary.rehearse?.length) {
      line(L.rehearse, { size: 8, style: 'bold', colour: GOLD, gap: 2 });
      bullets(summary.rehearse);
    }
    if (summary.best_proof_points?.length) {
      line(L.proof, { size: 8, style: 'bold', colour: GOLD, gap: 2 });
      bullets(summary.best_proof_points);
    }
  }

  // ---- footers
  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p += 1) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text(L.footer, MARGIN, PAGE_H - 26);
    doc.text(`${p} / ${total}`, PAGE_W - MARGIN, PAGE_H - 26, { align: 'right' });
  }

  return doc;
}

export function downloadInterviewRecord({ application, session, labels }) {
  const doc = buildInterviewRecord({ application, session, labels });
  const who = String(application?.company || 'interview').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  const when = session?.started_at
    ? new Date(session.started_at).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);
  doc.save(`interview-record-${who}-${when}.pdf`);
}
