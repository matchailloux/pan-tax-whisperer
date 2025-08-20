import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface UserFile {
  id: string;
  user_id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  upload_date: string;
  analysis_status: 'pending' | 'processing' | 'completed' | 'error';
  storage_path: string | null;
  created_at: string;
}

export const useUserFiles = () => {
  const [files, setFiles] = useState<UserFile[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchFiles = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_files')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFiles((data || []) as UserFile[]);
    } catch (error) {
      console.error('Error fetching files:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les fichiers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    if (!user) return null;

    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('user-files')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Save file metadata to database
      const { data, error: dbError } = await supabase
        .from('user_files')
        .insert({
          user_id: user.id,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          storage_path: fileName,
          analysis_status: 'pending'
        })
        .select()
        .single();

      if (dbError) throw dbError;

      await fetchFiles();
      
      toast({
        title: "Fichier uploadé",
        description: `${file.name} a été sauvegardé avec succès`,
      });

      return data.id;
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Erreur d'upload",
        description: "Impossible de sauvegarder le fichier",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateFileStatus = async (fileId: string, status: UserFile['analysis_status']) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_files')
        .update({ analysis_status: status })
        .eq('id', fileId)
        .eq('user_id', user.id);

      if (error) throw error;
      await fetchFiles();
    } catch (error) {
      console.error('Error updating file status:', error);
    }
  };

  const deleteFile = async (fileId: string) => {
    if (!user) return;

    try {
      // Get file info first
      const { data: fileData } = await supabase
        .from('user_files')
        .select('storage_path')
        .eq('id', fileId)
        .eq('user_id', user.id)
        .single();

      if (fileData?.storage_path) {
        // Delete from storage
        await supabase.storage
          .from('user-files')
          .remove([fileData.storage_path]);
      }

      // Delete from database
      const { error } = await supabase
        .from('user_files')
        .delete()
        .eq('id', fileId)
        .eq('user_id', user.id);

      if (error) throw error;

      await fetchFiles();
      
      toast({
        title: "Fichier supprimé",
        description: "Le fichier a été supprimé avec succès",
      });
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le fichier",
        variant: "destructive",
      });
    }
  };

  const getFileContent = async (fileId: string): Promise<string | null> => {
    if (!user) return null;

    try {
      const { data: fileData } = await supabase
        .from('user_files')
        .select('storage_path')
        .eq('id', fileId)
        .eq('user_id', user.id)
        .single();

      if (!fileData?.storage_path) return null;

      const { data: fileBlob } = await supabase.storage
        .from('user-files')
        .download(fileData.storage_path);

      if (!fileBlob) return null;

      return await fileBlob.text();
    } catch (error) {
      console.error('Error getting file content:', error);
      return null;
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [user]);

  return {
    files,
    loading,
    uploadFile,
    updateFileStatus,
    deleteFile,
    getFileContent,
    refetch: fetchFiles
  };
};