import React, { useEffect, useState } from 'react';
import { Volume2, X } from 'lucide-react';
import { speak, whenVoicesReady, getVoicesForPicker, getVoiceOverride, setVoiceOverride, LANGUAGE_TO_BCP47 } from '@/lib/speech';
import { useStudioLanguage } from '@/lib/StudioLanguage';

// The client's ears decide: every voice the device offers, previewed with
// the profile's own delivery, with an automatic option on top. The blind
// tuning that preceded this produced 'a big Irish drunk woman' (Michael,
// Oct 26) - the choice now lives with the person who has to hear it.

const PROFILES = [
  { id: 'assistant', labelKey: 'voice.working' },
  { id: 'mascot', labelKey: 'voice.mascotVoice' }
];

export default function VoicePicker({ onClose }) {
  const { t, language } = useStudioLanguage();
  const lang = LANGUAGE_TO_BCP47[language] || 'en-CA';
  const [voices, setVoices] = useState([]);
  const [picks, setPicks] = useState({
    assistant: getVoiceOverride('assistant') || '',
    mascot: getVoiceOverride('mascot') || ''
  });

  useEffect(() => {
    whenVoicesReady().then(() => setVoices(getVoicesForPicker(lang)));
  }, [lang]);

  const choose = (profile, name) => {
    setVoiceOverride(profile, name || null);
    setPicks((prev) => ({ ...prev, [profile]: name }));
  };

  return (
    <div className="tour-menu below voice-picker" role="dialog" aria-label={t('voice.settings')}>
      <div className="voice-picker-head">
        <span>{t('voice.settings')}</span>
        <button type="button" onClick={onClose} aria-label={t('voice.close')}>
          <X className="h-4 w-4" />
        </button>
      </div>
      <p className="voice-picker-hint">{t('voice.hint')}</p>
      {PROFILES.map(({ id, labelKey }) => (
        <div key={id} className="voice-picker-row">
          <label className="voice-picker-label" htmlFor={`voice-${id}`}>{t(labelKey)}</label>
          <select
            id={`voice-${id}`}
            value={picks[id]}
            onChange={(e) => choose(id, e.target.value)}
          >
            <option value="">{t('voice.auto')}</option>
            {voices.map((voice) => (
              <option key={voice.name} value={voice.name}>{voice.name}</option>
            ))}
          </select>
          <button
            type="button"
            className="voice-preview"
            onClick={() => speak(t('voice.sample'), { lang, profile: id })}
          >
            <Volume2 className="h-3.5 w-3.5" /> {t('voice.preview')}
          </button>
        </div>
      ))}
    </div>
  );
}
