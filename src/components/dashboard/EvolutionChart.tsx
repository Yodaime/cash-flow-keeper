import { useMemo, useState } from 'react';
import { format, subDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TrendingUp, Calendar, Store } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useClosings } from '@/hooks/useClosings';
import { useStores } from '@/hooks/useStores';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

type DateRange = { from: Date | undefined; to: Date | undefined };

export function EvolutionChart() {
  const today = new Date();
  const [dateRange, setDateRange] = useState<DateRange>({
    from: today,
    to: today,
  });
  const [selectedStoreId, setSelectedStoreId] = useState<string>('all');

  const { data: stores } = useStores();

  const startDate = dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : format(today, 'yyyy-MM-dd');
  const endDate = dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : format(today, 'yyyy-MM-dd');
  
  const { data: closings, isLoading } = useClosings({ 
    startDate, 
    endDate,
    storeId: selectedStoreId !== 'all' ? selectedStoreId : undefined 
  });

  const selectedStoreName = useMemo(() => {
    if (selectedStoreId === 'all') return 'Todas as lojas';
    return stores?.find(s => s.id === selectedStoreId)?.name || 'Loja';
  }, [selectedStoreId, stores]);

  const getDateRangeLabel = () => {
    if (!dateRange.from) return 'Selecionar período';
    if (!dateRange.to || dateRange.from.getTime() === dateRange.to.getTime()) {
      return format(dateRange.from, "dd 'de' MMMM", { locale: ptBR });
    }
    return `${format(dateRange.from, 'dd/MM')} - ${format(dateRange.to, 'dd/MM', { locale: ptBR })}`;
  };

  const chartData = useMemo(() => {
    if (!closings) return [];

    // Group closings by date
    const groupedByDate = closings.reduce((acc, closing) => {
      const date = closing.date;
      if (!acc[date]) {
        acc[date] = { expected: 0, counted: 0, difference: 0 };
      }
      acc[date].expected += Number(closing.expected_value);
      acc[date].counted += Number(closing.counted_value);
      acc[date].difference += Number(closing.difference);
      return acc;
    }, {} as Record<string, { expected: number; counted: number; difference: number }>);

    // Create array sorted by date
    return Object.entries(groupedByDate)
      .map(([date, values]) => ({
        date,
        label: format(parseISO(date), 'dd/MM', { locale: ptBR }),
        esperado: values.expected,
        contado: values.counted,
        diferenca: values.difference,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [closings]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(value);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px]" />
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Evolução do Caixa
          </CardTitle>
          <CardDescription>Últimos 15 dias</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            Nenhum dado disponível para o período
          </div>
        </CardContent>
      </Card>
    );
  }

  const presetRanges = [
    { label: 'Hoje', days: 0 },
    { label: '7 dias', days: 7 },
    { label: '15 dias', days: 15 },
    { label: '30 dias', days: 30 },
  ];

  const handlePresetClick = (days: number) => {
    if (days === 0) {
      setDateRange({ from: today, to: today });
    } else {
      setDateRange({ from: subDays(today, days - 1), to: today });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Evolução do Caixa
            </CardTitle>
            <CardDescription>
              {dateRange.from?.getTime() === dateRange.to?.getTime() 
                ? `Registros do dia - ${selectedStoreName}` 
                : `Comparativo - ${selectedStoreName}`}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <Select value={selectedStoreId} onValueChange={setSelectedStoreId}>
              <SelectTrigger className="w-[160px] h-8 text-xs">
                <Store className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Selecionar loja" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as lojas</SelectItem>
                {stores?.map((store) => (
                  <SelectItem key={store.id} value={store.id}>
                    {store.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-1">
              {presetRanges.map((preset) => (
                <Button
                  key={preset.label}
                  variant="outline"
                  size="sm"
                  className={cn(
                    "text-xs h-8",
                    preset.days === 0 && dateRange.from?.getTime() === today.getTime() && dateRange.to?.getTime() === today.getTime() && "bg-primary text-primary-foreground",
                    preset.days === 7 && dateRange.from?.getTime() === subDays(today, 6).getTime() && "bg-primary text-primary-foreground",
                    preset.days === 15 && dateRange.from?.getTime() === subDays(today, 14).getTime() && "bg-primary text-primary-foreground",
                    preset.days === 30 && dateRange.from?.getTime() === subDays(today, 29).getTime() && "bg-primary text-primary-foreground",
                  )}
                  onClick={() => handlePresetClick(preset.days)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  <Calendar className="h-4 w-4 mr-2" />
                  {getDateRangeLabel()}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <CalendarComponent
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange.from}
                  selected={{ from: dateRange.from, to: dateRange.to }}
                  onSelect={(range) => setDateRange({ from: range?.from, to: range?.to || range?.from })}
                  numberOfMonths={2}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorEsperado" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorContado" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="label" 
              className="text-xs fill-muted-foreground"
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              className="text-xs fill-muted-foreground"
              tickFormatter={formatCurrency}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
              formatter={(value: number, name: string) => [
                new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value),
                name === 'esperado' ? 'Esperado' : 'Contado'
              ]}
            />
            <Area
              type="monotone"
              dataKey="esperado"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorEsperado)"
            />
            <Area
              type="monotone"
              dataKey="contado"
              stroke="hsl(var(--success))"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorContado)"
            />
          </AreaChart>
        </ResponsiveContainer>
        <div className="flex items-center justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-muted-foreground">Valor Esperado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-success" />
            <span className="text-muted-foreground">Valor Contado</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
