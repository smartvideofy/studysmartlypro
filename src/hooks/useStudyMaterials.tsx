import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface StudyMaterial {
  id: string;
  user_id: string;
  folder_id: string | null;
  title: string;
  file_name: string | null;
  file_type: string | null;
  file_path: string | null;
  file_size: number | null;
  extracted_content: string | null;
  language: string;
  subject: string | null;
  topic: string | null;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  processing_error: string | null;
  generate_tutor_notes: boolean;
  generate_flashcards: boolean;
  generate_questions: boolean;
  generate_concept_map: boolean;
  created_at: string;
  updated_at: string;
}

export interface TutorNotes {
  id: string;
  material_id: string;
  user_id: string;
  content: {
    topics: Array<{
      title: string;
      subtopics: Array<{
        title: string;
        content: string;
        definitions?: Array<{ term: string; definition: string }>;
        examples?: string[];
        exam_tips?: string[];
      }>;
    }>;
  };
  created_at: string;
  updated_at: string;
}

export interface Summary {
  id: string;
  material_id: string;
  user_id: string;
  summary_type: 'quick' | 'detailed' | 'bullet_points';
  content: string;
  created_at: string;
}

export interface PracticeQuestion {
  id: string;
  material_id: string;
  user_id: string;
  question_type: 'mcq' | 'short_answer' | 'case_based';
  question: string;
  options: string[] | null;
  correct_answer: string | null;
  explanation: string | null;
  created_at: string;
}

export interface ConceptMap {
  id: string;
  material_id: string;
  user_id: string;
  nodes: Array<{ id: string; label: string; x: number; y: number; description?: string }>;
  edges: Array<{ source: string; target: string; label?: string }>;
  created_at: string;
  updated_at: string;
}

// Fetch all study materials
export function useStudyMaterials(folderId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['study-materials', folderId],
    queryFn: async () => {
      let query = supabase
        .from('study_materials')
        .select('*')
        .eq('user_id', user?.id)
        .order('updated_at', { ascending: false });

      if (folderId) {
        query = query.eq('folder_id', folderId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as StudyMaterial[];
    },
    enabled: !!user,
  });
}

// Fetch a single study material
export function useStudyMaterial(materialId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['study-material', materialId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('study_materials')
        .select('*')
        .eq('id', materialId)
        .single();

      if (error) throw error;
      return data as StudyMaterial;
    },
    enabled: !!user && !!materialId,
  });
}

// Create a new study material
export function useCreateStudyMaterial() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (material: Omit<Partial<StudyMaterial>, 'id' | 'user_id' | 'created_at' | 'updated_at'> & { title: string }) => {
      if (!user?.id) {
        throw new Error('You must be logged in to create study materials');
      }
      
      const { data, error } = await supabase
        .from('study_materials')
        .insert({
          title: material.title,
          folder_id: material.folder_id ?? null,
          file_name: material.file_name ?? null,
          file_type: material.file_type ?? null,
          file_path: material.file_path ?? null,
          file_size: material.file_size ?? null,
          language: material.language ?? 'en',
          subject: material.subject ?? null,
          topic: material.topic ?? null,
          generate_tutor_notes: material.generate_tutor_notes ?? true,
          generate_flashcards: material.generate_flashcards ?? true,
          generate_questions: material.generate_questions ?? true,
          generate_concept_map: material.generate_concept_map ?? false,
          processing_status: 'pending',
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      
      // Trigger processing in the background
      const createdMaterial = data as StudyMaterial;
      try {
        await supabase.functions.invoke('process-material', {
          body: { materialId: createdMaterial.id },
        });
      } catch (processingError) {
        // Don't throw - material is created, processing can be retried
        toast.info('Material uploaded. Processing will start shortly.');
      }
      
      return createdMaterial;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study-materials'] });
      toast.success('Material uploaded successfully');
    },
    onError: (error) => {
      toast.error('Failed to upload material: ' + (error instanceof Error ? error.message : 'Please try again'));
    },
  });
}

