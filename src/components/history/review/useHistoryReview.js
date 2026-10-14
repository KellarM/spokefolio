import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
const key = id => `resumecraft.history-review.${id}`;
export default function useHistoryReview({ anchor, initialReview, onChanged, onClose }) {
  const [review, setReview] = useState(() => {
    if (!initialReview || initialReview.status !== 'draft') return initialReview || null;
    const saved = localStorage.getItem(key(initialReview.id));
    if (!saved) return initialReview;
    try { const data = JSON.parse(saved); return data.updated_date === initialReview.updated_date ? data : initialReview; } catch { return initialReview; }
  });
  const [selected, setSelected] = useState(anchor ? [anchor] : []);
  const [answers, setAnswers] = useState(() => {
    try { return initialReview ? JSON.parse(localStorage.getItem(`${key(initialReview.id)}.answers`) || '[]') : []; } catch { return []; }
  });
  const [active, setActive] = useState(0); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  useEffect(() => { if (review?.status === 'draft') { localStorage.setItem(key(review.id), JSON.stringify(review)); localStorage.setItem(`${key(review.id)}.answers`, JSON.stringify(answers)); } }, [review, answers]);
  const run = async operation => {
    setBusy(true); setError('');
    try { await operation(); } catch (e) { setError(e?.response?.data?.error || e.message); } finally { setBusy(false); }
  };
  const start = () => run(async () => {
    const { data } = await base44.functions.invoke('organizeCareerHistory', { source_ids: selected.map(s => s.id) });
    setReview(data.review); setActive(0); setAnswers([]); await onChanged();
  });
  const updateEntry = entry => setReview(current => ({ ...current, drafts: current.drafts.map((d,i) => i === active ? entry : d) }));
  const applyAnswers = () => run(async () => {
    const { data } = await base44.functions.invoke('organizeCareerHistory', { review_id: review.id, drafts: review.drafts, answers });
    setReview(data.review); setActive(0); setAnswers([]);
  });
  const save = () => run(async () => {
    const { data } = await base44.functions.invoke('commitCareerReview', { review_id: review.id, action: 'save', drafts: review.drafts });
    setReview(data.review); await onChanged(); onClose();
  });
  const apply = () => {
    if (!window.confirm(`Replace these ${review.sources.length} original entries with ${review.drafts.length} organized entries?\n\n${review.sources.map(s => `${s.title} — ${s.organization || 'No employer'} (${s.start_date || '?'} – ${s.end_date || '?'})`).join('\n')}\n\nOriginal copies are kept for restoration. Existing tailored applications will not change.${answers.some(a => a?.trim()) ? '\nUnapplied answers will not be added. Cancel and apply answers first if needed.' : ''}`)) return;
    run(async () => {
      const { data } = await base44.functions.invoke('commitCareerReview', { review_id: review.id, action: 'apply', drafts: review.drafts });
      setReview(data.review); localStorage.removeItem(key(review.id)); localStorage.removeItem(`${key(review.id)}.answers`); await onChanged(); onClose();
    });
  };
  return { review, selected, setSelected, answers, setAnswers, active, setActive, busy, error, start, updateEntry, applyAnswers, save, apply };
}