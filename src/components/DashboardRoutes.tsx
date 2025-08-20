import React from 'react';
import { Routes, Route } from 'react-router-dom';
import DashboardLayout from './DashboardLayout';
import DashboardHome from '@/pages/dashboard/DashboardHome';
import AnalysisPage from '@/pages/dashboard/AnalysisPage';
import DocumentsPage from '@/pages/dashboard/DocumentsPage';
import ReportsPage from '@/pages/dashboard/ReportsPage';
import ActivityPage from '@/pages/dashboard/ActivityPage';
import DataPage from '@/pages/dashboard/DataPage';
import SettingsPage from '@/pages/dashboard/SettingsPage';
import HelpPage from '@/pages/dashboard/HelpPage';

const DashboardRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<DashboardLayout />}>
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