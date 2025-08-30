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

      // Récupérer le JWT pour appeler l'Edge Function en multipart
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) {
        console.warn('No access token available for activity ingestion');
        return false;
      }

      const { data, error } = await supabase.functions.invoke('import-activity-csv', {
        body: formData,
      });

      if (error || !data?.ok) {
        throw new Error(error?.message || JSON.stringify(data));
      }

      console.log('Activity ingestion successful:', data);
      
      toast({
        title: "Données d'activité ingérées",
        description: `${data.inserted ?? 0} lignes traitées (upload ${data.upload_id}).`,
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