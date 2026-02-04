import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStores } from '@/hooks/useStores';
import { useUpdateProduct, Product } from '@/hooks/useProducts';

interface EditProductDialogProps {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditProductDialog({ product, open, onOpenChange }: EditProductDialogProps) {
  const [name, setName] = useState(product.name);
  const [type, setType] = useState(product.type);
  const [storeId, setStoreId] = useState(product.store_id || '');
  const [quantity, setQuantity] = useState(product.quantity.toString());
  const [unitValue, setUnitValue] = useState(product.unit_value.toString().replace('.', ','));

  const { data: stores } = useStores();
  const updateProduct = useUpdateProduct();

  useEffect(() => {
    setName(product.name);
    setType(product.type);
    setStoreId(product.store_id || '');
    setQuantity(product.quantity.toString());
    setUnitValue(product.unit_value.toString().replace('.', ','));
  }, [product]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !type || !storeId) return;

    await updateProduct.mutateAsync({
      id: product.id,
      name,
      type,
      store_id: storeId,
      quantity: parseInt(quantity) || 0,
      unit_value: parseFloat(unitValue.replace(',', '.')) || 0,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Produto</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome do produto"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Tipo</Label>
            <Input
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              placeholder="Categoria ou tipo"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="store">Loja</Label>
            <Select value={storeId} onValueChange={setStoreId} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a loja" />
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantidade</Label>
              <Input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0"
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unitValue">Valor Unitário</Label>
              <Input
                id="unitValue"
                value={unitValue}
                onChange={(e) => setUnitValue(e.target.value)}
                placeholder="0,00"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="gold" disabled={updateProduct.isPending}>
              {updateProduct.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
