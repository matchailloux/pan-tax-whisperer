import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useOrganization } from '@/hooks/useOrganization';
import FirmClients from './FirmClients';
import FirmClientDetails from './FirmClientDetails';
import { LoadingSpinner } from '@/components/LoadingSpinner';

const FirmDashboard = () => {
  const { organization, loading, isFirmMode } = useOrganization();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isFirmMode()) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-muted-foreground mb-4">
            Accès non autorisé
          </h2>
          <p className="text-muted-foreground">
            Cette section est réservée aux cabinets comptables.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Cabinet {organization?.name}
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Gestionnaire de clients TVA Amazon - Tableau de bord cabinet
        </p>
      </div>

      <FirmClients />
    </div>
  );
};

export default FirmDashboard;