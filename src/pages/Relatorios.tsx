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
import { parseDateWithoutTimezone } from '@/lib/dateUtils';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

  const selectedStoreName = storeFilter === 'all' 
    ? 'Todas as lojas' 
    : stores?.find(s => s.id === storeFilter)?.name || 'Loja selecionada';

  const handleExport = () => {
    if (filteredClosings.length === 0) {
      toast.error('Nenhum fechamento para exportar!');
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Relatório de Fechamentos', pageWidth / 2, 20, { align: 'center' });

    // Period and filter info
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Período: ${format(dateRange.from, 'dd/MM/yyyy')} a ${format(dateRange.to, 'dd/MM/yyyy')}`, 14, 35);
    doc.text(`Loja: ${selectedStoreName}`, 14, 42);
    doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 49);

    // Summary section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumo', 14, 62);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const summaryData = [
      ['Total Esperado', formatCurrency(totalExpected)],
      ['Total Contado', formatCurrency(totalCounted)],
      ['Diferença Total', formatCurrency(totalDifference)],
      ['Total de Fechamentos', filteredClosings.length.toString()],
      ['Fechamentos OK/Aprovados', okCount.toString()],
      ['Fechamentos com Atenção', attentionCount.toString()],
    ];

    autoTable(doc, {
      startY: 67,
      head: [],
      body: summaryData,
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 }, 1: { cellWidth: 50 } },
      margin: { left: 14 },
    });

    // Detailed table
    const finalY = (doc as any).lastAutoTable?.finalY || 100;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Detalhamento', 14, finalY + 15);

    const tableData = filteredClosings.map((closing) => [
      format(parseDateWithoutTimezone(closing.date), 'dd/MM/yyyy'),
      closing.stores?.name || '-',
      formatCurrency(Number(closing.expected_value)),
      formatCurrency(Number(closing.counted_value)),
      formatCurrency(Number(closing.difference)),
      statusConfig[closing.status]?.label || closing.status,
    ]);

    autoTable(doc, {
      startY: finalY + 20,
      head: [['Data', 'Loja', 'Esperado', 'Contado', 'Diferença', 'Status']],
      body: tableData,
      theme: 'striped',
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [45, 45, 45], textColor: 255, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 35 },
        2: { cellWidth: 30, halign: 'right' },
        3: { cellWidth: 30, halign: 'right' },
        4: { cellWidth: 30, halign: 'right' },
        5: { cellWidth: 25, halign: 'center' },
      },
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Página ${i} de ${pageCount}`, pageWidth - 14, doc.internal.pageSize.getHeight() - 10, { align: 'right' });
    }

    const fileName = `relatorio_fechamentos_${format(dateRange.from, 'dd-MM-yyyy')}_a_${format(dateRange.to, 'dd-MM-yyyy')}.pdf`;
    doc.save(fileName);
    toast.success('Relatório PDF exportado com sucesso!');
  };

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
                      <TableCell className="font-medium">{format(parseDateWithoutTimezone(closing.date), "dd/MM/yyyy")}</TableCell>
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
