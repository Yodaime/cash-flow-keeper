import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Store, DollarSign, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useStores } from '@/hooks/useStores';
import { useCreateClosing } from '@/hooks/useClosings';
import { cn } from '@/lib/utils';

const TOLERANCE_LIMIT = 10;

const PREDEFINED_OBSERVATIONS = [
  'Fechamento dentro do esperado',
  'Troco conferido e correto',
  'Sem movimentação atípica',
];

interface ClosingFormProps {
  onSuccess?: () => void;
}

export function ClosingForm({ onSuccess }: ClosingFormProps) {
  const [date, setDate] = useState<Date>(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [storeId, setStoreId] = useState<string>('');
  const [expectedValue, setExpectedValue] = useState<string>('');
  const [countedValue, setCountedValue] = useState<string>('');
  const [observations, setObservations] = useState<string>('');
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const { data: stores, isLoading: storesLoading } = useStores();
  const createClosing = useCreateClosing();

  const parseValue = (value: string): number => {
    const cleaned = value.replace(/[^\d,]/g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
  };

  const difference = parseValue(countedValue) - parseValue(expectedValue);
  const hasWarning = Math.abs(difference) > TOLERANCE_LIMIT;

  const formatInputCurrency = (value: string): string => {
    const numbers = value.replace(/\D/g, '');
    const amount = parseInt(numbers) / 100;
    if (isNaN(amount)) return '';
    return amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!storeId || !expectedValue || !countedValue) {
      return;
    }

    await createClosing.mutateAsync({
      store_id: storeId,
      date: format(date, 'yyyy-MM-dd'),
      expected_value: parseValue(expectedValue),
      counted_value: parseValue(countedValue),
      observations: observations || undefined,
    });
    
    // Reset form
    setStoreId('');
    setExpectedValue('');
    setCountedValue('');
    setObservations('');
    setSelectedPreset(null);
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Data */}
        <div className="space-y-2">
          <Label htmlFor="date">Data do Fechamento</Label>
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : "Selecione a data"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => {
                  if (d) {
                    setDate(d);
                    setCalendarOpen(false);
                  }
                }}
                initialFocus
                locale={ptBR}
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Loja */}
        <div className="space-y-2">
          <Label htmlFor="store">Loja</Label>
          <Select value={storeId} onValueChange={setStoreId}>
            <SelectTrigger>
              <Store className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder={storesLoading ? "Carregando..." : "Selecione a loja"} />
            </SelectTrigger>
            <SelectContent>
              {stores?.map((store) => (
                <SelectItem key={store.id} value={store.id}>
                  {store.name} ({store.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Valor Esperado */}
        <div className="space-y-2">
          <Label htmlFor="expectedValue">Valor Esperado (Vendas do Dia)</Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="expectedValue"
              placeholder="0,00"
              value={expectedValue}
              onChange={(e) => setExpectedValue(formatInputCurrency(e.target.value))}
              className="pl-10"
            />
          </div>
        </div>

        {/* Valor Contado */}
        <div className="space-y-2">
          <Label htmlFor="countedValue">Valor Contado em Caixa</Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="countedValue"
              placeholder="0,00"
              value={countedValue}
              onChange={(e) => setCountedValue(formatInputCurrency(e.target.value))}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Diferença */}
      {(expectedValue || countedValue) && (
        <div className={cn(
          "rounded-lg p-4 transition-all duration-200",
          hasWarning ? "bg-warning/10 border border-warning/20" : "bg-success/10 border border-success/20"
        )}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Diferença Calculada</span>
            <span className={cn(
              "text-lg font-bold",
              hasWarning ? "text-warning" : "text-success"
            )}>
              {difference >= 0 ? '+' : ''}R$ {difference.toFixed(2).replace('.', ',')}
            </span>
          </div>
          {hasWarning && (
            <p className="mt-2 text-sm text-warning">
              Atenção: A diferença excede o limite de tolerância de R$ {TOLERANCE_LIMIT.toFixed(2).replace('.', ',')}.
            </p>
          )}
        </div>
      )}

      {/* Observações */}
      <div className="space-y-2">
        <Label htmlFor="observations" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Observações (opcional)
        </Label>
        
        {/* Predefined Options */}
        {!selectedPreset && (
          <div className="flex flex-wrap gap-2 mb-2">
            {PREDEFINED_OBSERVATIONS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setSelectedPreset(preset);
                  setObservations(preset);
                }}
                className="px-3 py-1.5 text-sm rounded-md border border-border/50 bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
              >
                {preset}
              </button>
            ))}
          </div>
        )}
        
        {selectedPreset && (
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1.5 text-sm rounded-md bg-primary/10 text-primary border border-primary/20">
              {selectedPreset}
            </span>
            <button
              type="button"
              onClick={() => {
                setSelectedPreset(null);
                setObservations('');
              }}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              Limpar
            </button>
          </div>
        )}
        
        <Textarea
          id="observations"
          placeholder={selectedPreset ? "Adicione mais detalhes (opcional)..." : "Adicione observações sobre o fechamento..."}
          value={selectedPreset ? observations.replace(selectedPreset, '').trim() : observations}
          onChange={(e) => {
            if (selectedPreset) {
              const additionalText = e.target.value.trim();
              setObservations(additionalText ? `${selectedPreset}. ${additionalText}` : selectedPreset);
            } else {
              setObservations(e.target.value);
            }
          }}
          rows={2}
        />
      </div>

      <Button type="submit" variant="gold" size="lg" className="w-full" disabled={createClosing.isPending}>
        {createClosing.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Registrando...
          </>
        ) : (
          'Registrar Fechamento'
        )}
      </Button>
    </form>
  );
}
