import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CheckCircle2, AlertTriangle, Clock, Shield, Loader2 } from 'lucide-react';
import { useClosings } from '@/hooks/useClosings';

const statusConfig = {
  ok: { label: 'OK', variant: 'success' as const, icon: CheckCircle2 },
  atencao: { label: 'Atenção', variant: 'warning' as const, icon: AlertTriangle },
  pendente: { label: 'Pendente', variant: 'pending' as const, icon: Clock },
  aprovado: { label: 'Aprovado', variant: 'success' as const, icon: Shield },
};

export function RecentClosings() {
  const { data: closings, isLoading } = useClosings();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card shadow-soft p-8 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!closings || closings.length === 0) {
    return (
      <div className="rounded-xl border bg-card shadow-soft">
        <div className="border-b p-6">
          <h3 className="font-display text-lg font-semibold">Fechamentos Recentes</h3>
          <p className="text-sm text-muted-foreground mt-1">Últimos fechamentos registrados</p>
        </div>
        <div className="p-8 text-center text-muted-foreground">
          Nenhum fechamento registrado ainda.
        </div>
      </div>
    );
  }

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
                  <p className="font-medium">{closing.stores?.name || 'Loja'}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(closing.date), "dd 'de' MMM", { locale: ptBR })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-medium">{formatCurrency(Number(closing.counted_value))}</p>
                  {closing.difference !== 0 && (
                    <p className={cn(
                      "text-sm",
                      Number(closing.difference) > 0 ? "text-success" : "text-destructive"
                    )}>
                      {Number(closing.difference) > 0 ? '+' : ''}{formatCurrency(Number(closing.difference))}
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
