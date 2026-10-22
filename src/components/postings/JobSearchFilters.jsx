import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useStudioLanguage } from '@/lib/StudioLanguage';

const DISTANCES = [0, 10, 25, 50, 100];
const PERIODS = ['year', 'hour'];

export const pillClass = (active) =>
  `inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] transition-colors ${
    active
      ? 'border-primary/30 bg-primary/10 font-medium text-primary'
      : 'border-border/70 text-muted-foreground hover:text-foreground'
  }`;

// The extra limits on a search: how far from the place, and the least pay worth seeing.
export default function JobSearchFilters({ distance, onDistance, pay, onPay, period, onPeriod, disabled }) {
  const { t } = useStudioLanguage();
  return (
    <div className="grid gap-3 border-t border-border/70 pt-4 sm:grid-cols-2">
      <div>
        <Label className="eyebrow">{t('postings.distanceFromPlace')}</Label>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {DISTANCES.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => onDistance(value)}
              disabled={disabled}
              className={pillClass(value === distance)}
            >
              {value === 0 ? t('postings.anywhere') : `${value} km`}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="min-pay" className="eyebrow">
          {t('postings.payAtLeast')}
        </Label>
        <div className="mt-2 flex flex-wrap gap-2">
          <Input
            id="min-pay"
            inputMode="numeric"
            value={pay}
            onChange={(event) => onPay(event.target.value.replace(/[^0-9]/g, ''))}
            placeholder={t('postings.payPlaceholder')}
            className="sm:w-[210px]"
            disabled={disabled}
          />
          <div className="flex gap-1.5">
            {PERIODS.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => onPeriod(value)}
                disabled={disabled}
                className={pillClass(value === period)}
              >
                {t(value === 'year' ? 'postings.perYear' : 'postings.perHour')}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
