import { useState } from 'react';
import { Plus, Store, Trash2, MoreHorizontal, Loader2, Pencil } from 'lucide-react';
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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useStores, useCreateStore, useUpdateStore, useDeleteStore, Store as StoreType } from '@/hooks/useStores';
import { useOrganizations } from '@/hooks/useOrganizations';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

import { useAuth } from '@/hooks/useAuth';

export default function Lojas() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<StoreType | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [unit, setUnit] = useState('');
  const [organizationId, setOrganizationId] = useState<string>('');

  const { data: stores, isLoading } = useStores();
  const { data: organizations } = useOrganizations();
  const { role: currentUserRole } = useAuth();
  const createStore = useCreateStore();
  const updateStore = useUpdateStore();
  const deleteStore = useDeleteStore();
  
  const isSuperAdmin = currentUserRole === 'super_admin';
  const isAdmin = currentUserRole === 'administrador' || isSuperAdmin;
  const isGerente = currentUserRole === 'gerente';
  const canCreateEdit = isAdmin || isGerente;
  const canDelete = isAdmin || isGerente;

  const resetForm = () => {
    setName(''); setCode(''); setUnit(''); setOrganizationId('');
    setEditingStore(null);
  };

  const openEditDialog = (store: StoreType) => {
    setEditingStore(store);
    setName(store.name);
    setCode(store.code);
    setUnit(store.unit || '');
    setOrganizationId(store.organization_id || '');
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code) {
      toast.error('Nome e código são obrigatórios');
      return;
    }
    
    try {
      if (editingStore) {
        await updateStore.mutateAsync({ id: editingStore.id, name, code, unit: unit || undefined });
      } else {
        await createStore.mutateAsync({ 
          name, 
          code, 
          unit: unit || undefined,
          organization_id: isSuperAdmin && organizationId ? organizationId : undefined
        });
      }
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      // Error already handled by mutation
    }
  };

  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) resetForm();
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">Lojas</h1>
            <p className="text-muted-foreground mt-1">Gerencie as lojas da rede</p>
          </div>
          {canCreateEdit && (
            <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
              <DialogTrigger asChild>
                <Button variant="gold" className="gap-2"><Plus className="h-4 w-4" />Nova Loja</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-display text-2xl">
                    {editingStore ? 'Editar Loja' : 'Cadastrar Loja'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingStore ? 'Atualize as informações da loja.' : 'Adicione uma nova loja à rede.'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Organization selector - Only for Super Admin */}
                  {isSuperAdmin && (
                    <div className="space-y-2">
                      <Label htmlFor="organization">Organização</Label>
                      <Select value={organizationId} onValueChange={setOrganizationId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma organização" />
                        </SelectTrigger>
                        <SelectContent>
                          {organizations?.map((org) => (
                            <SelectItem key={org.id} value={org.id}>
                              {org.name} ({org.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
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
                  <Button type="submit" variant="gold" className="w-full" disabled={createStore.isPending || updateStore.isPending}>
                    {(createStore.isPending || updateStore.isPending) ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</>
                    ) : (
                      editingStore ? 'Salvar Alterações' : 'Cadastrar Loja'
                    )}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
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
                    {(canCreateEdit || canDelete) && (
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {canCreateEdit && (
                              <DropdownMenuItem onClick={() => openEditDialog(store)}>
                                <Pencil className="mr-2 h-4 w-4" />Editar
                              </DropdownMenuItem>
                            )}
                            {canDelete && (
                              <DropdownMenuItem className="text-destructive" onClick={() => deleteStore.mutate(store.id)}>
                                <Trash2 className="mr-2 h-4 w-4" />Remover
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
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
