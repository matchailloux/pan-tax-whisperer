import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

export type ActivityFilters = {
  from: string;
  to: string;
  type: 'BOTH' | 'SALES' | 'REFUND';
  country?: string | null;
  includeRefunds?: boolean;
  interval?: 'day' | 'week' | 'month' | 'quarter' | 'year';
};

export function useActivitySummary(f: ActivityFilters) {
  const queryClient = useQueryClient();

  // Écouter les mises à jour d'activité
  useEffect(() => {
    const handleActivityUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['activity_summary'] });
      queryClient.invalidateQueries({ queryKey: ['activity_breakdown'] });
      queryClient.invalidateQueries({ queryKey: ['activity_timeseries'] });
    };

    window.addEventListener('activity-data-updated', handleActivityUpdate);
    return () => window.removeEventListener('activity-data-updated', handleActivityUpdate);
  }, [queryClient]);

  return useQuery({
    queryKey: ['activity_summary', f],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('activity_summary', {
        p_from: f.from,
        p_to: f.to,
        p_type: f.type,
        p_country: f.country ?? null,
        p_include_refunds: f.includeRefunds ?? true,
      });
      if (error) throw error;
      return data?.[0];
    }
  });
}

export function useActivityBreakdown(f: ActivityFilters, groupBy: 'country' | 'type' | 'vat_rate_pct' | 'amount_bucket') {
  return useQuery({
    queryKey: ['activity_breakdown', f, groupBy],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('activity_breakdown', {
        p_group_by: groupBy,
        p_from: f.from,
        p_to: f.to,
        p_type: f.type
      });
      if (error) throw error;
      return data ?? [];
    }
  });
}

export function useActivityTimeseries(f: ActivityFilters, metric: 'gross' | 'tax' | 'transactions' | 'aov', groupByCountry = false) {
  const interval = f.interval ?? 'month';
  return useQuery({
    queryKey: ['activity_timeseries', f, metric, interval, groupByCountry],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('activity_timeseries', {
        p_metric: metric,
        p_interval: interval,
        p_from: f.from,
        p_to: f.to,
        p_type: f.type,
        p_group_by_country: groupByCountry
      });
      if (error) throw error;
      return data ?? [];
    }
  });
}