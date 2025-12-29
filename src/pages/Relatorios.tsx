import { useState } from 'react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Download, FileText, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useClosings } from '@/hooks/useClosings';
import { useStores } from '@/hooks/useStores';
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

  const { data: stores } = useStores();
  const { data: closings, isLoading } = useClosings({
    storeId: storeFilter !== 'all' ? storeFilter : undefined,
    startDate: format(dateRange.from, 'yyyy-MM-dd'),
    endDate: format(dateRange.to, 'yyyy-MM-dd'),
  });

  const filteredClosings = closings || [];
  const totalExpected = filteredClosings.reduce((acc, c) => acc + Number(c.expected_value), 0);
  const totalCounted = filteredClosings.reduce((acc, c) => acc + Number(c.counted_value), 0);
  const totalDifference = totalCounted - totalExpected;
  const okCount = filteredClosings.filter(c => c.status === 'ok' || c.status === 'aprovado').length;
  const attentionCount = filteredClosings.filter(c => c.status === 'atencao').length;

  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  const handleExport = () => toast.success('Relatório exportado!');

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">Relatórios</h1>
            <p className="text-muted-foreground mt-1">Visualize e exporte relatórios</p>
          </div>
          <Button variant="gold" className="gap-2" onClick={handleExport}><Download className="h-4 w-4" />Exportar PDF</Button>
        </div>

        <div className="flex flex-wrap items-center gap-3 p-4 rounded-lg bg-muted/50">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start text-left font-normal bg-background">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(dateRange.from, "dd/MM/yyyy")} - {format(dateRange.to, "dd/MM/yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="range" defaultMonth={dateRange.from} selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) => { if (range?.from && range?.to) setDateRange({ from: range.from, to: range.to }); }}
                numberOfMonths={2} locale={ptBR} />
            </PopoverContent>
          </Popover>
          <Select value={storeFilter} onValueChange={setStoreFilter}>
            <SelectTrigger className="w-[180px] bg-background"><SelectValue placeholder="Todas as lojas" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as lojas</SelectItem>
              {stores?.map((store) => (<SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border bg-card p-4 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-gold flex items-center justify-center"><TrendingUp className="h-5 w-5 text-primary" /></div>
              <div><p className="text-sm text-muted-foreground">Total Esperado</p><p className="text-xl font-bold">{formatCurrency(totalExpected)}</p></div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center"><TrendingUp className="h-5 w-5 text-muted-foreground" /></div>
              <div><p className="text-sm text-muted-foreground">Total Contado</p><p className="text-xl font-bold">{formatCurrency(totalCounted)}</p></div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center"><CheckCircle className="h-5 w-5 text-success" /></div>
              <div><p className="text-sm text-muted-foreground">Fechamentos OK</p><p className="text-xl font-bold">{okCount}</p></div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center"><AlertTriangle className="h-5 w-5 text-warning" /></div>
              <div><p className="text-sm text-muted-foreground">Requer Atenção</p><p className="text-xl font-bold">{attentionCount}</p></div>
            </div>
          </div>
        </div>

        <div className={cn("rounded-xl border p-6 shadow-soft", totalDifference >= 0 ? "bg-success/5 border-success/20" : "bg-destructive/5 border-destructive/20")}>
          <div className="flex items-center justify-between">
            <div><p className="text-sm font-medium text-muted-foreground">Diferença Total no Período</p>
              <p className={cn("text-3xl font-bold font-display mt-1", totalDifference >= 0 ? "text-success" : "text-destructive")}>{totalDifference >= 0 ? '+' : ''}{formatCurrency(totalDifference)}</p>
            </div>
            <div className="text-right"><p className="text-sm text-muted-foreground">Fechamentos analisados</p><p className="text-2xl font-bold">{filteredClosings.length}</p></div>
          </div>
        </div>

        {isLoading ? <Skeleton className="h-64" /> : (
          <div className="rounded-xl border bg-card shadow-soft overflow-hidden">
            <div className="border-b p-4"><h3 className="font-display text-lg font-semibold">Detalhamento</h3></div>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Data</TableHead><TableHead>Loja</TableHead><TableHead className="text-right">Esperado</TableHead>
                  <TableHead className="text-right">Contado</TableHead><TableHead className="text-right">Diferença</TableHead><TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClosings.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum fechamento encontrado.</TableCell></TableRow>
                ) : filteredClosings.map((closing) => {
                  const status = statusConfig[closing.status];
                  return (
                    <TableRow key={closing.id}>
                      <TableCell className="font-medium">{format(new Date(closing.date), "dd/MM/yyyy")}</TableCell>
                      <TableCell>{closing.stores?.name || '-'}</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(Number(closing.expected_value))}</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(Number(closing.counted_value))}</TableCell>
                      <TableCell className={cn("text-right font-mono font-medium", Number(closing.difference) > 0 && "text-success", Number(closing.difference) < 0 && "text-destructive")}>{Number(closing.difference) >= 0 ? '+' : ''}{formatCurrency(Number(closing.difference))}</TableCell>
                      <TableCell><Badge variant={status.variant}>{status.label}</Badge></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </Layout>
  );
}
