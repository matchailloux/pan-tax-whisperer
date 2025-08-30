import { useState, useMemo } from 'react';
import { useOrganization } from '@/hooks/useOrganization';
import { Navigate } from 'react-router-dom';
import VentesFilters from '@/components/ventes/VentesFilters';
import VentesImport from '@/components/ventes/VentesImport';
import { useVentesKpis, useVentesCountryTotals, useVentesCountryVatRateTotals, useVentesTimeseries, useVentesTypeBreakdown, type VFilters } from '@/hooks/useVentesData';
import { VentesKpis } from '@/components/ventes/VentesKpis';
import { VentesTimeSeries, VentesByCountry, VentesByType } from '@/components/ventes/VentesCharts';
import { VentesCountryTotalsTable, VentesCountryVatRateTable } from '@/components/ventes/VentesTables';
import { VentesExportPanel } from '@/components/ventes/VentesExportPanel';
import { LoadingSpinner } from '@/components/LoadingSpinner';

const getCurrentMonth = () => {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  
  return {
    start: new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 10),
    end: new Date(Date.UTC(year, month + 1, 0)).toISOString().slice(0, 10)
  };
};

export default function VentesPage() {
  const { organization, loading } = useOrganization();
  const currentMonth = getCurrentMonth();
  
  const [filters, setFilters] = useState<VFilters>({
    from: currentMonth.start,
    to: currentMonth.end,
    currency: 'EUR',
    country: null,
    type: 'ALL',
    includeNegatives: true,
    interval: 'month'
  });

  // Data queries (hooks must be called unconditionally)
  const { data: kpis } = useVentesKpis(filters);
  const { data: byCountry = [] } = useVentesCountryTotals(filters);
  const { data: byCountryRate = [] } = useVentesCountryVatRateTotals(filters);
  const { data: tsGross = [] } = useVentesTimeseries(filters, 'gross');
  const { data: tsTax = [] } = useVentesTimeseries(filters, 'tax');
  const { data: typeBreakdown = [] } = useVentesTypeBreakdown(filters);


  const timeSeriesData = useMemo(() => {
    const dataMap: Record<string, { period: string; gross: number; tax: number }> = {};
    
    tsGross.forEach((item: any) => {
      const period = item.period?.slice(0, 10) || '';
      if (!dataMap[period]) {
        dataMap[period] = { period, gross: 0, tax: 0 };
      }
      dataMap[period].gross = Number(item.value || 0);
    });

    tsTax.forEach((item: any) => {
      const period = item.period?.slice(0, 10) || '';
      if (!dataMap[period]) {
        dataMap[period] = { period, gross: 0, tax: 0 };
      }
      dataMap[period].tax = Number(item.value || 0);
    });

    return Object.values(dataMap).sort((a, b) => a.period.localeCompare(b.period));
  }, [tsGross, tsTax]);

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner />
        </div>
      ) : (!organization || organization.type !== 'INDIVIDUAL') ? (
        <Navigate to="/dashboard" replace />
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Ventes</h1>
              <p className="text-muted-foreground">
                Analysez vos ventes Amazon par pays et taux de TVA
              </p>
            </div>
          </div>

          <VentesFilters initial={filters} onChange={(f)=>setFilters(f)} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <VentesKpis k={kpis} />
            </div>
            <VentesImport />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <VentesTimeSeries data={timeSeriesData} />
            <VentesByCountry 
              data={byCountry.map((item: any) => ({
                country: item.country,
                gross_ttc: Number(item.gross_ttc || 0)
              }))}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <VentesByType 
              data={typeBreakdown.map((item: any) => ({
                type: item.type,
                gross_ttc: Number(item.gross_ttc || 0)
              }))}
            />
            <VentesExportPanel 
              byCountry={byCountry}
              byCountryRate={byCountryRate}
              ts={timeSeriesData}
            />
          </div>

          <div className="space-y-6">
            <VentesCountryTotalsTable rows={byCountry} />
            <VentesCountryVatRateTable rows={byCountryRate} />
          </div>
        </>
      )}
    </div>
  );
}