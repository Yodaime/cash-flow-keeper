import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UserRole } from '@/types';

export interface Profile {
  id: string;
  name: string;
  email: string;
  store_id: string | null;
  created_at: string;
  updated_at: string;
  stores?: { name: string } | null;
  user_roles?: { role: UserRole }[];
}

export const useUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      // Fetch profiles and roles in parallel
      const [profilesResult, rolesResult] = await Promise.all([
        supabase
          .from('profiles')
          .select(`
            *,
            stores (name)
          `)
          .order('name'),
        supabase
          .from('user_roles')
          .select('user_id, role')
      ]);
      
      if (profilesResult.error) throw profilesResult.error;
      if (rolesResult.error) throw rolesResult.error;
      
      // Merge roles into profiles
      const profilesWithRoles = profilesResult.data?.map(profile => ({
        ...profile,
        user_roles: rolesResult.data?.filter(r => r.user_id === profile.id) || []
      }));
      
      return profilesWithRoles as Profile[];
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUpdateUserProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, name, email }: { userId: string; name: string; email: string }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update({ name, email })
        .eq('id', userId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Perfil atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar perfil: ${error.message}`);
    },
  });
};

export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: UserRole }) => {
      // First, delete existing role
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);
      
      // Then insert new role
      const { data, error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Papel atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar papel: ${error.message}`);
    },
  });
};

export const useUpdateUserStore = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, storeId }: { userId: string; storeId: string | null }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update({ store_id: storeId })
        .eq('id', userId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Loja do usuário atualizada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar loja do usuário: ${error.message}`);
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userId: string) => {
      // Delete user role first
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);
      
      // Delete profile
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuário removido com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao remover usuário: ${error.message}`);
    },
  });
};

export const useResetUserPassword = () => {
  return useMutation({
    mutationFn: async ({ userId, newPassword }: { userId: string; newPassword: string }) => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Usuário não autenticado');
      }

      const response = await supabase.functions.invoke('reset-user-password', {
        body: { userId, newPassword },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Erro ao redefinir senha');
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      return response.data;
    },
    onSuccess: () => {
      toast.success('Senha redefinida com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao redefinir senha: ${error.message}`);
    },
  });
};
