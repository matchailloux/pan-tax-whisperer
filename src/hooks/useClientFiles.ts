import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UserFile {
  id: string;
  user_id: string;
  client_account_id?: string;
  file_name: string;
  file_size: number;
  file_type: string;
  analysis_status: string;
  storage_path: string;
  upload_date: string;
  created_at: string;
  period?: string;
}

export const useClientFiles = (clientAccountId?: string) => {
  const [files, setFiles] = useState<UserFile[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchFiles = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      let query = supabase
        .from('user_files')
        .select('*')
        .order('created_at', { ascending: false });

      // Si clientAccountId est fourni, filtrer par client
      if (clientAccountId) {
        query = query.eq('client_account_id', clientAccountId);
      } else {
        // Sinon, récupérer uniquement les fichiers individuels (sans client)
        query = query.is('client_account_id', null);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erreur lors de la récupération des fichiers:', error);
        return;
      }

      setFiles(data || []);
    } catch (error) {
      console.error('Erreur lors de la récupération des fichiers:', error);
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (file: File, clientId?: string): Promise<string | null> => {
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }

    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${clientId || 'personal'}/${Date.now()}.${fileExt}`;

      // Upload vers Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('user-files')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Enregistrer les métadonnées en base
      const { data, error: dbError } = await supabase
        .from('user_files')
        .insert({
          user_id: user.id,
          client_account_id: clientId || null,
          file_name: file.name,
          file_size: file.size,
          storage_path: filePath,
          analysis_status: 'pending'
        })
        .select()
        .single();

      if (dbError) {
        throw dbError;
      }

      // Rafraîchir la liste
      await fetchFiles();
      
      return data.id;
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      throw error;
    }
  };

  const updateFileStatus = async (fileId: string, status: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('user_files')
        .update({ 
          analysis_status: status
        })
        .eq('id', fileId);

      if (error) {
        throw error;
      }

      // Mettre à jour le state local
      setFiles(prev => 
        prev.map(file => 
          file.id === fileId 
            ? { ...file, analysis_status: status }
            : file
        )
      );
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      throw error;
    }
  };

  const deleteFile = async (fileId: string): Promise<void> => {
    try {
      const file = files.find(f => f.id === fileId);
      if (!file) return;

      // Supprimer de Supabase Storage
      const { error: storageError } = await supabase.storage
        .from('user-files')
        .remove([file.storage_path]);

      if (storageError) {
        console.warn('Erreur lors de la suppression du fichier storage:', storageError);
      }

      // Supprimer de la base de données
      const { error: dbError } = await supabase
        .from('user_files')
        .delete()
        .eq('id', fileId);

      if (dbError) {
        throw dbError;
      }

      // Mettre à jour le state local
      setFiles(prev => prev.filter(f => f.id !== fileId));
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      throw error;
    }
  };

  const getFileContent = async (fileId: string): Promise<string | null> => {
    try {
      const file = files.find(f => f.id === fileId);
      if (!file) return null;

      const { data, error } = await supabase.storage
        .from('user-files')
        .download(file.storage_path);

      if (error) {
        throw error;
      }

      return await data.text();
    } catch (error) {
      console.error('Erreur lors de la récupération du contenu:', error);
      return null;
    }
  };

  useEffect(() => {
    if (user) {
      fetchFiles();
    }
  }, [user, clientAccountId]);

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