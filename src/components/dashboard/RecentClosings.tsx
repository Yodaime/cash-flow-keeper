import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { CashClosing } from '@/types';
import { cn } from '@/lib/utils';
import { CheckCircle2, AlertTriangle, Clock, Shield } from 'lucide-react';

interface RecentClosingsProps {
  closings: CashClosing[];
}

const statusConfig = {
  ok: { label: 'OK', variant: 'success' as const, icon: CheckCircle2 },
  atencao: { label: 'Atenção', variant: 'warning' as const, icon: AlertTriangle },
  pendente: { label: 'Pendente', variant: 'pending' as const, icon: Clock },
  aprovado: { label: 'Aprovado', variant: 'success' as const, icon: Shield },
};

export function RecentClosings({ closings }: RecentClosingsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="rounded-xl border bg-card shadow-soft">
      <div className="border-b p-6">
        <h3 className="font-display text-lg font-semibold">Fechamentos Recentes</h3>
        <p className="text-sm text-muted-foreground mt-1">Últimos fechamentos registrados</p>
      </div>
      <div className="divide-y">
        {closings.slice(0, 5).map((closing, index) => {
          const status = statusConfig[closing.status];
          const StatusIcon = status.icon;
          
          return (
            <div 
              key={closing.id} 
              className={cn(
                "flex items-center justify-between p-4 transition-colors hover:bg-muted/50",
                "animate-fade-in"
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "rounded-lg p-2",
                  closing.status === 'ok' || closing.status === 'aprovado' ? "bg-success/10" : 
                  closing.status === 'atencao' ? "bg-warning/10" : "bg-muted"
                )}>
                  <StatusIcon className={cn(
                    "h-4 w-4",
                    closing.status === 'ok' || closing.status === 'aprovado' ? "text-success" : 
                    closing.status === 'atencao' ? "text-warning" : "text-muted-foreground"
                  )} />
                </div>
                <div>
                  <p className="font-medium">{closing.storeName}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(closing.date, "dd 'de' MMM", { locale: ptBR })} • {closing.createdByName}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-medium">{formatCurrency(closing.countedValue)}</p>
                  {closing.difference !== 0 && (
                    <p className={cn(
                      "text-sm",
                      closing.difference > 0 ? "text-success" : "text-destructive"
                    )}>
                      {closing.difference > 0 ? '+' : ''}{formatCurrency(closing.difference)}
                    </p>
                  )}
                </div>
                <Badge variant={status.variant}>{status.label}</Badge>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
