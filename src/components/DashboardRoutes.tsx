import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useOrganization } from '@/hooks/useOrganization';
import IndividualDashboardLayout from './IndividualDashboardLayout';
import FirmDashboardLayout from './FirmDashboardLayout';
import DashboardHome from '@/pages/dashboard/DashboardHome';
import AnalysisPage from '@/pages/dashboard/AnalysisPage';
import DocumentsPage from '@/pages/dashboard/DocumentsPage';
import ReportsPage from '@/pages/dashboard/ReportsPage';
import ActivityPage from '@/pages/dashboard/ActivityPage';
import DataPage from '@/pages/dashboard/DataPage';
import SettingsPage from '@/pages/dashboard/SettingsPage';
import HelpPage from '@/pages/dashboard/HelpPage';
import FirmDashboard from '@/pages/dashboard/FirmDashboard';
import FirmClients from '@/pages/dashboard/FirmClients';
import FirmClientDetails from '@/pages/dashboard/FirmClientDetails';
import FirmReports from '@/pages/dashboard/FirmReports';
import FirmActivity from '@/pages/dashboard/FirmActivity';
import FirmSettings from '@/pages/dashboard/FirmSettings';
import FirmHelp from '@/pages/dashboard/FirmHelp';

import { LoadingSpinner } from '@/components/LoadingSpinner';

const DashboardRoutes = () => {
  const { isFirmMode, loading } = useOrganization();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (isFirmMode()) {
    // Interface Cabinet Comptable
    return (
      <Routes>
        <Route path="/*" element={<FirmDashboardLayout />}> 
          {/* redirige /dashboard vers /dashboard/firm */}
          <Route index element={<Navigate to="firm" replace />} />
          <Route path="firm" element={<FirmDashboard />} />
          <Route path="firm/clients" element={<FirmClients />} />
          <Route path="firm/clients/:clientId" element={<FirmClientDetails />} />
          <Route path="firm/reports" element={<FirmReports />} />
          <Route path="firm/activity" element={<FirmActivity />} />
          <Route path="firm/settings" element={<FirmSettings />} />
          <Route path="firm/help" element={<FirmHelp />} />
        </Route>
      </Routes>
    );
  }

  // Interface Individuelle
  return (
    <Routes>
      <Route path="/*" element={<IndividualDashboardLayout />}> 
        <Route index element={<DashboardHome />} />
        <Route path="analysis" element={<AnalysisPage />} />
        <Route path="documents" element={<DocumentsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="activity" element={<ActivityPage />} />
        
        <Route path="data" element={<DataPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="help" element={<HelpPage />} />
      </Route>
    </Routes>
  );
};

export default DashboardRoutes;