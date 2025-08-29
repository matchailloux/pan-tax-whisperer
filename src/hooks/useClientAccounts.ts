import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface ClientAccount {
  id: string;
  organization_id: string;
  display_name: string;
  vat_number?: string;
  country?: string;
  oss_opt_in: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateClientAccountData {
  display_name: string;
  vat_number?: string;
  country?: string;
  oss_opt_in?: boolean;
}

export const useClientAccounts = () => {
  const [clientAccounts, setClientAccounts] = useState<ClientAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchClientAccounts = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('client_accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClientAccounts(data || []);
    } catch (error: any) {
      console.error('Error fetching client accounts:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les comptes clients",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createClientAccount = async (data: CreateClientAccountData): Promise<ClientAccount | null> => {
    if (!user) return null;

    try {
      // First get the user's organization
      const { data: memberships, error: membershipError } = await supabase
        .from('memberships')
        .select('business_id')
        .eq('user_id', user.id)
        .single();

      if (membershipError) throw membershipError;
      if (!memberships) throw new Error('No organization found');

      const { data: newAccount, error } = await supabase
        .from('client_accounts')
        .insert([{
          organization_id: memberships.business_id,
          ...data
        }])
        .select()
        .single();

      if (error) throw error;

      setClientAccounts(prev => [newAccount, ...prev]);
      toast({
        title: "Succès",
        description: `Compte client "${data.display_name}" créé avec succès`,
      });

      return newAccount;
    } catch (error: any) {
      console.error('Error creating client account:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer le compte client",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateClientAccount = async (id: string, data: Partial<CreateClientAccountData>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('client_accounts')
        .update(data)
        .eq('id', id);

      if (error) throw error;

      setClientAccounts(prev => 
        prev.map(account => 
          account.id === id 
            ? { ...account, ...data, updated_at: new Date().toISOString() }
            : account
        )
      );

      toast({
        title: "Succès",
        description: "Compte client mis à jour avec succès",
      });

      return true;
    } catch (error: any) {
      console.error('Error updating client account:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour le compte client",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteClientAccount = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('client_accounts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setClientAccounts(prev => prev.filter(account => account.id !== id));
      toast({
        title: "Succès",
        description: "Compte client supprimé avec succès",
      });

      return true;
    } catch (error: any) {
      console.error('Error deleting client account:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer le compte client",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    if (user) {
      fetchClientAccounts();
    }
  }, [user]);

  return {
    clientAccounts,
    loading,
    createClientAccount,
    updateClientAccount,
    deleteClientAccount,
    refetch: fetchClientAccounts,
  };
};