import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ClosingStatus } from '@/types';

export interface CashClosing {
  id: string;
  store_id: string;
  user_id: string;
  organization_id: string | null;
  date: string;
  initial_value: number;
  expected_value: number;
  counted_value: number;
  difference: number;
  status: ClosingStatus;
  observations: string | null;
  validated_by: string | null;
  validated_at: string | null;
  created_at: string;
  updated_at: string;
  stores?: { name: string; code: string } | null;
}

const TOLERANCE_LIMIT = 10;

export const useClosings = (filters?: { storeId?: string; startDate?: string; endDate?: string }) => {
  return useQuery({
    queryKey: ['closings', filters],
    queryFn: async () => {
      let query = supabase
        .from('cash_closings')
        .select(`
          *,
          stores (name, code)
        `)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });
      
      if (filters?.storeId) {
        query = query.eq('store_id', filters.storeId);
      }
      
      if (filters?.startDate) {
        query = query.gte('date', filters.startDate);
      }
      
      if (filters?.endDate) {
        query = query.lte('date', filters.endDate);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as CashClosing[];
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreateClosing = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (closing: {
      store_id: string;
      date: string;
      initial_value: number;
      expected_value: number;
      counted_value: number;
      observations?: string;
    }) => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Get user profile to get organization_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      const difference = closing.counted_value - closing.expected_value;
      const status: ClosingStatus = Math.abs(difference) <= TOLERANCE_LIMIT ? 'ok' : 'atencao';
      
      const { data, error } = await supabase
        .from('cash_closings')
        .insert({
          ...closing,
          user_id: user.id,
          organization_id: profile?.organization_id,
          difference,
          status,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['closings'] });
      toast.success('Fechamento registrado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao registrar fechamento: ${error.message}`);
    },
  });
};

export const useUpdateClosingStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ClosingStatus }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const updateData: any = { status };
      
      if (status === 'aprovado') {
        updateData.validated_by = user.id;
        updateData.validated_at = new Date().toISOString();
      }
      
      const { data, error } = await supabase
        .from('cash_closings')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['closings'] });
      toast.success('Status atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar status: ${error.message}`);
    },
  });
};

export const useUpdateClosing = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (closing: {
      id: string;
      store_id: string;
      date: string;
      initial_value: number;
      expected_value: number;
      counted_value: number;
      observations: string | null;
    }) => {
      const difference = closing.counted_value - closing.expected_value;
      const TOLERANCE_LIMIT = 10;
      const status: ClosingStatus = Math.abs(difference) <= TOLERANCE_LIMIT ? 'ok' : 'atencao';
      
      const { data, error } = await supabase
        .from('cash_closings')
        .update({
          store_id: closing.store_id,
          date: closing.date,
          initial_value: closing.initial_value,
          expected_value: closing.expected_value,
          counted_value: closing.counted_value,
          difference,
          status,
          observations: closing.observations,
        })
        .eq('id', closing.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['closings'] });
      toast.success('Fechamento atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar fechamento: ${error.message}`);
    },
  });
};

export const useDeleteClosing = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('cash_closings')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['closings'] });
      toast.success('Fechamento removido com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao remover fechamento: ${error.message}`);
    },
  });
};
