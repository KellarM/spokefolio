import React from 'react';
import { extractSalary } from '@/lib/salary';

// The wage named in the posting, shown only when the posting names one.
export default function SalaryPill({ description }) {
  const salary = extractSalary(description);
  if (!salary) return null;
  return (
    <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-[12.5px] font-medium text-foreground/80">
      {salary}
    </span>
  );
}