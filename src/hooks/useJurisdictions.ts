import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Jurisdiction {
  id: string;
  jurisdiction: string;
  taxId: string;
  validFrom: Date;
  validUntil?: Date;
  permanentEstablishment: boolean;
  registeredInImportScheme: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const useJurisdictions = () => {
  const [jurisdictions, setJurisdictions] = useState<Jurisdiction[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchJurisdictions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('jurisdictions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedData = data?.map(item => ({
        id: item.id,
        jurisdiction: item.jurisdiction,
        taxId: item.tax_id,
        validFrom: new Date(item.valid_from),
        validUntil: item.valid_until ? new Date(item.valid_until) : undefined,
        permanentEstablishment: item.permanent_establishment,
        registeredInImportScheme: item.registered_in_import_scheme,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
      })) || [];

      setJurisdictions(mappedData);
    } catch (error) {
      console.error('Error fetching jurisdictions:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les juridictions.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveJurisdiction = async (jurisdiction: Omit<Jurisdiction, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const { data, error } = await supabase
        .from('jurisdictions')
        .insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          jurisdiction: jurisdiction.jurisdiction,
          tax_id: jurisdiction.taxId,
          valid_from: jurisdiction.validFrom.toISOString().split('T')[0],
          valid_until: jurisdiction.validUntil?.toISOString().split('T')[0],
          permanent_establishment: jurisdiction.permanentEstablishment,
          registered_in_import_scheme: jurisdiction.registeredInImportScheme,
        })
        .select()
        .single();

      if (error) throw error;

      await fetchJurisdictions();
      return data.id;
    } catch (error) {
      console.error('Error saving jurisdiction:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la juridiction.",
        variant: "destructive"
      });
      return null;
    }
  };

  const updateJurisdiction = async (id: string, jurisdiction: Partial<Omit<Jurisdiction, 'id' | 'createdAt' | 'updatedAt'>>) => {
    try {
      const updateData: any = {};
      
      if (jurisdiction.jurisdiction) updateData.jurisdiction = jurisdiction.jurisdiction;
      if (jurisdiction.taxId) updateData.tax_id = jurisdiction.taxId;
      if (jurisdiction.validFrom) updateData.valid_from = jurisdiction.validFrom.toISOString().split('T')[0];
      if (jurisdiction.validUntil !== undefined) {
        updateData.valid_until = jurisdiction.validUntil?.toISOString().split('T')[0] || null;
      }
      if (jurisdiction.permanentEstablishment !== undefined) updateData.permanent_establishment = jurisdiction.permanentEstablishment;
      if (jurisdiction.registeredInImportScheme !== undefined) updateData.registered_in_import_scheme = jurisdiction.registeredInImportScheme;

      const { error } = await supabase
        .from('jurisdictions')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      await fetchJurisdictions();
      return true;
    } catch (error) {
      console.error('Error updating jurisdiction:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la juridiction.",
        variant: "destructive"
      });
      return false;
    }
  };

  const deleteJurisdiction = async (id: string) => {
    try {
      const { error } = await supabase
        .from('jurisdictions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchJurisdictions();
      return true;
    } catch (error) {
      console.error('Error deleting jurisdiction:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la juridiction.",
        variant: "destructive"
      });
      return false;
    }
  };

  useEffect(() => {
    fetchJurisdictions();
  }, []);

  return {
    jurisdictions,
    loading,
    saveJurisdiction,
    updateJurisdiction,
    deleteJurisdiction,
    refetch: fetchJurisdictions,
  };
};