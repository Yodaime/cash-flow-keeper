import { useState } from 'react';
import { Plus, Store, Trash2, MoreHorizontal, Loader2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useStores, useCreateStore, useDeleteStore } from '@/hooks/useStores';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

export default function Lojas() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [unit, setUnit] = useState('');

  const { data: stores, isLoading } = useStores();
  const createStore = useCreateStore();
  const deleteStore = useDeleteStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code) {
      toast.error('Nome e código são obrigatórios');
      return;
    }
    await createStore.mutateAsync({ name, code, unit: unit || undefined });
    setName(''); setCode(''); setUnit('');
    setIsDialogOpen(false);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">Lojas</h1>
            <p className="text-muted-foreground mt-1">Gerencie as lojas da rede</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="gold" className="gap-2"><Plus className="h-4 w-4" />Nova Loja</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-display text-2xl">Cadastrar Loja</DialogTitle>
                <DialogDescription>Adicione uma nova loja à rede.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Loja</Label>
                  <Input id="name" placeholder="Ex: Joalheria Centro" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code">Código</Label>
                  <Input id="code" placeholder="Ex: JC001" value={code} onChange={(e) => setCode(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unidade/Local</Label>
                  <Input id="unit" placeholder="Ex: Shopping Center" value={unit} onChange={(e) => setUnit(e.target.value)} />
                </div>
                <Button type="submit" variant="gold" className="w-full" disabled={createStore.isPending}>
                  {createStore.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</> : 'Cadastrar Loja'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? <Skeleton className="h-64" /> : (
          <div className="rounded-xl border bg-card shadow-soft overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Loja</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Criada em</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stores?.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhuma loja cadastrada.</TableCell></TableRow>
                ) : stores?.map((store) => (
                  <TableRow key={store.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-gradient-gold flex items-center justify-center">
                          <Store className="h-5 w-5 text-primary" />
                        </div>
                        <span className="font-medium">{store.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">{store.code}</TableCell>
                    <TableCell>{store.unit || '-'}</TableCell>
                    <TableCell className="text-muted-foreground">{format(new Date(store.created_at), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="text-destructive" onClick={() => deleteStore.mutate(store.id)}>
                            <Trash2 className="mr-2 h-4 w-4" />Remover
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </Layout>
  );
}
