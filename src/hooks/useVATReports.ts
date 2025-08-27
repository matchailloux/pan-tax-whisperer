import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface VATReport {
  id: string;
  user_id: string;
  file_id: string | null;
  report_name: string;
  report_data: any;
  total_amount: number;
  currency: string;
  analysis_date: string;
  created_at: string;
  updated_at: string;
}

export const useVATReports = () => {
  const [reports, setReports] = useState<VATReport[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchReports = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('vat_reports')
        .select(`
          *,
          user_files (
            file_name,
            upload_date
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les rapports",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveReport = async (
    reportData: any,
    fileName: string,
    fileId?: string
  ): Promise<string | null> => {
    if (!user) return null;

    try {
      // Calculate total amount from report data (support both engines)
      let totalAmount = 0;
      if (Array.isArray(reportData?.pivotView)) {
        totalAmount = reportData.pivotView.reduce(
          (sum: number, item: any) => sum + (item.total || 0),
          0
        );
      } else if (Array.isArray(reportData?.breakdown)) {
        totalAmount = reportData.breakdown.reduce(
          (sum: number, item: any) => {
            if (typeof item.total === 'number') return sum + item.total;
            const v =
              (item.oss || 0) +
              (item.domesticB2C || item.localB2C || 0) +
              (item.domesticB2B || item.localB2B || 0) +
              (item.intracommunautaire || 0) +
              (item.suisse || 0) +
              (item.residuel || 0);
            return sum + v;
          },
          0
        );
      }

      const { data, error } = await supabase
        .from('vat_reports')
        .insert({
          user_id: user.id,
          file_id: fileId || null,
          report_name: fileName,
          report_data: reportData,
          total_amount: totalAmount,
          currency: 'EUR',
          analysis_date: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      await fetchReports();
      
      toast({
        title: "Rapport sauvegardé",
        description: `Le rapport "${fileName}" a été sauvegardé`,
      });

      return data.id;
    } catch (error) {
      console.error('Error saving report:', error);
      toast({
        title: "Erreur de sauvegarde",
        description: "Impossible de sauvegarder le rapport",
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteReport = async (reportId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('vat_reports')
        .delete()
        .eq('id', reportId)
        .eq('user_id', user.id);

      if (error) throw error;

      await fetchReports();
      
      toast({
        title: "Rapport supprimé",
        description: "Le rapport a été supprimé avec succès",
      });
    } catch (error) {
      console.error('Error deleting report:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le rapport",
        variant: "destructive",
      });
    }
  };

  const getReportsByPeriod = (startDate: Date, endDate: Date) => {
    return reports.filter(report => {
      const reportDate = new Date(report.analysis_date);
      return reportDate >= startDate && reportDate <= endDate;
    });
  };

  const getTotalAmountByPeriod = (startDate: Date, endDate: Date) => {
    const periodReports = getReportsByPeriod(startDate, endDate);
    return periodReports.reduce((sum, report) => sum + report.total_amount, 0);
  };

  const getReportsStats = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const thisMonthReports = getReportsByPeriod(startOfMonth, now);
    const lastMonthReports = getReportsByPeriod(startOfLastMonth, endOfLastMonth);

    const thisMonthTotal = getTotalAmountByPeriod(startOfMonth, now);
    const lastMonthTotal = getTotalAmountByPeriod(startOfLastMonth, endOfLastMonth);

    const reportsGrowth = lastMonthReports.length > 0 
      ? ((thisMonthReports.length - lastMonthReports.length) / lastMonthReports.length * 100)
      : thisMonthReports.length > 0 ? 100 : 0;

    const amountGrowth = lastMonthTotal > 0
      ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal * 100)
      : thisMonthTotal > 0 ? 100 : 0;

    return {
      totalReports: reports.length,
      thisMonthReports: thisMonthReports.length,
      thisMonthTotal,
      reportsGrowth,
      amountGrowth,
      lastReport: reports[0] || null
    };
  };

  useEffect(() => {
    fetchReports();
  }, [user]);

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