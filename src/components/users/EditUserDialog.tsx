import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStores } from '@/hooks/useStores';
import { useOrganizations } from '@/hooks/useOrganizations';
import { useUpdateUserProfile, useUpdateUserRole, useUpdateUserStore, useUpdateUserOrganization, useResetUserPassword } from '@/hooks/useUsers';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types';
import { Profile } from '@/hooks/useUsers';
import { Loader2, KeyRound } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

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

const superAdminRoleOptions: { value: UserRole; label: string }[] = [
  { value: 'funcionaria', label: 'Funcionária' },
  { value: 'gerente', label: 'Gerente' },
  { value: 'administrador', label: 'Administrador' },
  { value: 'super_admin', label: 'Super Admin' },
];

export function EditUserDialog({ user, open, onOpenChange }: EditUserDialogProps) {
  const { role: currentUserRole } = useAuth();
  const isSuperAdmin = currentUserRole === 'super_admin';
  const isAdmin = currentUserRole === 'administrador' || isSuperAdmin;
  
  const { data: stores } = useStores();
  const { data: organizations } = useOrganizations();
  const updateProfile = useUpdateUserProfile();
  const updateRole = useUpdateUserRole();
  const updateStore = useUpdateUserStore();
  const updateOrganization = useUpdateUserOrganization();
  const resetPassword = useResetUserPassword();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [storeId, setStoreId] = useState<string>('none');
  const [organizationId, setOrganizationId] = useState<string>('none');
  const [role, setRole] = useState<UserRole>('funcionaria');
  const [newPassword, setNewPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setStoreId(user.store_id || 'none');
      setOrganizationId(user.organization_id || 'none');
      setRole(user.user_roles?.[0]?.role || 'funcionaria');
      setNewPassword('');
    }
  }, [user]);

  const handleResetPassword = async () => {
    if (!user || !newPassword) {
      toast({
        title: 'Erro',
        description: 'Digite uma nova senha.',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: 'Erro',
        description: 'A senha deve ter pelo menos 6 caracteres.',
        variant: 'destructive',
      });
      return;
    }

    setIsResettingPassword(true);
    try {
      await resetPassword.mutateAsync({
        userId: user.id,
        newPassword,
      });
      setNewPassword('');
    } finally {
      setIsResettingPassword(false);
    }
  };

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

      // Update organization (only for super_admin)
      if (isSuperAdmin) {
        const currentOrgId = user.organization_id;
        const newOrgId = organizationId === 'none' ? null : organizationId;
        if (currentOrgId !== newOrgId) {
          await updateOrganization.mutateAsync({
            userId: user.id,
            organizationId: newOrgId,
          });
        }
      }

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

  // Gerente só pode atribuir funcionaria ou gerente
  const gerenteRoleOptions = roleOptions.filter(r => r.value !== 'administrador');
  const availableRoleOptions = isSuperAdmin 
    ? superAdminRoleOptions 
    : isAdmin 
      ? roleOptions 
      : gerenteRoleOptions;

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
            <Label htmlFor="newPassword">Redefinir Senha</Label>
            <div className="flex gap-2">
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nova senha (mín. 6 caracteres)"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleResetPassword}
                disabled={isResettingPassword || !newPassword}
              >
                {isResettingPassword ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <KeyRound className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Organization - Only for Super Admin */}
          {isSuperAdmin && (
            <div className="space-y-2">
              <Label htmlFor="organization">Organização</Label>
              <Select value={organizationId} onValueChange={setOrganizationId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma organização" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma organização</SelectItem>
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
                {availableRoleOptions.map((option) => (
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
