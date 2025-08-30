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

      // Nettoyage côté client (BOM) pour réduire les erreurs de parsing
      const cleanedText = csvContent.replace(/^\uFEFF/, '');
      const csvBlob = new Blob([cleanedText], { type: 'text/csv' });
      const formData = new FormData();
      formData.append('file', csvBlob, fileName);
      formData.append('upload_id', crypto.randomUUID());

      // Récupérer le JWT pour appeler l'Edge Function en multipart
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) {
        console.warn('No access token available for activity ingestion');
        return false;
      }

      const resp = await fetch('https://lxulrlyzieqvxrsgfxoj.supabase.co/functions/v1/import-activity-csv', {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${accessToken}`,
          apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4dWxybHl6aWVxdnhyc2dmeG9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2ODUxMjUsImV4cCI6MjA3MTI2MTEyNX0.pGakaRoFTQJIzwD671BgQPS2xTL3qr2tYHbfljAUztc',
        },
        body: formData,
      });

      const isAccepted = resp.status === 202;
      const data = await resp.json().catch(() => ({}));

      if (!resp.ok && !isAccepted) {
        const txt = typeof data === 'string' ? data : (data?.message || 'Import échoué');
        console.error('Activity ingestion HTTP error:', txt);
        throw new Error(txt);
      }

      console.log('Activity ingestion response:', data);
      toast({
        title: isAccepted ? 'Ingestion démarrée' : 'Données d’activité ingérées',
        description: isAccepted
          ? `Fichier reçu (upload ${data.upload_id || ''}). Traitement en arrière-plan...`
          : `${data.inserted ?? 0} lignes traitées (upload ${data.upload_id}).`,
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