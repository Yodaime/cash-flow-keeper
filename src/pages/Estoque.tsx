import { useState, useRef } from 'react';
import { Download, Upload, Package, Search, Trash2, Pencil, Plus } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useProducts, useBulkCreateProducts, useDeleteProduct, Product } from '@/hooks/useProducts';
import { useStores } from '@/hooks/useStores';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { CreateProductDialog } from '@/components/stock/CreateProductDialog';
import { EditProductDialog } from '@/components/stock/EditProductDialog';
import { DeleteProductDialog } from '@/components/stock/DeleteProductDialog';

export default function Estoque() {
  const [storeFilter, setStoreFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { role } = useAuth();
  const { data: stores } = useStores();
  const { data: products, isLoading } = useProducts(storeFilter !== 'all' ? storeFilter : undefined);
  const bulkCreate = useBulkCreateProducts();

  const isAdmin = role === 'super_admin' || role === 'administrador';

  const filteredProducts = products?.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.type.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const totalValue = filteredProducts.reduce((acc, p) => acc + (p.quantity * p.unit_value), 0);
  const totalItems = filteredProducts.reduce((acc, p) => acc + p.quantity, 0);

  const handleExportTemplate = () => {
    const headers = ['Nome', 'Tipo', 'Loja (Código)', 'Quantidade', 'Valor Unitário'];
    const exampleRow = ['Produto Exemplo', 'Categoria A', 'LOJA001', '10', '99.90'];
    
    const csvContent = [
      headers.join(';'),
      exampleRow.join(';'),
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'modelo_estoque.csv';
    link.click();
    toast.success('Modelo de importação baixado!');
  };

  const handleExportData = () => {
    if (filteredProducts.length === 0) {
      toast.error('Nenhum produto para exportar!');
      return;
    }

    const headers = ['Nome', 'Tipo', 'Loja', 'Quantidade', 'Valor Unitário', 'Valor Total'];
    const rows = filteredProducts.map(p => [
      p.name,
      p.type,
      p.stores?.name || '-',
      p.quantity.toString(),
      p.unit_value.toFixed(2).replace('.', ','),
      (p.quantity * p.unit_value).toFixed(2).replace('.', ','),
    ]);

    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.join(';')),
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `estoque_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('Dados exportados com sucesso!');
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          toast.error('Arquivo vazio ou inválido!');
          return;
        }

        if (!stores || stores.length === 0) {
          toast.error('Nenhuma loja cadastrada! Cadastre lojas antes de importar produtos.');
          return;
        }

        const dataLines = lines.slice(1);
        const productsToImport: Array<{
          name: string;
          type: string;
          store_id: string;
          quantity: number;
          unit_value: number;
        }> = [];

        const errors: string[] = [];

        for (const line of dataLines) {
          // Suporte para separadores ; e ,
          const separator = line.includes(';') ? ';' : ',';
          const columns = line.split(separator).map(col => col.trim().replace(/"/g, ''));
          
          if (columns.length < 5) {
            errors.push(`Linha ignorada (colunas insuficientes): ${line.substring(0, 50)}...`);
            continue;
          }

          const [name, type, storeCode, quantity, unitValue] = columns;
          
          if (!name || !type || !storeCode) {
            errors.push(`Linha ignorada (dados obrigatórios vazios): ${name || 'sem nome'}`);
            continue;
          }
          
          // Busca loja por código ou nome (mais flexível)
          const store = stores?.find(s => 
            s.code.toLowerCase() === storeCode.toLowerCase() || 
            s.name.toLowerCase() === storeCode.toLowerCase()
          );
          
          if (!store) {
            errors.push(`Loja "${storeCode}" não encontrada`);
            continue;
          }

          productsToImport.push({
            name,
            type,
            store_id: store.id,
            quantity: parseInt(quantity.replace(/\D/g, '')) || 0,
            unit_value: parseFloat(unitValue.replace(',', '.').replace(/[^\d.]/g, '')) || 0,
          });
        }

        if (errors.length > 0 && productsToImport.length === 0) {
          toast.error(`Nenhum produto válido. Erros: ${errors.slice(0, 3).join('; ')}`);
          return;
        }

        if (productsToImport.length === 0) {
          toast.error('Nenhum produto válido para importar! Verifique se o código da loja está correto.');
          return;
        }

        if (errors.length > 0) {
          toast.warning(`${errors.length} linha(s) ignorada(s)`);
        }

        await bulkCreate.mutateAsync(productsToImport);
      } catch (error) {
        toast.error('Erro ao processar arquivo!');
      }
    };

    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!isAdmin) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">Estoque</h1>
            <p className="text-muted-foreground mt-1">Gerencie os produtos em estoque</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="gap-2" onClick={handleExportTemplate}>
              <Download className="h-4 w-4" />
              Modelo
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleImport}
              className="hidden"
            />
            <Button variant="outline" className="gap-2" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4" />
              Importar
            </Button>
            <Button variant="outline" className="gap-2" onClick={handleExportData}>
              <Download className="h-4 w-4" />
              Exportar
            </Button>
            <Button variant="gold" className="gap-2" onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Novo Produto
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border bg-card p-4 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-gold flex items-center justify-center">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Produtos</p>
                <p className="text-xl font-bold">{filteredProducts.length}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                <Package className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Itens em Estoque</p>
                <p className="text-xl font-bold">{totalItems}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                <Package className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valor Total</p>
                <p className="text-xl font-bold">{formatCurrency(totalValue)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 p-4 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou tipo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-background"
            />
          </div>
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
        </div>

        {/* Products Table */}
        {isLoading ? (
          <Skeleton className="h-64" />
        ) : (
          <div className="rounded-xl border bg-card shadow-soft overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Loja</TableHead>
                  <TableHead className="text-right">Quantidade</TableHead>
                  <TableHead className="text-right">Valor Unit.</TableHead>
                  <TableHead className="text-right">Valor Total</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhum produto encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.type}</TableCell>
                      <TableCell>{product.stores?.name || '-'}</TableCell>
                      <TableCell className="text-right font-mono">{product.quantity}</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(product.unit_value)}</TableCell>
                      <TableCell className="text-right font-mono font-medium">
                        {formatCurrency(product.quantity * product.unit_value)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setEditingProduct(product)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setDeletingProduct(product)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <CreateProductDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      {editingProduct && (
        <EditProductDialog
          product={editingProduct}
          open={!!editingProduct}
          onOpenChange={(open) => !open && setEditingProduct(null)}
        />
      )}

      {deletingProduct && (
        <DeleteProductDialog
          product={deletingProduct}
          open={!!deletingProduct}
          onOpenChange={(open) => !open && setDeletingProduct(null)}
        />
      )}
    </Layout>
  );
}
