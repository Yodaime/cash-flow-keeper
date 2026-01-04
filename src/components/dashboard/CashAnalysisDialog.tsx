import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useClosings } from '@/hooks/useClosings';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface CashAnalysisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CashAnalysisDialog({ open, onOpenChange }: CashAnalysisDialogProps) {
  const today = new Date();
  const monthStart = format(startOfMonth(today), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(today), 'yyyy-MM-dd');
  
  const { data: closings, isLoading } = useClosings({ startDate: monthStart, endDate: monthEnd });

  const stats = closings?.reduce(
    (acc, closing) => {
      const expected = Number(closing.expected_value);
      const counted = Number(closing.counted_value);
      const diff = Number(closing.difference);

      acc.totalExpected += expected;
      acc.totalCounted += counted;
      acc.totalDifference += diff;
      
      if (diff > 0) {
        acc.surplus += diff;
        acc.surplusCount++;
      } else if (diff < 0) {
        acc.deficit += Math.abs(diff);
        acc.deficitCount++;
      }
      
      if (closing.status === 'ok' || closing.status === 'aprovado') {
        acc.okCount++;
      } else if (closing.status === 'atencao') {
        acc.attentionCount++;
      } else if (closing.status === 'pendente') {
        acc.pendingCount++;
      }
      
      return acc;
    },
    {
      totalExpected: 0,
      totalCounted: 0,
      totalDifference: 0,
      surplus: 0,
      deficit: 0,
      surplusCount: 0,
      deficitCount: 0,
      okCount: 0,
      attentionCount: 0,
      pendingCount: 0,
    }
  ) || {
    totalExpected: 0,
    totalCounted: 0,
    totalDifference: 0,
    surplus: 0,
    deficit: 0,
    surplusCount: 0,
    deficitCount: 0,
    okCount: 0,
    attentionCount: 0,
    pendingCount: 0,
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const totalClosings = closings?.length || 0;
  const accuracyRate = totalClosings > 0 ? ((stats.okCount / totalClosings) * 100).toFixed(1) : '0';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px]">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            Análise do Caixa
          </DialogTitle>
          <DialogDescription>
            Resumo do período: {format(startOfMonth(today), "dd 'de' MMMM", { locale: ptBR })} a {format(today, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border bg-card p-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-sm">Valor Esperado</span>
                </div>
                <p className="text-2xl font-bold mt-1">{formatCurrency(stats.totalExpected)}</p>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-sm">Valor Contado</span>
                </div>
                <p className="text-2xl font-bold mt-1">{formatCurrency(stats.totalCounted)}</p>
              </div>
            </div>

            {/* Difference Summary */}
            <div className={cn(
              "rounded-lg p-4 border",
              stats.totalDifference >= 0 ? "bg-success/10 border-success/20" : "bg-destructive/10 border-destructive/20"
            )}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Diferença Total</p>
                  <p className={cn(
                    "text-3xl font-bold",
                    stats.totalDifference >= 0 ? "text-success" : "text-destructive"
                  )}>
                    {stats.totalDifference >= 0 ? '+' : ''}{formatCurrency(stats.totalDifference)}
                  </p>
                </div>
                <div className={cn(
                  "h-12 w-12 rounded-full flex items-center justify-center",
                  stats.totalDifference >= 0 ? "bg-success/20" : "bg-destructive/20"
                )}>
                  {stats.totalDifference >= 0 ? (
                    <TrendingUp className="h-6 w-6 text-success" />
                  ) : (
                    <TrendingDown className="h-6 w-6 text-destructive" />
                  )}
                </div>
              </div>
            </div>

            {/* Surplus and Deficit */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2 text-success">
                  <ArrowUpRight className="h-4 w-4" />
                  <span className="text-sm font-medium">Sobras</span>
                </div>
                <p className="text-xl font-bold mt-1">{formatCurrency(stats.surplus)}</p>
                <p className="text-xs text-muted-foreground mt-1">{stats.surplusCount} ocorrências</p>
              </div>
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2 text-destructive">
                  <ArrowDownRight className="h-4 w-4" />
                  <span className="text-sm font-medium">Faltas</span>
                </div>
                <p className="text-xl font-bold mt-1">{formatCurrency(stats.deficit)}</p>
                <p className="text-xs text-muted-foreground mt-1">{stats.deficitCount} ocorrências</p>
              </div>
            </div>

            {/* Status Summary */}
            <div className="rounded-lg border p-4">
              <p className="text-sm font-medium text-muted-foreground mb-3">Status dos Fechamentos</p>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-success">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-2xl font-bold">{stats.okCount}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">OK/Aprovado</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-warning">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-2xl font-bold">{stats.attentionCount}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Atenção</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground">
                    <span className="text-2xl font-bold">{stats.pendingCount}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Pendente</p>
                </div>
              </div>
            </div>

            {/* Accuracy Rate */}
            <div className="rounded-lg bg-primary/5 border border-primary/10 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Taxa de Precisão</p>
                  <p className="text-xs text-muted-foreground">Fechamentos OK ou Aprovados</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-primary">{accuracyRate}%</p>
                  <p className="text-xs text-muted-foreground">{stats.okCount} de {totalClosings}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
