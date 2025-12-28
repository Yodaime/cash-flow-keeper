import { useState } from 'react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Download, FileText, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { mockClosings, mockStores } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const statusConfig = {
  ok: { label: 'OK', variant: 'success' as const },
  atencao: { label: 'Atenção', variant: 'warning' as const },
  pendente: { label: 'Pendente', variant: 'pending' as const },
  aprovado: { label: 'Aprovado', variant: 'success' as const },
};

export default function Relatorios() {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 7),
    to: new Date(),
  });
  const [storeFilter, setStoreFilter] = useState<string>('all');

  const filteredClosings = mockClosings.filter(closing => {
    const closingDate = startOfDay(closing.date);
    const isInRange = closingDate >= startOfDay(dateRange.from) && closingDate <= endOfDay(dateRange.to);
    const matchesStore = storeFilter === 'all' || closing.storeId === storeFilter;
    return isInRange && matchesStore;
  });

  const totalExpected = filteredClosings.reduce((acc, c) => acc + c.expectedValue, 0);
  const totalCounted = filteredClosings.reduce((acc, c) => acc + c.countedValue, 0);
  const totalDifference = totalCounted - totalExpected;
  const okCount = filteredClosings.filter(c => c.status === 'ok' || c.status === 'aprovado').length;
  const attentionCount = filteredClosings.filter(c => c.status === 'atencao').length;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleExport = () => {
    toast.success('Relatório exportado com sucesso!', {
      description: 'O arquivo PDF foi gerado e está pronto para download.',
    });
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">Relatórios</h1>
            <p className="text-muted-foreground mt-1">
              Visualize e exporte relatórios de fechamento
            </p>
          </div>
          <Button variant="gold" className="gap-2" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Exportar PDF
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 p-4 rounded-lg bg-muted/50">
          <FileText className="h-4 w-4 text-muted-foreground" />
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start text-left font-normal bg-background">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} - {format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange.from}
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) => {
                  if (range?.from && range?.to) {
                    setDateRange({ from: range.from, to: range.to });
                  }
                }}
                numberOfMonths={2}
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>

          <Select value={storeFilter} onValueChange={setStoreFilter}>
            <SelectTrigger className="w-[180px] bg-background">
              <SelectValue placeholder="Todas as lojas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as lojas</SelectItem>
              {mockStores.map((store) => (
                <SelectItem key={store.id} value={store.id}>
                  {store.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border bg-card p-4 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-gold flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Esperado</p>
                <p className="text-xl font-bold">{formatCurrency(totalExpected)}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Contado</p>
                <p className="text-xl font-bold">{formatCurrency(totalCounted)}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fechamentos OK</p>
                <p className="text-xl font-bold">{okCount}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Requer Atenção</p>
                <p className="text-xl font-bold">{attentionCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Difference Summary */}
        <div className={cn(
          "rounded-xl border p-6 shadow-soft",
          totalDifference >= 0 ? "bg-success/5 border-success/20" : "bg-destructive/5 border-destructive/20"
        )}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Diferença Total no Período</p>
              <p className={cn(
                "text-3xl font-bold font-display mt-1",
                totalDifference >= 0 ? "text-success" : "text-destructive"
              )}>
                {totalDifference >= 0 ? '+' : ''}{formatCurrency(totalDifference)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Fechamentos analisados</p>
              <p className="text-2xl font-bold">{filteredClosings.length}</p>
            </div>
          </div>
        </div>

        {/* Detailed Table */}
        <div className="rounded-xl border bg-card shadow-soft overflow-hidden">
          <div className="border-b p-4">
            <h3 className="font-display text-lg font-semibold">Detalhamento</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Data</TableHead>
                <TableHead>Loja</TableHead>
                <TableHead className="text-right">Esperado</TableHead>
                <TableHead className="text-right">Contado</TableHead>
                <TableHead className="text-right">Diferença</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Responsável</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClosings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhum fechamento encontrado no período selecionado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredClosings.map((closing, index) => {
                  const status = statusConfig[closing.status];
                  return (
                    <TableRow 
                      key={closing.id}
                      className="animate-fade-in"
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <TableCell className="font-medium">
                        {format(closing.date, "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell>{closing.storeName}</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(closing.expectedValue)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(closing.countedValue)}
                      </TableCell>
                      <TableCell className={cn(
                        "text-right font-mono font-medium",
                        closing.difference > 0 && "text-success",
                        closing.difference < 0 && "text-destructive"
                      )}>
                        {closing.difference >= 0 ? '+' : ''}{formatCurrency(closing.difference)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                      <TableCell>{closing.createdByName}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </Layout>
  );
}
