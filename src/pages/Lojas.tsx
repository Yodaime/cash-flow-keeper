import { useState } from 'react';
import { Plus, Store, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { mockStores } from '@/data/mockData';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Lojas() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [stores, setStores] = useState(mockStores);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [unit, setUnit] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !code || !unit) {
      toast.error('Preencha todos os campos');
      return;
    }

    const newStore = {
      id: String(stores.length + 1),
      name,
      code,
      unit,
      createdAt: new Date(),
    };

    setStores([...stores, newStore]);
    setName('');
    setCode('');
    setUnit('');
    setIsDialogOpen(false);
    toast.success('Loja cadastrada com sucesso!');
  };

  const handleDelete = (id: string) => {
    setStores(stores.filter(s => s.id !== id));
    toast.success('Loja removida com sucesso!');
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">Lojas</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie as lojas da rede
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="gold" className="gap-2">
                <Plus className="h-4 w-4" />
                Nova Loja
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-display text-2xl">Cadastrar Loja</DialogTitle>
                <DialogDescription>
                  Adicione uma nova loja à rede.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Loja</Label>
                  <Input
                    id="name"
                    placeholder="Ex: Joalheria Centro"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code">Código</Label>
                  <Input
                    id="code"
                    placeholder="Ex: JC001"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unidade/Local</Label>
                  <Input
                    id="unit"
                    placeholder="Ex: Shopping Center"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                  />
                </div>
                <Button type="submit" variant="gold" className="w-full">
                  Cadastrar Loja
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stores List */}
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
              {stores.map((store, index) => (
                <TableRow 
                  key={store.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-gradient-gold flex items-center justify-center">
                        <Store className="h-5 w-5 text-primary" />
                      </div>
                      <span className="font-medium">{store.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono">{store.code}</TableCell>
                  <TableCell>{store.unit}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(store.createdAt, "dd/MM/yyyy", { locale: ptBR })}
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
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => handleDelete(store.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remover
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </Layout>
  );
}
