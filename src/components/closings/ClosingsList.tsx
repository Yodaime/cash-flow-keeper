import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle2, AlertTriangle, Clock, Shield, MoreHorizontal, Eye, CheckCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CashClosing } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ClosingsListProps {
  closings: CashClosing[];
}

const statusConfig = {
  ok: { label: 'OK', variant: 'success' as const, icon: CheckCircle2 },
  atencao: { label: 'Atenção', variant: 'warning' as const, icon: AlertTriangle },
  pendente: { label: 'Pendente', variant: 'pending' as const, icon: Clock },
  aprovado: { label: 'Aprovado', variant: 'success' as const, icon: Shield },
};

export function ClosingsList({ closings }: ClosingsListProps) {
  const [items, setItems] = useState(closings);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleApprove = (id: string) => {
    setItems(items.map(item => 
      item.id === id 
        ? { ...item, status: 'aprovado' as const, validatedBy: '4', validatedByName: 'Roberto Costa', validatedAt: new Date() }
        : item
    ));
    toast.success('Fechamento aprovado com sucesso!');
  };

  return (
    <div className="rounded-xl border bg-card shadow-soft overflow-hidden">
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
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((closing, index) => {
            const status = statusConfig[closing.status];
            const StatusIcon = status.icon;

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
                  <Badge variant={status.variant} className="gap-1">
                    <StatusIcon className="h-3 w-3" />
                    {status.label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="text-sm">{closing.createdByName}</p>
                    {closing.validatedByName && (
                      <p className="text-xs text-muted-foreground">
                        Aprovado por {closing.validatedByName}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Eye className="mr-2 h-4 w-4" />
                        Ver detalhes
                      </DropdownMenuItem>
                      {(closing.status === 'ok' || closing.status === 'atencao') && (
                        <DropdownMenuItem onClick={() => handleApprove(closing.id)}>
                          <CheckCheck className="mr-2 h-4 w-4" />
                          Aprovar fechamento
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
