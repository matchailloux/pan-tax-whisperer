import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type VFilters = {
  from: string;
  to: string;
  currency?: string;
  country?: string | null;
  type?: 'ALL' | 'SALE' | 'REFUND' | 'RETURN';
  includeNegatives?: boolean;
  interval?: 'month' | 'day' | 'week' | 'quarter' | 'year';
};

export const useVentesKpis = (f: VFilters) => useQuery({
  queryKey: ['ventes_kpis', f],
  queryFn: async () => {
    const { data, error } = await supabase.rpc('ventes_kpis', {
      p_from: f.from,
      p_to: f.to,
      p_currency: f.currency || 'EUR',
      p_country: f.country ?? null,
      p_type: f.type || 'ALL',
      p_include_negatives: f.includeNegatives ?? true
    });
    if (error) throw error;
    return data?.[0];
  }
});

export const useVentesCountryTotals = (f: VFilters) => useQuery({
  queryKey: ['ventes_country_totals', f],
  queryFn: async () => {
    const { data, error } = await supabase.rpc('ventes_country_totals', {
      p_from: f.from,
      p_to: f.to,
      p_currency: f.currency || 'EUR',
      p_type: f.type || 'ALL',
      p_include_negatives: f.includeNegatives ?? true
    });
    if (error) throw error;
    return data || [];
  }
});

export const useVentesCountryVatRateTotals = (f: VFilters) => useQuery({
  queryKey: ['ventes_country_vat_rate_totals', f],
  queryFn: async () => {
    const { data, error } = await supabase.rpc('ventes_country_vat_rate_totals', {
      p_from: f.from,
      p_to: f.to,
      p_currency: f.currency || 'EUR',
      p_type: f.type || 'ALL',
      p_include_negatives: f.includeNegatives ?? true
    });
    if (error) throw error;
    return data || [];
  }
});

export const useVentesTimeseries = (f: VFilters, metric: 'gross' | 'net' | 'tax' | 'transactions') => useQuery({
  queryKey: ['ventes_timeseries', f, metric],
  queryFn: async () => {
    const { data, error } = await supabase.rpc('ventes_timeseries', {
      p_metric: metric,
      p_interval: f.interval || 'month',
      p_from: f.from,
      p_to: f.to,
      p_currency: f.currency || 'EUR',
      p_type: f.type || 'ALL',
      p_include_negatives: f.includeNegatives ?? true
    });
    if (error) throw error;
    return data || [];
  }
});

export const useVentesTypeBreakdown = (f: VFilters) => useQuery({
  queryKey: ['ventes_breakdown_type', f],
  queryFn: async () => {
    const { data, error } = await supabase.rpc('ventes_breakdown_type', {
      p_from: f.from,
      p_to: f.to,
      p_currency: f.currency || 'EUR',
      p_include_negatives: f.includeNegatives ?? true
    });
    if (error) throw error;
    return data || [];
  }
});