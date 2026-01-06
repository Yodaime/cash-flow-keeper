import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStores } from '@/hooks/useStores';
import { useUpdateUserProfile, useUpdateUserRole, useUpdateUserStore } from '@/hooks/useUsers';
import { UserRole } from '@/types';
import { Profile } from '@/hooks/useUsers';
import { Loader2 } from 'lucide-react';

interface EditUserDialogProps {
  user: Profile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const roleOptions: { value: UserRole; label: string }[] = [
  { value: 'funcionaria', label: 'Funcionária' },
  { value: 'gerente', label: 'Gerente' },
  { value: 'administrador', label: 'Administrador' },
];

export function EditUserDialog({ user, open, onOpenChange }: EditUserDialogProps) {
  const { data: stores } = useStores();
  const updateProfile = useUpdateUserProfile();
  const updateRole = useUpdateUserRole();
  const updateStore = useUpdateUserStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [storeId, setStoreId] = useState<string>('none');
  const [role, setRole] = useState<UserRole>('funcionaria');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setStoreId(user.store_id || 'none');
      setRole(user.user_roles?.[0]?.role || 'funcionaria');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);

    try {
      // Update profile (name and email)
      await updateProfile.mutateAsync({
        userId: user.id,
        name,
        email,
      });

      // Update store
      await updateStore.mutateAsync({
        userId: user.id,
        storeId: storeId === 'none' ? null : storeId,
      });

      // Update role
      const currentRole = user.user_roles?.[0]?.role;
      if (currentRole !== role) {
        await updateRole.mutateAsync({
          userId: user.id,
          role,
        });
      }

      onOpenChange(false);
    } catch (error) {
      console.error('Error updating user:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Usuário</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome do usuário"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemplo.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="store">Loja</Label>
            <Select value={storeId} onValueChange={setStoreId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma loja" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhuma loja</SelectItem>
                {stores?.map((store) => (
                  <SelectItem key={store.id} value={store.id}>
                    {store.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Função</Label>
            <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a função" />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
