import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useVATReports } from '@/hooks/useVATReports';
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
  const { saveReport } = useVATReports();

  const analyzeFileContent = async (
    fileContent: string, 
    fileName: string, 
    fileId: string,
    updateFileStatus?: (fileId: string, status: string) => Promise<void>
  ): Promise<AnalysisResult> => {
    setIsAnalyzing(true);
    
    try {
      if (updateFileStatus) {
        await updateFileStatus(fileId, 'processing');
      }

      // Essai avec le moteur automatique d'abord
      const automaticReport = processVATWithNewRules(fileContent);

      if (Array.isArray(automaticReport.breakdown) && automaticReport.breakdown.length > 0) {
        // Succès avec le moteur automatique
        const reportId = await saveReport(automaticReport, `Analyse ${fileName}`, fileId);
        
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
        const reportId = await saveReport(legacyReport, `Analyse ${fileName} (fallback)`, fileId);
        
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
    updateFileStatus?: (fileId: string, status: string) => Promise<void>
  ): Promise<AnalysisResult> => {
    try {
      const fileContent = await file.text();
      return await analyzeFileContent(fileContent, file.name, fileId, updateFileStatus);
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