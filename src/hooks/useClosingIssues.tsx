import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ClosingIssue {
    id: string;
    created_at: string;
    user_id: string;
    store_id?: string;
    description: string;
    status: 'pending' | 'resolved';
    updated_at: string;
    // Optional: include joined user/store data if needed for display
    profiles?: { name: string; email: string };
    stores?: { name: string; code: string };
}

export const useClosingIssues = () => {
    return useQuery({
        queryKey: ['closing-issues'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('closing_issues')
                .select(`*, stores (name, code)`)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Fetch profile info for each unique user_id
            const userIds = [...new Set((data || []).map(d => d.user_id))];
            const { data: profiles } = userIds.length
                ? await supabase.from('profiles').select('id, name, email').in('id', userIds)
                : { data: [] };

            const profileMap = new Map((profiles || []).map(p => [p.id, p]));

            return (data || []).map(item => ({
                ...item,
                status: item.status as 'pending' | 'resolved',
                profiles: profileMap.get(item.user_id) ? {
                    name: profileMap.get(item.user_id)!.name,
                    email: profileMap.get(item.user_id)!.email,
                } : undefined,
            })) as ClosingIssue[];
        },
    });
};

export const useCreateClosingIssue = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            description,
            store_id,
        }: {
            description: string;
            store_id?: string;
        }) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Usuário não autenticado');

            const { error } = await supabase
                .from('closing_issues')
                .insert({
                    description,
                    store_id,
                    user_id: user.id,
                });

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['closing-issues'] });
            toast.success('Problema reportado com sucesso!');
        },
        onError: (error: Error) => {
            toast.error(`Erro ao reportar problema: ${error.message}`);
        },
    });
};

export const useUpdateClosingIssue = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            id,
            status,
            description,
        }: {
            id: string;
            status?: 'pending' | 'resolved';
            description?: string;
        }) => {
            const updates: any = {};
            if (status) updates.status = status;
            if (description) updates.description = description;

            const { error } = await supabase
                .from('closing_issues')
                .update(updates)
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['closing-issues'] });
            toast.success('Problema atualizado com sucesso!');
        },
        onError: (error: Error) => {
            toast.error(`Erro ao atualizar problema: ${error.message}`);
        },
    });
};

export const useDeleteClosingIssue = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('closing_issues')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['closing-issues'] });
            toast.success('Problema removido com sucesso!');
        },
        onError: (error: Error) => {
            toast.error(`Erro ao remover problema: ${error.message}`);
        },
    });
};
