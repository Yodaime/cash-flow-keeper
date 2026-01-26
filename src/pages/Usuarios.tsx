import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useUsers, Profile } from '@/hooks/useUsers';
import { useAuth } from '@/hooks/useAuth';
import { EditUserDialog } from '@/components/users/EditUserDialog';
import { DeleteUserDialog } from '@/components/users/DeleteUserDialog';
import { User, Shield, Users as UsersIcon, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { UserRole } from '@/types';

const roleConfig: Record<UserRole, { label: string; variant: 'secondary' | 'gold' | 'default' | 'destructive' }> = {
  funcionaria: { label: 'Funcionária', variant: 'secondary' },
  gerente: { label: 'Gerente', variant: 'gold' },
  administrador: { label: 'Administrador', variant: 'default' },
  super_admin: { label: 'Super Admin', variant: 'destructive' },
};

export default function Usuarios() {
  const { data: users, isLoading } = useUsers();
  const { role: currentUserRole } = useAuth();
  const isSuperAdmin = currentUserRole === 'super_admin';
  const isAdmin = currentUserRole === 'administrador' || isSuperAdmin;
  const isGerente = currentUserRole === 'gerente';
  const canManageUsers = isAdmin || isGerente;

  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [deletingUser, setDeletingUser] = useState<Profile | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleEdit = (user: Profile) => {
    setEditingUser(user);
    setEditDialogOpen(true);
  };

  const handleDelete = (user: Profile) => {
    setDeletingUser(user);
    setDeleteDialogOpen(true);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Usuários</h1>
          <p className="text-muted-foreground mt-1">Gerencie os usuários e permissões</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border bg-card p-4 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                <UsersIcon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Usuários</p>
                <p className="text-2xl font-bold">{users?.length || 0}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-gold flex items-center justify-center">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Gerentes</p>
                <p className="text-2xl font-bold">{users?.filter(u => u.user_roles?.[0]?.role === 'gerente').length || 0}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
                <User className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Administradores</p>
                <p className="text-2xl font-bold">{users?.filter(u => u.user_roles?.[0]?.role === 'administrador').length || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {isLoading ? <Skeleton className="h-64" /> : (
          <div className="rounded-xl border bg-card shadow-soft overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Usuário</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Loja</TableHead>
                  {canManageUsers && <TableHead className="w-12"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.length === 0 ? (
                  <TableRow><TableCell colSpan={canManageUsers ? 4 : 3} className="text-center py-8 text-muted-foreground">Nenhum usuário cadastrado.</TableCell></TableRow>
                ) : users?.map((user) => {
                  const userRole = user.user_roles?.[0]?.role as UserRole | undefined;
                  const roleInfo = userRole ? roleConfig[userRole] : null;
                  
                  // Gerente não pode editar/excluir administradores
                  const targetIsAdmin = userRole === 'administrador' || userRole === 'super_admin';
                  const canEditThisUser = isAdmin || (isGerente && !targetIsAdmin);
                  const canDeleteThisUser = isAdmin; // Apenas admins podem excluir
                  
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                            <span className="text-sm font-medium">{user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
                          </div>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{roleInfo && <Badge variant={roleInfo.variant}>{roleInfo.label}</Badge>}</TableCell>
                      <TableCell className="text-muted-foreground">{user.stores?.name || '-'}</TableCell>
                      {canManageUsers && (
                        <TableCell>
                          {(canEditThisUser || canDeleteThisUser) && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {canEditThisUser && (
                                  <DropdownMenuItem onClick={() => handleEdit(user)}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Editar
                                  </DropdownMenuItem>
                                )}
                                {canDeleteThisUser && (
                                  <DropdownMenuItem 
                                    onClick={() => handleDelete(user)}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Remover
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <EditUserDialog
        user={editingUser}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />

      <DeleteUserDialog
        user={deletingUser}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      />
    </Layout>
  );
}
