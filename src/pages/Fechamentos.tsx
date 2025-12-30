import { useState } from 'react';
import { Plus, Filter } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { ClosingForm } from '@/components/closings/ClosingForm';
import { ExportImport } from '@/components/closings/ExportImport';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { useClosings, useUpdateClosingStatus } from '@/hooks/useClosings';
import { useStores } from '@/hooks/useStores';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { CheckCircle2, AlertTriangle, Clock, Shield, MoreHorizontal, CheckCheck } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const statusConfig = {
  ok: { label: 'OK', variant: 'success' as const, icon: CheckCircle2 },
  atencao: { label: 'Atenção', variant: 'warning' as const, icon: AlertTriangle },
  pendente: { label: 'Pendente', variant: 'pending' as const, icon: Clock },
  aprovado: { label: 'Aprovado', variant: 'success' as const, icon: Shield },
};

export default function Fechamentos() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [storeFilter, setStoreFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: stores } = useStores();
  const { data: closings, isLoading } = useClosings({
    storeId: storeFilter !== 'all' ? storeFilter : undefined,
  });
  const updateStatus = useUpdateClosingStatus();

  const filteredClosings = (closings || []).filter(closing => {
    if (statusFilter !== 'all' && closing.status !== statusFilter) return false;
    return true;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">Fechamentos</h1>
            <p className="text-muted-foreground mt-1">Gerencie todos os fechamentos de caixa</p>
          </div>
          <div className="flex items-center gap-3">
            <ExportImport closings={filteredClosings} />
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="gold" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Novo Fechamento
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle className="font-display text-2xl">Registrar Fechamento</DialogTitle>
                  <DialogDescription>Preencha os dados do fechamento de caixa.</DialogDescription>
                </DialogHeader>
                <ClosingForm onSuccess={() => setIsDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 p-4 rounded-lg bg-muted/50">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={storeFilter} onValueChange={setStoreFilter}>
            <SelectTrigger className="w-[180px] bg-background">
              <SelectValue placeholder="Todas as lojas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as lojas</SelectItem>
              {stores?.map((store) => (
                <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] bg-background">
              <SelectValue placeholder="Todos os status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="ok">OK</SelectItem>
              <SelectItem value="atencao">Atenção</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="aprovado">Aprovado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <Skeleton className="h-64" />
        ) : (
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
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClosings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhum fechamento encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClosings.map((closing) => {
                    const status = statusConfig[closing.status];
                    const StatusIcon = status.icon;
                    return (
                      <TableRow key={closing.id}>
                        <TableCell className="font-medium">
                          {format(new Date(closing.date), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell>{closing.stores?.name || '-'}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(Number(closing.expected_value))}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(Number(closing.counted_value))}</TableCell>
                        <TableCell className={cn("text-right font-mono font-medium", Number(closing.difference) > 0 && "text-success", Number(closing.difference) < 0 && "text-destructive")}>
                          {Number(closing.difference) >= 0 ? '+' : ''}{formatCurrency(Number(closing.difference))}
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant} className="gap-1">
                            <StatusIcon className="h-3 w-3" />
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {(closing.status === 'ok' || closing.status === 'atencao') && (
                                <DropdownMenuItem onClick={() => updateStatus.mutate({ id: closing.id, status: 'aprovado' })}>
                                  <CheckCheck className="mr-2 h-4 w-4" />
                                  Aprovar
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </Layout>
  );
}
