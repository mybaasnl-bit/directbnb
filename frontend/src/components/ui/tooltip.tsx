'use client';

import { type ReactNode } from 'react';

interface TooltipProps {
  content: string;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export function Tooltip({ content, children, position = 'top', className }: TooltipProps) {
  const pos = {
    top: 'bottom-full mb-2 left-1/2 -translate-x-1/2',
    bottom: 'top-full mt-2 left-1/2 -translate-x-1/2',
    left: 'right-full mr-2 top-1/2 -translate-y-1/2',
    right: 'left-full ml-2 top-1/2 -translate-y-1/2',
  }[position];

  const arrow = {
    top: 'top-full left-1/2 -translate-x-1/2 -mt-0.5',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 mb-[-3px]',
    left: 'left-full top-1/2 -translate-y-1/2 ml-[-3px]',
    right: 'right-full top-1/2 -translate-y-1/2 mr-[-3px]',
  }[position];

  return (
    <div className={`relative group inline-flex ${className ?? ''}`}>
      {children}
      <div
        className={`pointer-events-none absolute z-[9999] px-2.5 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg max-w-[220px] text-center leading-snug break-words opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-lg ${pos}`}
        role="tooltip"
      >
        {content}
        <span className={`absolute w-2 h-2 bg-slate-900 rotate-45 ${arrow}`} />
      </div>
    </div>
  );
}
