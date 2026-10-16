import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const DISTANCES = [
  { value: 0, label: 'Anywhere' },
  { value: 10, label: '10 km' },
  { value: 25, label: '25 km' },
  { value: 50, label: '50 km' },
  { value: 100, label: '100 km' }
];

const PERIODS = [
  { value: 'year', label: 'per year' },
  { value: 'hour', label: 'per hour' }
];

export const pillClass = (active) =>
  `inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] transition-colors ${
    active
      ? 'border-primary/30 bg-primary/10 font-medium text-primary'
      : 'border-border/70 text-muted-foreground hover:text-foreground'
  }`;

// The extra limits on a search: how far from the place, and the least pay worth seeing.
export default function JobSearchFilters({ distance, onDistance, pay, onPay, period, onPeriod, disabled }) {
  return (
    <div className="grid gap-3 border-t border-border/70 pt-4 sm:grid-cols-2">
      <div>
        <Label className="eyebrow">Distance from the place</Label>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {DISTANCES.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => onDistance(item.value)}
              disabled={disabled}
              className={pillClass(item.value === distance)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="min-pay" className="eyebrow">
          Pay at least
        </Label>
        <div className="mt-2 flex flex-wrap gap-2">
          <Input
            id="min-pay"
            inputMode="numeric"
            value={pay}
            onChange={(event) => onPay(event.target.value.replace(/[^0-9]/g, ''))}
            placeholder="e.g. 60000 — blank for any pay"
            className="sm:w-[210px]"
            disabled={disabled}
          />
          <div className="flex gap-1.5">
            {PERIODS.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => onPeriod(item.value)}
                disabled={disabled}
                className={pillClass(item.value === period)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}