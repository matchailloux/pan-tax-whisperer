import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Invitation {
  id: string;
  client_account_id: string;
  period: string;
  token_hash: string;
  expires_at: string;
  max_uses: number;
  used_count: number;
  created_by: string;
  created_at: string;
  client_accounts?: {
    display_name: string;
    vat_number?: string;
  };
}

export interface CreateInvitationData {
  client_account_id: string;
  period: string;
  max_uses?: number;
  ttl_hours?: number;
}

export const useInvitations = () => {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchInvitations = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('invitations')
        .select(`
          *,
          client_accounts (
            display_name,
            vat_number
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvitations(data || []);
    } catch (error: any) {
      console.error('Error fetching invitations:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les invitations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createInvitation = async (data: CreateInvitationData): Promise<string | null> => {
    if (!user) return null;

    try {
      // Generate a secure token
      const token = crypto.randomUUID();
      const tokenHash = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(token)
      );
      const tokenHashBase64 = btoa(String.fromCharCode(...new Uint8Array(tokenHash)));

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + (data.ttl_hours || 168)); // Default 7 days

      const { data: newInvitation, error } = await supabase
        .from('invitations')
        .insert([{
          client_account_id: data.client_account_id,
          period: data.period,
          token_hash: tokenHashBase64,
          expires_at: expiresAt.toISOString(),
          max_uses: data.max_uses || 1,
          created_by: user.id,
        }])
        .select(`
          *,
          client_accounts (
            display_name,
            vat_number
          )
        `)
        .single();

      if (error) throw error;

      setInvitations(prev => [newInvitation, ...prev]);
      toast({
        title: "Succès",
        description: "Invitation créée avec succès",
      });

      // Return the plain token for the invitation link
      return token;
    } catch (error: any) {
      console.error('Error creating invitation:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer l'invitation",
        variant: "destructive",
      });
      return null;
    }
  };

  const validateInvitation = async (token: string): Promise<Invitation | null> => {
    try {
      const tokenHash = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(token)
      );
      const tokenHashBase64 = btoa(String.fromCharCode(...new Uint8Array(tokenHash)));

      const { data, error } = await supabase
        .from('invitations')
        .select(`
          *,
          client_accounts (
            display_name,
            vat_number,
            organization_id,
            businesses (
              name
            )
          )
        `)
        .eq('token_hash', tokenHashBase64)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error validating invitation:', error);
      return null;
    }
  };

  const incrementInvitationUsage = async (invitationId: string): Promise<boolean> => {
    try {
      // First get current count, then increment
      const { data: current, error: fetchError } = await supabase
        .from('invitations')
        .select('used_count')
        .eq('id', invitationId)
        .single();

      if (fetchError) throw fetchError;

      const { error } = await supabase
        .from('invitations')
        .update({ used_count: (current.used_count || 0) + 1 })
        .eq('id', invitationId);

      if (error) throw error;
      return true;
    } catch (error: any) {
      console.error('Error incrementing invitation usage:', error);
      return false;
    }
  };

  useEffect(() => {
    if (user) {
      fetchInvitations();
    }
  }, [user]);

  return {
    invitations,
    loading,
    createInvitation,
    validateInvitation,
    incrementInvitationUsage,
    refetch: fetchInvitations,
  };
};