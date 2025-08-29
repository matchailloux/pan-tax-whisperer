import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type OrganizationType = 'INDIVIDUAL' | 'FIRM';

export interface Organization {
  id: string;
  name: string;
  type: OrganizationType;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface UserMembership {
  id: string;
  business_id: string;
  role: string;
  location_id?: string;
  created_at: string;
  updated_at: string;
  businesses: {
    id: string;
    name: string;
    type: string;
    description?: string;
    created_at: string;
    updated_at: string;
  };
}

export const useOrganization = () => {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [membership, setMembership] = useState<UserMembership | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchOrganization = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Get user's membership and organization
      const { data, error } = await supabase
        .from('memberships')
        .select(`
          *,
          businesses (
            id,
            name,
            type,
            description,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', user.id)
        .single();

      if (error) {
        // If no membership exists, this might be a new user
        console.warn('No organization membership found:', error);
        setOrganization(null);
        setMembership(null);
        return;
      }

      setMembership(data);
      setOrganization({
        id: data.businesses.id,
        name: data.businesses.name,
        type: data.businesses.type as OrganizationType,
        description: data.businesses.description,
        created_at: data.businesses.created_at,
        updated_at: data.businesses.updated_at,
      });
    } catch (error: any) {
      console.error('Error fetching organization:', error);
    } finally {
      setLoading(false);
    }
  };

  const isFirmMode = (): boolean => {
    return organization?.type === 'FIRM';
  };

  const isIndividualMode = (): boolean => {
    return organization?.type === 'INDIVIDUAL';
  };

  const canManageClients = (): boolean => {
    if (!membership || !isFirmMode()) return false;
    return ['ORG_ADMIN', 'FIRM_ADMIN'].includes(membership.role);
  };

  const canCreateInvitations = (): boolean => {
    if (!membership || !isFirmMode()) return false;
    return ['ORG_ADMIN', 'FIRM_ADMIN', 'ACCOUNTANT'].includes(membership.role);
  };

  const canViewAllClients = (): boolean => {
    if (!membership || !isFirmMode()) return false;
    return ['ORG_ADMIN', 'FIRM_ADMIN'].includes(membership.role);
  };

  useEffect(() => {
    if (user) {
      fetchOrganization();
    }
  }, [user]);

  return {
    organization,
    membership,
    loading,
    isFirmMode,
    isIndividualMode,
    canManageClients,
    canCreateInvitations,
    canViewAllClients,
    refetch: fetchOrganization,
  };
};