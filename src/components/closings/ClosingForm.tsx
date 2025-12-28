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
import { mockStores, TOLERANCE_LIMIT } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ClosingFormProps {
  onSuccess?: () => void;
}

export function ClosingForm({ onSuccess }: ClosingFormProps) {
  const [date, setDate] = useState<Date>(new Date());
  const [storeId, setStoreId] = useState<string>('');
  const [expectedValue, setExpectedValue] = useState<string>('');
  const [countedValue, setCountedValue] = useState<string>('');
  const [observations, setObservations] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const status = Math.abs(difference) <= TOLERANCE_LIMIT ? 'ok' : 'atencao';
    
    toast.success('Fechamento registrado com sucesso!', {
      description: status === 'ok' 
        ? 'O caixa está conferido.' 
        : `Atenção: diferença de R$ ${Math.abs(difference).toFixed(2)}`,
    });
    
    setIsSubmitting(false);
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Data */}
        <div className="space-y-2">
          <Label htmlFor="date">Data do Fechamento</Label>
          <Popover>
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
                onSelect={(d) => d && setDate(d)}
                initialFocus
                locale={ptBR}
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
              <SelectValue placeholder="Selecione a loja" />
            </SelectTrigger>
            <SelectContent>
              {mockStores.map((store) => (
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
        <Textarea
          id="observations"
          placeholder="Adicione observações sobre o fechamento..."
          value={observations}
          onChange={(e) => setObservations(e.target.value)}
          rows={3}
        />
      </div>

      <Button type="submit" variant="gold" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
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
