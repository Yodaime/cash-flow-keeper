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
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          *,
          stores (name)
        `)
        .order('name');
      
      if (profilesError) throw profilesError;
      
      // Fetch roles for all users
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');
      
      if (rolesError) throw rolesError;
      
      // Merge roles into profiles
      const profilesWithRoles = profiles?.map(profile => ({
        ...profile,
        user_roles: roles?.filter(r => r.user_id === profile.id) || []
      }));
      
      return profilesWithRoles as Profile[];
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
