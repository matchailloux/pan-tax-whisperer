import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useOrganization } from '@/hooks/useOrganization';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface RequireIndividualProps {
  children: ReactNode;
}

export default function RequireIndividual({ children }: RequireIndividualProps) {
  const { organization, loading } = useOrganization();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!organization || organization.type !== 'INDIVIDUAL') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}