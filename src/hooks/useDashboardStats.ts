import { useState, useEffect } from 'react';
import { useUserFiles } from './useUserFiles';
import { useVATReports } from './useVATReports';

export const useDashboardStats = () => {
  const { files } = useUserFiles();
  const { reports, getReportsStats } = useVATReports();
  const [stats, setStats] = useState({
    filesProcessed: 0,
    filesGrowth: 0,
    totalVATCollected: 0,
    vatGrowth: 0,
    reportsGenerated: 0,
    reportsGrowth: 0,
    analysesThisMonth: 0,
    analysesGrowth: 0,
    lastActivity: null as Date | null
  });

  useEffect(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Files stats
    const thisMonthFiles = files.filter(file => 
      new Date(file.upload_date) >= startOfMonth
    );
    const lastMonthFiles = files.filter(file => {
      const fileDate = new Date(file.upload_date);
      return fileDate >= startOfLastMonth && fileDate <= endOfLastMonth;
    });

    const filesGrowth = lastMonthFiles.length > 0 
      ? ((thisMonthFiles.length - lastMonthFiles.length) / lastMonthFiles.length * 100)
      : thisMonthFiles.length > 0 ? 100 : 0;

    // Reports stats
    const reportsStats = getReportsStats();

    // Last activity
    const lastActivity = files.length > 0 || reports.length > 0
      ? new Date(Math.max(
          ...files.map(f => new Date(f.created_at).getTime()),
          ...reports.map(r => new Date(r.created_at).getTime())
        ))
      : null;

    setStats({
      filesProcessed: files.length,
      filesGrowth,
      totalVATCollected: reportsStats.thisMonthTotal,
      vatGrowth: reportsStats.amountGrowth,
      reportsGenerated: reportsStats.totalReports,
      reportsGrowth: reportsStats.reportsGrowth,
      analysesThisMonth: reportsStats.thisMonthReports,
      analysesGrowth: reportsStats.reportsGrowth,
      lastActivity
    });
  }, [files, reports]);

  const formatGrowth = (growth: number) => {
    if (growth === 0) return "+0%";
    const sign = growth > 0 ? "+" : "";
    return `${sign}${growth.toFixed(1)}%`;
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatLastActivity = (date: Date | null) => {
    if (!date) return "Aucune activité";
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "À l'instant";
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
    
    return date.toLocaleDateString('fr-FR');
  };

  return {
    stats,
    formatGrowth,
    formatAmount,
    formatLastActivity
  };
};