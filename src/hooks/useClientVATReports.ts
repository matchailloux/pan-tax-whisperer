import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface VATReport {
  id: string;
  user_id: string;
  client_account_id?: string;
  report_name: string;
  report_data: any;
  total_amount: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export const useClientVATReports = (clientAccountId?: string) => {
  const [reports, setReports] = useState<VATReport[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchReports = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      let query = supabase
        .from('vat_reports')
        .select('*')
        .order('created_at', { ascending: false });

      // Si clientAccountId est fourni, filtrer par client
      if (clientAccountId) {
        query = query.eq('client_account_id', clientAccountId);
      } else {
        // Sinon, récupérer uniquement les rapports individuels (sans client)
        query = query.is('client_account_id', null);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erreur lors de la récupération des rapports:', error);
        return;
      }

      setReports(data || []);
    } catch (error) {
      console.error('Erreur lors de la récupération des rapports:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveReport = async (
    reportData: any, 
    fileName: string, 
    fileId?: string,
    clientId?: string
  ): Promise<string | null> => {
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }

    try {
      // Calculer le montant total à partir des données du rapport
      let totalAmount = 0;
      if (reportData && Array.isArray(reportData.transactions)) {
        totalAmount = reportData.transactions.reduce((sum: number, transaction: any) => {
          return sum + (parseFloat(transaction.amount) || 0);
        }, 0);
      }

      const { data, error } = await supabase
        .from('vat_reports')
        .insert({
          user_id: user.id,
          client_account_id: clientId || null,
          report_name: fileName,
          report_data: reportData,
          total_amount: totalAmount,
          currency: 'EUR' // Par défaut, pourrait être dynamique
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Rafraîchir la liste
      await fetchReports();
      
      return data.id;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du rapport:', error);
      throw error;
    }
  };

  const deleteReport = async (reportId: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('vat_reports')
        .delete()
        .eq('id', reportId);

      if (error) {
        throw error;
      }

      // Mettre à jour le state local
      setReports(prev => prev.filter(r => r.id !== reportId));
    } catch (error) {
      console.error('Erreur lors de la suppression du rapport:', error);
      throw error;
    }
  };

  const getReportsByPeriod = (startDate: Date, endDate: Date) => {
    return reports.filter(report => {
      const reportDate = new Date(report.created_at);
      return reportDate >= startDate && reportDate <= endDate;
    });
  };

  const getTotalAmountByPeriod = (startDate: Date, endDate: Date) => {
    const periodReports = getReportsByPeriod(startDate, endDate);
    return periodReports.reduce((sum, report) => sum + report.total_amount, 0);
  };

  const getReportsStats = () => {
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const currentMonthReports = getReportsByPeriod(currentMonth, now);
    const lastMonthReports = getReportsByPeriod(lastMonth, lastMonthEnd);

    const currentMonthTotal = getTotalAmountByPeriod(currentMonth, now);
    const lastMonthTotal = getTotalAmountByPeriod(lastMonth, lastMonthEnd);

    const growth = lastMonthTotal > 0 
      ? ((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 
      : 0;

    return {
      totalReports: reports.length,
      currentMonthReports: currentMonthReports.length,
      lastMonthReports: lastMonthReports.length,
      currentMonthTotal,
      lastMonthTotal,
      growth
    };
  };

  useEffect(() => {
    if (user) {
      fetchReports();
    }
  }, [user, clientAccountId]);

  // Écouter les événements de nouvelles analyses
  useEffect(() => {
    const handleAnalysisCompleted = () => {
      fetchReports();
    };

    window.addEventListener('vat-analysis-completed', handleAnalysisCompleted);
    return () => window.removeEventListener('vat-analysis-completed', handleAnalysisCompleted);
  }, [fetchReports]);

  return {
    reports,
    loading,
    saveReport,
    deleteReport,
    getReportsByPeriod,
    getTotalAmountByPeriod,
    getReportsStats,
    refetch: fetchReports
  };
};