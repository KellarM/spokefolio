import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import DictateButton from '@/components/common/DictateButton';
import { appendLine } from '@/hooks/useDictation';

export default function ReviewField({ label, value, onChange, list = false, rows = 3 }) {
  const text = list ? (value || []).join('\n') : value || '';
  const update = (next) => onChange(list ? next.split('\n') : next);

  return (
    <div className="block space-y-2 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-medium">
          {label}
          {list && <span className="ml-2 text-xs text-muted-foreground">One per line</span>}
        </span>
        <DictateButton label={null} onText={(transcript) => update(appendLine(text, transcript))} />
      </div>
      <Textarea
        value={text}
        rows={rows}
        onChange={(e) => update(e.target.value)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const passage = e.dataTransfer.getData('text/plain');
          if (passage) update([text, passage].filter(Boolean).join('\n'));
        }}
      />
    </div>
  );
}