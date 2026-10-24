import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CalendarCheck,
  Check,
  FileText,
  Mic,
  PenLine,
  Sparkles,
  X
} from 'lucide-react';
import { useStudioLanguage } from '@/lib/StudioLanguage';

// The mock run: a first-time client sees the whole loop before living it.
// A sample client - Jordan, a warehouse associate - tells one story, sharpens
// it, pastes a job posting, and watches a tailored application fall out.
// About a minute, six screens, nothing to type, nothing at risk. The finale
// hands off to the real journey, where the ball coaches every live step.
const SCREENS = ['intro', 'story', 'sharpen', 'posting', 'result', 'cta'];

export default function FirstTimeDemo({ onFinish, onSkip }) {
  const { t } = useStudioLanguage();
  const [screen, setScreen] = useState(0);

  const next = () => setScreen((s) => Math.min(s + 1, SCREENS.length - 1));
  const back = () => setScreen((s) => Math.max(s - 1, 0));
  const name = SCREENS[screen];
  const last = screen === SCREENS.length - 1;

  return (
    <div className="demo-overlay" role="dialog" aria-modal="true">
      <div className="demo-card" key={screen}>
        <button type="button" className="demo-close" onClick={onSkip} aria-label={t('tour.close')}>
          <X className="h-4 w-4" />
        </button>

        <div className="demo-dots" aria-hidden="true">
          {SCREENS.map((s, i) => (
            <span key={s} className={`demo-dot ${i === screen ? 'on' : ''}`} />
          ))}
        </div>

        {name === 'intro' && (
          <div className="demo-screen">
            <p className="eyebrow">{t('demo.introEyebrow')}</p>
            <h2 className="demo-head">{t('demo.introHead')}</h2>
            <p className="demo-body">{t('demo.introBody')}</p>
            <div className="demo-mock">
              <div className="demo-jordan">
                <span className="demo-avatar">JA</span>
                <div>
                  <p className="demo-jordan-name">Jordan Avery</p>
                  <p className="demo-jordan-role">{t('demo.mockRole')}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {name === 'story' && (
          <div className="demo-screen">
            <p className="eyebrow">{t('demo.storyEyebrow')}</p>
            <h2 className="demo-head">{t('demo.storyHead')}</h2>
            <div className="demo-mock">
              <p className="demo-mock-label">
                <Mic className="mr-1.5 inline h-3.5 w-3.5" />
                {t('demo.mockDictationLabel')}
              </p>
              <p className="demo-mock-quote">{t('demo.mockDictation')}</p>
            </div>
            <div className="demo-arrow" aria-hidden="true">
              <ArrowRight className="h-4 w-4 rotate-90" />
            </div>
            <div className="demo-mock">
              <p className="demo-mock-label">
                <Sparkles className="mr-1.5 inline h-3.5 w-3.5" />
                {t('demo.mockParsedLabel')}
              </p>
              <p className="demo-entry-title">{t('demo.mockTitle')}</p>
              <p className="demo-entry-meta">{t('demo.mockMeta')}</p>
              <div className="demo-chips">
                {['demo.chipOps', 'demo.chipTraining', 'demo.chipShipping'].map((k) => (
                  <span key={k} className="demo-chip">
                    {t(k)}
                  </span>
                ))}
              </div>
            </div>
            <p className="demo-caption">{t('demo.storyCaption')}</p>
          </div>
        )}

        {name === 'sharpen' && (
          <div className="demo-screen">
            <p className="eyebrow">{t('demo.sharpenEyebrow')}</p>
            <h2 className="demo-head">{t('demo.sharpenHead')}</h2>
            <div className="demo-mock">
              <p className="demo-mock-label">
                <PenLine className="mr-1.5 inline h-3.5 w-3.5" />
                {t('demo.mockPromptLabel')}
              </p>
              <p className="demo-mock-quote">{t('demo.mockPrompt')}</p>
              <p className="demo-mock-answer">{t('demo.mockAnswer')}</p>
            </div>
            <div className="demo-mock">
              <p className="demo-mock-label">
                <FileText className="mr-1.5 inline h-3.5 w-3.5" />
                {t('demo.mockFilesLabel')}
              </p>
              <div className="demo-chips">
                <span className="demo-chip">{t('demo.mockFile1')}</span>
                <span className="demo-chip">{t('demo.mockFile2')}</span>
              </div>
            </div>
            <p className="demo-caption">{t('demo.sharpenCaption')}</p>
          </div>
        )}

        {name === 'posting' && (
          <div className="demo-screen">
            <p className="eyebrow">{t('demo.postingEyebrow')}</p>
            <h2 className="demo-head">{t('demo.postingHead')}</h2>
            <div className="demo-mock">
              <p className="demo-entry-title">{t('demo.mockPostingTitle')}</p>
              <p className="demo-entry-meta">{t('demo.mockPostingMeta')}</p>
              <div className="demo-chips">
                {['demo.chipOps', 'demo.chipTraining', 'demo.chipShipping'].map((k, i) => (
                  <span key={k} className={`demo-chip ${i < 3 ? 'match' : ''}`}>
                    {t(k)}
                    <Check className="ml-1 inline h-3 w-3" />
                  </span>
                ))}
              </div>
            </div>
            <p className="demo-caption">{t('demo.postingCaption')}</p>
          </div>
        )}

        {name === 'result' && (
          <div className="demo-screen">
            <p className="eyebrow">{t('demo.resultEyebrow')}</p>
            <h2 className="demo-head">{t('demo.resultHead')}</h2>
            <div className="demo-mock">
              <p className="demo-mock-label">
                <FileText className="mr-1.5 inline h-3.5 w-3.5" />
                {t('demo.mockResumeLabel')}
              </p>
              <p className="demo-mock-quote">{t('demo.mockResumeBullet')}</p>
            </div>
            <div className="demo-mock">
              <p className="demo-mock-label">
                <CalendarCheck className="mr-1.5 inline h-3.5 w-3.5" />
                {t('demo.mockAppLabel')}
              </p>
              <p className="demo-entry-title">{t('demo.mockAppTitle')}</p>
              <p className="demo-entry-meta">{t('demo.mockAppMeta')}</p>
            </div>
            <p className="demo-caption">{t('demo.resultCaption')}</p>
          </div>
        )}

        {name === 'cta' && (
          <div className="demo-screen">
            <p className="eyebrow">{t('demo.ctaEyebrow')}</p>
            <h2 className="demo-head">{t('demo.ctaHead')}</h2>
            <p className="demo-body">{t('demo.ctaBody')}</p>
          </div>
        )}

        <div className="demo-foot">
          {screen > 0 ? (
            <button type="button" className="demo-btn ghost" onClick={back}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('demo.back')}
            </button>
          ) : (
            <span />
          )}
          {last ? (
            <div className="demo-cta-row">
              <button type="button" className="demo-btn ghost" onClick={onSkip}>
                {t('demo.later')}
              </button>
              <button type="button" className="demo-btn primary" onClick={onFinish}>
                <Sparkles className="mr-2 h-4 w-4" />
                {t('demo.startNow')}
              </button>
            </div>
          ) : (
            <button type="button" className="demo-btn primary" onClick={next}>
              {t('demo.next')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
