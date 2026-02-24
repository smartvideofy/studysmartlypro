import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Notebook {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  subject: string | null;
  topic: string | null;
  language: string;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  processing_error: string | null;
  created_at: string;
  updated_at: string;
  // Joined count
  material_count?: number;
}

export function useNotebooks() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['notebooks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notebooks')
        .select('*')
        .eq('user_id', user!.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Get material counts per notebook
      const notebookIds = data.map((n: any) => n.id);
      if (notebookIds.length === 0) return [] as Notebook[];

      const { data: materials } = await supabase
        .from('study_materials')
        .select('notebook_id')
        .in('notebook_id', notebookIds);

      const countMap: Record<string, number> = {};
      materials?.forEach((m: any) => {
        if (m.notebook_id) {
          countMap[m.notebook_id] = (countMap[m.notebook_id] || 0) + 1;
        }
      });

      return data.map((n: any) => ({
        ...n,
        material_count: countMap[n.id] || 0,
      })) as Notebook[];
    },
    enabled: !!user,
    refetchInterval: (query) => {
      const notebooks = query.state.data;
      if (!notebooks) return false;
      const hasProcessing = notebooks.some(
        (n: Notebook) => n.processing_status === 'pending' || n.processing_status === 'processing'
      );
      return hasProcessing ? 5000 : false;
    },
  });
}

export function useNotebook(notebookId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['notebook', notebookId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notebooks')
        .select('*')
        .eq('id', notebookId)
        .single();

      if (error) throw error;
      return data as Notebook;
    },
    enabled: !!user && !!notebookId,
    refetchInterval: (query) => {
      const nb = query.state.data;
      if (!nb) return false;
      return nb.processing_status === 'pending' || nb.processing_status === 'processing' ? 5000 : false;
    },
  });
}

export function useNotebookMaterials(notebookId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['notebook-materials', notebookId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('study_materials')
        .select('*')
        .eq('notebook_id', notebookId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!user && !!notebookId,
    refetchInterval: (query) => {
      const materials = query.state.data;
      if (!materials) return false;
      const hasProcessing = materials.some(
        (m: any) => m.processing_status === 'pending' || m.processing_status === 'processing'
      );
      return hasProcessing ? 5000 : false;
    },
  });
}

export function useCreateNotebook() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: { title: string; description?: string; subject?: string; topic?: string; language?: string }) => {
      if (!user?.id) throw new Error('Must be logged in');

      const { data, error } = await supabase
        .from('notebooks')
        .insert({
          user_id: user.id,
          title: input.title,
          description: input.description || null,
          subject: input.subject || null,
          topic: input.topic || null,
          language: input.language || 'en',
          processing_status: 'pending',
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data as Notebook;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notebooks'] });
    },
    onError: (error) => {
      toast.error('Failed to create notebook: ' + (error instanceof Error ? error.message : 'Please try again'));
    },
  });
}

export function useDeleteNotebook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notebookId: string) => {
      const { error } = await supabase
        .from('notebooks')
        .delete()
        .eq('id', notebookId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notebooks'] });
      queryClient.invalidateQueries({ queryKey: ['study-materials'] });
      toast.success('Notebook deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete notebook: ' + (error instanceof Error ? error.message : 'Please try again'));
    },
  });
}
