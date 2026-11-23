import React from 'react';

interface BadgeProps {
  variant?: 'teal' | 'navy' | 'amber' | 'rose' | 'slate';
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'slate', children }) => {
  const styles: Record<NonNullable<BadgeProps['variant']>, string> = {
    teal: 'bg-teal-50 text-teal-700 border-teal-200',
    navy: 'bg-slate-100 text-[#142D4E] border-slate-300',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    slate: 'bg-slate-100 text-slate-600 border-slate-200'
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[variant]}`}
    >
      {children}
    </span>
  );
};
