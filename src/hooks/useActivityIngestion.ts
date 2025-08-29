import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useOrganization } from '@/hooks/useOrganization';

export const useActivityIngestion = () => {
  const { toast } = useToast();
  const { organization } = useOrganization();

  const ingestFromCSV = async (csvContent: string, fileName: string): Promise<boolean> => {
    // Vérifier que c'est bien un utilisateur INDIVIDUAL
    if (!organization || organization.type !== 'INDIVIDUAL') {
      console.log('Activity ingestion skipped - not individual user');
      return false;
    }

    try {
      console.log('Starting activity ingestion for:', fileName);

      // Créer un blob CSV pour l'envoi
      const csvBlob = new Blob([csvContent], { type: 'text/csv' });
      const formData = new FormData();
      formData.append('file', csvBlob, fileName);

      // Appeler l'Edge Function d'ingestion
      const { data, error } = await supabase.functions.invoke('ingest-activity', {
        body: formData
      });

      if (error) {
        console.error('Activity ingestion error:', error);
        throw error;
      }

      console.log('Activity ingestion successful:', data);
      
      toast({
        title: "Données d'activité ingérées",
        description: `${data.rows_processed} transactions Amazon traitées pour le module Activité.`,
      });

      // Déclencher un refresh des données d'activité
      window.dispatchEvent(new CustomEvent('activity-data-updated'));

      return true;
    } catch (error) {
      console.error('Error in activity ingestion:', error);
      
      // Ne pas afficher d'erreur à l'utilisateur car c'est un processus en arrière-plan
      // L'analyse TVA reste prioritaire
      console.warn('Activity ingestion failed but VAT analysis continues');
      
      return false;
    }
  };

  return {
    ingestFromCSV
  };
};