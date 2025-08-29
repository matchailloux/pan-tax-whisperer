import { useState } from 'react';
import { useClientFiles } from '@/hooks/useClientFiles';
import { useVATAnalysis } from '@/hooks/useVATAnalysis';
import { useToast } from '@/hooks/use-toast';

export const usePublicUpload = (clientId: string) => {
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const { uploadFile, updateFileStatus } = useClientFiles(clientId);
  const { analyzeFile } = useVATAnalysis();
  const { toast } = useToast();

  const handleFileUpload = async (file: File) => {
    setUploadStatus('uploading');
    setUploadProgress(0);

    try {
      // Simulation de progression pour l'upload
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 70));
      }, 200);

      // Upload du fichier vers Supabase Storage
      const fileId = await uploadFile(file, clientId);

      clearInterval(progressInterval);
      setUploadProgress(80);

      if (fileId) {
        // Analyse automatique du fichier
        const analysisResult = await analyzeFile(file, fileId, updateFileStatus, clientId);
        
        setUploadProgress(100);

        if (analysisResult.success) {
          setUploadStatus('success');
          toast({
            title: "Fichier traité avec succès",
            description: "Votre fichier a été uploadé et analysé automatiquement.",
          });
        } else {
          setUploadStatus('error');
        }
      } else {
        setUploadStatus('error');
      }
    } catch (error) {
      console.error('Erreur lors de l\'upload public:', error);
      setUploadStatus('error');
      toast({
        title: "Erreur d'upload",
        description: "Une erreur est survenue lors du téléchargement.",
        variant: "destructive",
      });
    }
  };

  return {
    uploadStatus,
    uploadProgress,
    handleFileUpload,
    setUploadStatus,
    setUploadProgress
  };
};