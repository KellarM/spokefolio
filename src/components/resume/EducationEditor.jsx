import React from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function EducationEditor({
  items = [],
  onChange,
  degreeClass = 'quiet-field font-medium',
  metaClass = 'quiet-field text-[13px]'
}) {
  const update = (index, patch) => {
    const next = [...items];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };

  const remove = (index) => onChange(items.filter((_, i) => i !== index));

  const add = () => onChange([...items, { degree: '', institution: '', dates: '', detail: '' }]);

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={index} className="rounded-xl border border-border/60 bg-background/40 px-4 py-4">
          <div className="flex items-start gap-3">
            <div className="grid flex-1 gap-3 sm:grid-cols-2">
              <Input
                value={item.degree || ''}
                onChange={(event) => update(index, { degree: event.target.value })}
                placeholder="Degree or programme"
                className={degreeClass}
              />
              <Input
                value={item.institution || ''}
                onChange={(event) => update(index, { institution: event.target.value })}
                placeholder="Institution"
                className={degreeClass}
              />
              <Input
                value={item.dates || ''}
                onChange={(event) => update(index, { dates: event.target.value })}
                placeholder="Dates"
                className={metaClass}
              />
              <Input
                value={item.detail || ''}
                onChange={(event) => update(index, { detail: event.target.value })}
                placeholder="Honours, focus, notes"
                className={metaClass}
              />
            </div>
            <button
              type="button"
              onClick={() => remove(index)}
              className="mt-1 rounded-md p-1 text-muted-foreground transition-colors hover:text-destructive"
              aria-label="Remove education"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ))}

      <Button variant="secondary" size="sm" className="rounded-full" onClick={add}>
        <Plus className="mr-2 h-3.5 w-3.5" /> Add education
      </Button>
    </div>
  );
}