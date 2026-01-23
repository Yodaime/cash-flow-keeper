import { useState } from 'react';
import { Plus, Building2, Trash2, MoreHorizontal, Loader2, Pencil } from 'lucide-react';
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
import { 
  useOrganizations, 
  useCreateOrganization, 
  useUpdateOrganization, 
  useDeleteOrganization,
  Organization 
} from '@/hooks/useOrganizations';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { Navigate } from 'react-router-dom';

export default function Organizacoes() {
  const { role } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');

  const { data: organizations, isLoading } = useOrganizations();
  const createOrg = useCreateOrganization();
  const updateOrg = useUpdateOrganization();
  const deleteOrg = useDeleteOrganization();

  // Apenas super_admin pode acessar
  if (role !== 'super_admin') {
    return <Navigate to="/" replace />;
  }

  const resetForm = () => {
    setName(''); setCode('');
    setEditingOrg(null);
  };

  const openEditDialog = (org: Organization) => {
    setEditingOrg(org);
    setName(org.name);
    setCode(org.code);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code) {
      toast.error('Nome e código são obrigatórios');
      return;
    }
    
    if (editingOrg) {
      await updateOrg.mutateAsync({ id: editingOrg.id, name, code });
    } else {
      await createOrg.mutateAsync({ name, code });
    }
    resetForm();
    setIsDialogOpen(false);
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
            <h1 className="font-display text-3xl font-bold tracking-tight">Organizações</h1>
            <p className="text-muted-foreground mt-1">Gerencie as organizações do sistema (Super Admin)</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
            <DialogTrigger asChild>
              <Button variant="destructive" className="gap-2"><Plus className="h-4 w-4" />Nova Organização</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-display text-2xl">
                  {editingOrg ? 'Editar Organização' : 'Cadastrar Organização'}
                </DialogTitle>
                <DialogDescription>
                  {editingOrg ? 'Atualize as informações da organização.' : 'Adicione uma nova organização ao sistema.'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Organização</Label>
                  <Input id="name" placeholder="Ex: Joalheria Premium" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code">Código</Label>
                  <Input id="code" placeholder="Ex: JP001" value={code} onChange={(e) => setCode(e.target.value)} />
                </div>
                <Button type="submit" variant="destructive" className="w-full" disabled={createOrg.isPending || updateOrg.isPending}>
                  {(createOrg.isPending || updateOrg.isPending) ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</>
                  ) : (
                    editingOrg ? 'Salvar Alterações' : 'Cadastrar Organização'
                  )}
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
                  <TableHead>Organização</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Criada em</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {organizations?.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Nenhuma organização cadastrada.</TableCell></TableRow>
                ) : organizations?.map((org) => (
                  <TableRow key={org.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-destructive/20 flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-destructive" />
                        </div>
                        <span className="font-medium">{org.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">{org.code}</TableCell>
                    <TableCell className="text-muted-foreground">{format(new Date(org.created_at), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(org)}>
                            <Pencil className="mr-2 h-4 w-4" />Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => deleteOrg.mutate(org.id)}>
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
