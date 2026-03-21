import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: 'indigo' | 'blue' | 'purple' | 'amber' | 'green' | 'emerald';
  highlight?: boolean;
}

const colorMap = {
  indigo: 'bg-indigo-50 text-indigo-600',
  blue: 'bg-blue-50 text-blue-600',
  purple: 'bg-purple-50 text-purple-600',
  amber: 'bg-amber-50 text-amber-600',
  green: 'bg-green-50 text-green-600',
  emerald: 'bg-emerald-50 text-emerald-600',
};

export function StatsCard({ title, value, icon: Icon, color, highlight }: StatsCardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl border p-5 flex items-start gap-4 transition-all',
        highlight ? 'border-amber-300 ring-1 ring-amber-200' : 'border-slate-200',
      )}
    >
      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center shrink-0', colorMap[color])}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500 truncate">{title}</p>
        <p className="text-2xl font-bold text-slate-900 mt-0.5 leading-none">{value}</p>
      </div>
    </div>
  );
}
