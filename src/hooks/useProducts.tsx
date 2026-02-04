import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './useAuth';

export interface Product {
  id: string;
  name: string;
  type: string;
  store_id: string | null;
  organization_id: string | null;
  quantity: number;
  unit_value: number;
  created_at: string;
  updated_at: string;
  stores?: {
    id: string;
    name: string;
    code: string;
  } | null;
}

export function useProducts(storeId?: string) {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['products', storeId, profile?.organization_id],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select(`
          *,
          stores (id, name, code)
        `)
        .order('name', { ascending: true });

      if (storeId) {
        query = query.eq('store_id', storeId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Product[];
    },
    enabled: !!profile,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (product: {
      name: string;
      type: string;
      store_id: string;
      quantity: number;
      unit_value: number;
    }) => {
      const { data, error } = await supabase
        .from('products')
        .insert({
          ...product,
          organization_id: profile?.organization_id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produto criado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao criar produto: ' + error.message);
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string;
      name?: string;
      type?: string;
      store_id?: string;
      quantity?: number;
      unit_value?: number;
    }) => {
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produto atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar produto: ' + error.message);
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produto excluído com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao excluir produto: ' + error.message);
    },
  });
}

export function useBulkCreateProducts() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (products: Array<{
      name: string;
      type: string;
      store_id: string;
      quantity: number;
      unit_value: number;
    }>) => {
      const productsWithOrg = products.map(p => ({
        ...p,
        organization_id: profile?.organization_id,
      }));

      const { data, error } = await supabase
        .from('products')
        .insert(productsWithOrg)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(`${data.length} produtos importados com sucesso!`);
    },
    onError: (error: Error) => {
      toast.error('Erro ao importar produtos: ' + error.message);
    },
  });
}
