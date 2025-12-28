import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: {
    value: number;
    label: string;
  };
  variant?: 'default' | 'success' | 'warning' | 'gold';
}

export function StatsCard({ title, value, subtitle, icon, trend, variant = 'default' }: StatsCardProps) {
  return (
    <div className={cn(
      "relative overflow-hidden rounded-xl border bg-card p-6 shadow-soft transition-all duration-200 hover:shadow-lg",
      variant === 'gold' && "border-secondary/20 bg-gradient-to-br from-secondary/5 to-transparent"
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold tracking-tight font-display">{value}</p>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1">
              <span className={cn(
                "text-xs font-medium",
                trend.value >= 0 ? "text-success" : "text-destructive"
              )}>
                {trend.value >= 0 ? '+' : ''}{trend.value}%
              </span>
              <span className="text-xs text-muted-foreground">{trend.label}</span>
            </div>
          )}
        </div>
        <div className={cn(
          "rounded-lg p-3",
          variant === 'default' && "bg-muted",
          variant === 'success' && "bg-success/10 text-success",
          variant === 'warning' && "bg-warning/10 text-warning",
          variant === 'gold' && "bg-gradient-gold text-primary shadow-gold"
        )}>
          {icon}
        </div>
      </div>
    </div>
  );
}
