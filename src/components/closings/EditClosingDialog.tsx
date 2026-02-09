import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { cn } from '@/lib/utils';
import { useStores } from '@/hooks/useStores';
import { CashClosing, useUpdateClosing } from '@/hooks/useClosings';

interface EditClosingDialogProps {
  closing: CashClosing | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditClosingDialog({ closing, open, onOpenChange }: EditClosingDialogProps) {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [storeId, setStoreId] = useState('');
  const [initialValue, setInitialValue] = useState('');
  const [expectedValue, setExpectedValue] = useState('');
  const [countedValue, setCountedValue] = useState('');
  const [observations, setObservations] = useState('');

  const { data: stores } = useStores();
  const updateClosing = useUpdateClosing();

  useEffect(() => {
    if (closing) {
      setDate(new Date(closing.date));
      setStoreId(closing.store_id);
      setInitialValue(closing.initial_value?.toString() || '0');
      setExpectedValue(closing.expected_value.toString());
      setCountedValue(closing.counted_value.toString());
      setObservations(closing.observations || '');
    }
  }, [closing]);

  const formatCurrencyInput = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    const amount = parseInt(numbers || '0', 10) / 100;
    return amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const parseCurrencyValue = (value: string): number => {
    return parseFloat(value.replace(/\./g, '').replace(',', '.')) || 0;
  };

  const handleExpectedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setExpectedValue(formatCurrencyInput(e.target.value));
  };

  const handleCountedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCountedValue(formatCurrencyInput(e.target.value));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!closing || !date || !storeId) return;

    const expected = parseCurrencyValue(expectedValue);
    const counted = parseCurrencyValue(countedValue);

    updateClosing.mutate({
      id: closing.id,
      store_id: storeId,
      date: format(date, 'yyyy-MM-dd'),
      initial_value: parseCurrencyValue(initialValue),
      expected_value: expected,
      counted_value: counted,
      observations: observations.trim() || null,
    }, {
      onSuccess: () => {
        onOpenChange(false);
      }
    });
  };

  const difference = parseCurrencyValue(countedValue) - parseCurrencyValue(expectedValue);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Editar Fechamento</DialogTitle>
          <DialogDescription>Altere os dados do fechamento de caixa.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !date && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecione'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    locale={ptBR}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Loja</Label>
              <Select value={storeId} onValueChange={setStoreId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {stores?.map((store) => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Valor Inicial</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                <Input
                  className="pl-10 text-right font-mono"
                  value={initialValue}
                  onChange={(e) => setInitialValue(formatCurrencyInput(e.target.value))}
                  placeholder="0,00"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Valor Esperado</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                <Input
                  className="pl-10 text-right font-mono"
                  value={expectedValue}
                  onChange={handleExpectedChange}
                  placeholder="0,00"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Valor Contado</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                <Input
                  className="pl-10 text-right font-mono"
                  value={countedValue}
                  onChange={handleCountedChange}
                  placeholder="0,00"
                />
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-4 bg-muted/50">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Diferença</span>
              <span className={cn(
                "font-mono font-medium",
                difference > 0 && "text-success",
                difference < 0 && "text-destructive"
              )}>
                {difference >= 0 ? '+' : ''}R$ {difference.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Observações do fechamento..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={updateClosing.isPending}>
              {updateClosing.isPending ? 'Salvando...' : 'Salvar alterações'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}