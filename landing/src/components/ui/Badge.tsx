interface BadgeProps {
  children: React.ReactNode;
  variant?: 'brand' | 'dark' | 'light';
  className?: string;
}

export default function Badge({ children, variant = 'brand', className = '' }: BadgeProps) {
  const variants = {
    brand: 'bg-brand-500/10 text-brand-400 border border-brand-500/20',
    dark: 'bg-white/10 text-white border border-white/20',
    light: 'bg-slate-100 text-slate-600 border border-slate-200',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
