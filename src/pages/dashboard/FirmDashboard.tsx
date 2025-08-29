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
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-accent/5">
      <div className="bg-card/50 backdrop-blur-sm border-b border-border/50 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-3">
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Cabinet {organization?.name}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Gestionnaire de clients TVA Amazon - Tableau de bord cabinet
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <Routes>
          <Route index element={<FirmClients />} />
          <Route path="clients" element={<FirmClients />} />
          <Route path="clients/:clientId" element={<FirmClientDetails />} />
        </Routes>
      </div>
    </div>
  );
};

export default FirmDashboard;