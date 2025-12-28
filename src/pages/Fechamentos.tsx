import { useState } from 'react';
import { Plus, Filter, Download } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { ClosingsList } from '@/components/closings/ClosingsList';
import { ClosingForm } from '@/components/closings/ClosingForm';
import { Button } from '@/components/ui/button';
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
import { mockClosings, mockStores } from '@/data/mockData';

export default function Fechamentos() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [storeFilter, setStoreFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredClosings = mockClosings.filter(closing => {
    if (storeFilter !== 'all' && closing.storeId !== storeFilter) return false;
    if (statusFilter !== 'all' && closing.status !== statusFilter) return false;
    return true;
  });

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">Fechamentos</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie todos os fechamentos de caixa
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Exportar
            </Button>
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
                  <DialogDescription>
                    Preencha os dados do fechamento de caixa.
                  </DialogDescription>
                </DialogHeader>
                <ClosingForm onSuccess={() => setIsDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 p-4 rounded-lg bg-muted/50">
          <Filter className="h-4 w-4 text-muted-foreground" />
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

        {/* List */}
        <ClosingsList closings={filteredClosings} />
      </div>
    </Layout>
  );
}
