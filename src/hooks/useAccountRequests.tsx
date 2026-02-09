import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AccountRequest {
  id: string;
  name: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

export const useAccountRequests = () => {
  return useQuery({
    queryKey: ['account-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('account_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AccountRequest[];
    },
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

export const usePendingRequestsCount = () => {
  return useQuery({
    queryKey: ['account-requests', 'pending-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('account_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      if (error) throw error;
      return count || 0;
    },
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

export const useUpdateAccountRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: 'approved' | 'rejected';
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('account_requests')
        .update({
          status,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['account-requests'] });
      const message = variables.status === 'approved' 
        ? 'Solicitação aprovada com sucesso!' 
        : 'Solicitação rejeitada.';
      toast.success(message);
    },
    onError: (error: Error) => {
      toast.error(`Erro ao processar solicitação: ${error.message}`);
    },
  });
};

export const useDeleteAccountRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('account_requests')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account-requests'] });
      toast.success('Solicitação excluída com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir solicitação: ${error.message}`);
    },
  });
};

export const useCreateAccountRequest = () => {
  return useMutation({
    mutationFn: async ({
      name,
      email,
    }: {
      name: string;
      email: string;
    }) => {
      const { error } = await supabase
        .from('account_requests')
        .insert({ name, email });

      if (error) {
        if (error.code === '23505') {
          throw new Error('Este email já possui uma solicitação pendente.');
        }
        throw error;
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};
