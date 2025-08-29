import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/hooks/useOrganization';
import { useClientAccounts } from '@/hooks/useClientAccounts';

export const useAccountantDashboard = () => {
  const [dashboardStats, setDashboardStats] = useState({
    totalClients: 0,
    activeFiles: 0,
    pendingAnalyses: 0,
    completedReportsThisMonth: 0
  });
  const [loading, setLoading] = useState(true);
  
  const { user } = useAuth();
  const { organization, isFirmMode } = useOrganization();
  const { clientAccounts } = useClientAccounts();

  const fetchDashboardStats = async () => {
    if (!user || !isFirmMode() || !organization) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Calculer les statistiques de base
      const totalClients = clientAccounts.length;
      
      // TODO: Ajouter des requêtes pour récupérer:
      // - Nombre de fichiers actifs en cours d'analyse
      // - Nombre d'analyses en attente
      // - Nombre de rapports complétés ce mois
      
      setDashboardStats({
        totalClients,
        activeFiles: 0, // Sera implémenté avec les vrais données
        pendingAnalyses: 0,
        completedReportsThisMonth: 0
      });
      
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRecentActivity = () => {
    // TODO: Implémenter la récupération de l'activité récente
    // - Nouveaux fichiers uploadés par les clients
    // - Analyses récemment complétées
    // - Invitations récemment envoyées
    return [];
  };

  const getClientAlerts = () => {
    // TODO: Implémenter les alertes pour les clients
    // - Clients sans fichier depuis X jours
    // - Analyses en erreur
    // - Invitations expirées
    return [];
  };

  useEffect(() => {
    fetchDashboardStats();
  }, [user, organization, clientAccounts]);

  return {
    dashboardStats,
    loading,
    recentActivity: getRecentActivity(),
    clientAlerts: getClientAlerts(),
    refetch: fetchDashboardStats
  };
};