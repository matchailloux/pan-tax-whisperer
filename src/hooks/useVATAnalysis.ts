import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useClientVATReports } from '@/hooks/useClientVATReports';
import { processVATWithNewRules, DetailedVATReport } from '@/utils/newVATRulesEngine';
import { processAmazonVATReport } from '@/utils/amazonVATEngine';

export interface AnalysisResult {
  success: boolean;
  data: any;
  reportId?: string;
}

export const useVATAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();
  const { saveReport } = useClientVATReports();

  // Fonction pour appeler l'Edge Function d'ingestion d'activité (automatique lors des analyses TVA)
  const ingestActivityFromFile = async (fileContent: string, fileName: string) => {
    try {
      console.log('🚀 Auto-ingestion Activité démarrée pour:', fileName);

      // Créer un blob à partir du contenu CSV
      const blob = new Blob([fileContent], { type: 'text/csv' });
      const formData = new FormData();
      formData.append('file', blob, fileName);

      // Récupérer le JWT utilisateur
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) {
        console.error('❌ Pas de token JWT pour l\'ingestion automatique');
        return false;
      }

      const resp = await fetch('https://lxulrlyzieqvxrsgfxoj.supabase.co/functions/v1/import-activity-csv', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
      });

      if (!resp.ok) {
        const err = await resp.text();
        console.error('❌ Échec ingestion automatique Activité:', err);
        return false;
      }

      const json = await resp.json();
      console.log('✅ Ingestion automatique Activité réussie:', json);

      // Déclencher le refresh des données d'activité
      window.dispatchEvent(new CustomEvent('activity-data-updated'));
      return true;
    } catch (error) {
      console.error('❌ Erreur ingestion automatique Activité:', error);
      return false;
    }
  };

  const analyzeFileContent = async (
    fileContent: string, 
    fileName: string, 
    fileId: string,
    updateFileStatus?: (fileId: string, status: string) => Promise<void>,
    clientId?: string
  ): Promise<AnalysisResult> => {
    setIsAnalyzing(true);
    
    try {
      if (updateFileStatus) {
        await updateFileStatus(fileId, 'processing');
      }

      // 🚀 Ingestion automatique pour le module Activité (parallèle à l'analyse TVA)
      console.log('🔄 Démarrage ingestion automatique Activité lors de l\'analyse TVA...');
      ingestActivityFromFile(fileContent, fileName)
        .then(success => {
          if (success) {
            console.log('✅ Ingestion automatique Activité terminée avec succès');
          } else {
            console.warn('⚠️ Ingestion automatique Activité échouée (non bloquante)');
          }
        })
        .catch(error => {
          console.warn('⚠️ Erreur ingestion automatique Activité (non bloquante):', error);
        });

      // Essai avec le moteur automatique d'abord
      const automaticReport = processVATWithNewRules(fileContent);

      if (Array.isArray(automaticReport.breakdown) && automaticReport.breakdown.length > 0) {
        // Succès avec le moteur automatique
        const reportId = await saveReport(automaticReport, `Analyse ${fileName}`, fileId, clientId);
        
        if (updateFileStatus) {
          await updateFileStatus(fileId, 'completed');
        }

        toast({
          title: "Analyse terminée",
          description: `${automaticReport.breakdown.length} pays analysés avec succès.`,
        });

        // Refresh immédiat des rapports
        window.dispatchEvent(new CustomEvent('vat-analysis-completed'));

        return {
          success: true,
          data: automaticReport,
          reportId
        };
      } else {
        // Fallback vers le moteur legacy
        const legacyReport = processAmazonVATReport(fileContent);
        const reportId = await saveReport(legacyReport, `Analyse ${fileName} (fallback)`, fileId, clientId);
        
        if (updateFileStatus) {
          await updateFileStatus(fileId, 'completed');
        }

        toast({
          title: "Analyse terminée (fallback)",
          description: "Moteur automatique n'a rien détecté, bascule vers le moteur legacy effectuée.",
        });

        // Refresh immédiat des rapports
        window.dispatchEvent(new CustomEvent('vat-analysis-completed'));

        return {
          success: true,
          data: legacyReport,
          reportId
        };
      }
    } catch (error) {
      console.error('Erreur lors de l\'analyse:', error);
      
      if (updateFileStatus) {
        await updateFileStatus(fileId, 'error');
      }

      toast({
        title: "Erreur d'analyse",
        description: "Une erreur est survenue lors de l'analyse du fichier.",
        variant: "destructive",
      });

      return {
        success: false,
        data: null
      };
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeFile = async (
    file: File,
    fileId: string,
    updateFileStatus?: (fileId: string, status: string) => Promise<void>,
    clientId?: string
  ): Promise<AnalysisResult> => {
    try {
      const fileContent = await file.text();
      return await analyzeFileContent(fileContent, file.name, fileId, updateFileStatus, clientId);
    } catch (error) {
      console.error('Erreur lors de la lecture du fichier:', error);
      toast({
        title: "Erreur de lecture",
        description: "Impossible de lire le contenu du fichier.",
        variant: "destructive",
      });
      return {
        success: false,
        data: null
      };
    }
  };

  const getStoredReport = async (reportId: string): Promise<DetailedVATReport | null> => {
    try {
      const { data, error } = await supabase
        .from('vat_reports')
        .select('report_data')
        .eq('id', reportId)
        .single();

      if (error) throw error;
      
      return (data?.report_data as unknown) as DetailedVATReport || null;
    } catch (error) {
      console.error('Erreur lors de la récupération du rapport:', error);
      return null;
    }
  };

  return {
    analyzeFile,
    analyzeFileContent,
    isAnalyzing,
    getStoredReport
  };
};