// Update a study material
export function useUpdateStudyMaterial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<StudyMaterial> & { id: string }) => {
      const { data, error } = await supabase
        .from('study_materials')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as StudyMaterial;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['study-materials'] });
      queryClient.invalidateQueries({ queryKey: ['study-material', data.id] });
    },
    onError: (error) => {
      toast.error('Failed to update material: ' + (error instanceof Error ? error.message : 'Please try again'));
    },
  });
}

// Delete a study material
export function useDeleteStudyMaterial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (materialId: string) => {
      const { error } = await supabase
        .from('study_materials')
        .delete()
        .eq('id', materialId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study-materials'] });
      toast.success('Material deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete material: ' + (error instanceof Error ? error.message : 'Please try again'));
    },
  });
}

// Fetch tutor notes for a material
export function useTutorNotes(materialId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['tutor-notes', materialId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tutor_notes')
        .select('*')
        .eq('material_id', materialId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as TutorNotes[];
    },
    enabled: !!user && !!materialId,
  });
}

// Fetch summaries for a material
export function useSummaries(materialId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['summaries', materialId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('summaries')
        .select('*')
        .eq('material_id', materialId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Summary[];
    },
    enabled: !!user && !!materialId,
  });
}

// Fetch practice questions for a material
export function usePracticeQuestions(materialId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['practice-questions', materialId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('practice_questions')
        .select('*')
        .eq('material_id', materialId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PracticeQuestion[];
    },
    enabled: !!user && !!materialId,
  });
}

// Fetch concept map for a material
export function useConceptMap(materialId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['concept-map', materialId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('concept_maps')
        .select('*')
        .eq('material_id', materialId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as ConceptMap | null;
    },
    enabled: !!user && !!materialId,
  });
}

// Upload file to storage
export function useUploadMaterialFile() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (file: File) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${user?.id}/${fileName}`;

      const { error } = await supabase.storage
        .from('study-materials')
        .upload(filePath, file);

      if (error) throw error;

      return {
        filePath,
        fileName: file.name,
        fileSize: file.size,
        fileType: getFileType(file.type, file.name),
      };
    },
    onError: (error) => {
      toast.error('Failed to upload file: ' + (error instanceof Error ? error.message : 'Please try again'));
    },
  });
}

function getFileType(mimeType: string, fileName: string): string {
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType.includes('word') || fileName.endsWith('.docx') || fileName.endsWith('.doc')) return 'docx';
  if (mimeType.includes('presentation') || fileName.endsWith('.pptx') || fileName.endsWith('.ppt')) return 'pptx';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.startsWith('image/')) return 'image';
  return 'other';
}

// Fetch material flashcards for a material
export interface MaterialFlashcard {
  id: string;
  material_id: string;
  user_id: string;
  front: string;
  back: string;
  hint: string | null;
  difficulty: string;
  created_at: string;
  updated_at: string;
}

export function useMaterialFlashcards(materialId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['material-flashcards', materialId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('material_flashcards')
        .select('*')
        .eq('material_id', materialId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as MaterialFlashcard[];
    },
    enabled: !!user && !!materialId,
  });
}

// Saved Responses hooks
export interface SavedResponse {
  id: string;
  material_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export function useSavedResponses(materialId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['saved-responses', materialId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('saved_responses')
        .select('*')
        .eq('material_id', materialId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SavedResponse[];
    },
    enabled: !!user && !!materialId,
  });
}

export function useSaveResponse() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ materialId, content }: { materialId: string; content: string }) => {
      if (!user?.id) throw new Error('Must be logged in');

      const { data, error } = await supabase
        .from('saved_responses')
        .insert({
          material_id: materialId,
          user_id: user.id,
          content,
        })
        .select()
        .single();

      if (error) throw error;
      return data as SavedResponse;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['saved-responses', data.material_id] });
    },
  });
}

export function useDeleteSavedResponse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('saved_responses')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-responses'] });
      toast.success('Saved response removed');
    },
  });
}
