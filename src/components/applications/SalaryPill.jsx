import React from 'react';
import { extractSalary } from '@/lib/salary';

// The wage named in the posting, shown only when the posting names one.
export default function SalaryPill({ description }) {
  const salary = extractSalary(description);
  if (!salary) return null;
  return (
    <span className="inline-flex items-center rounded-full bg-secondary px-3 py-0.5 font-body text-[13.5px] font-semibold text-foreground/95">
      {salary}
    </span>
  );
}