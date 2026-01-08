import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CashClosing, useDeleteClosing } from '@/hooks/useClosings';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DeleteClosingDialogProps {
  closing: CashClosing | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteClosingDialog({ closing, open, onOpenChange }: DeleteClosingDialogProps) {
  const deleteClosing = useDeleteClosing();

  const handleDelete = () => {
    if (!closing) return;
    
    deleteClosing.mutate(closing.id, {
      onSuccess: () => {
        onOpenChange(false);
      }
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  if (!closing) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <AlertDialogTitle>Remover Fechamento</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-3 pt-2">
            <p>Tem certeza que deseja remover este fechamento? Esta ação não pode ser desfeita.</p>
            <div className="rounded-lg border p-3 bg-muted/50 space-y-1">
              <p className="text-sm"><strong>Data:</strong> {format(new Date(closing.date), "dd/MM/yyyy", { locale: ptBR })}</p>
              <p className="text-sm"><strong>Loja:</strong> {closing.stores?.name || '-'}</p>
              <p className="text-sm"><strong>Valor esperado:</strong> {formatCurrency(Number(closing.expected_value))}</p>
              <p className="text-sm"><strong>Valor contado:</strong> {formatCurrency(Number(closing.counted_value))}</p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={deleteClosing.isPending}
          >
            {deleteClosing.isPending ? 'Removendo...' : 'Remover'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}