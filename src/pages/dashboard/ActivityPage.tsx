import { useState, useMemo } from 'react';
import { SEOHead } from '@/components/SEOHead';
import ActivityFilters from '@/components/activity/ActivityFilters';
import KpiCards from '@/components/activity/KpiCards';
import { TimeSeriesGrossTax, ByCountryBar } from '@/components/activity/ActivityCharts';
import ActivityTable from '@/components/activity/ActivityTable';
import { useActivitySummary, useActivityBreakdown, useActivityTimeseries, type ActivityFilters as F } from '@/hooks/useActivityData';

const todayISO = new Date().toISOString().slice(0, 10);
const monthStartISO = (() => {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString().slice(0, 10);
})();

const ActivityPage = () => {
  const [f, setF] = useState<F>({
    from: monthStartISO,
    to: todayISO,
    type: 'BOTH',
    country: null,
    includeRefunds: true,
    interval: 'month'
  });

  const { data: summary } = useActivitySummary(f);
  const { data: byCountry = [] } = useActivityBreakdown(f, 'country');
  const { data: tsGross = [] } = useActivityTimeseries(f, 'gross');
  const { data: tsTax = [] } = useActivityTimeseries(f, 'tax');

  const ts = useMemo(() => 
    (tsGross || []).map((g: any, i: number) => ({
      period: g.period?.slice(0, 10),
      gross: Number(g.value || 0),
      tax: Number(tsTax?.[i]?.value || 0)
    })),
    [tsGross, tsTax]
  );

  return (
    <>
      <SEOHead 
        title="Activité Amazon - Tableau de Bord | SELLCOUNT"
        description="Suivez vos ventes Amazon avec des KPI détaillés : chiffre d'affaires, TVA, transactions et panier moyen. Analysez vos performances par pays et période."
      />
      
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Activité Amazon
          </h1>
          <p className="text-lg text-muted-foreground">
            Analysez vos ventes Amazon avec des métriques détaillées sans logique de régime TVA
          </p>
        </div>

        <ActivityFilters initial={f} onChange={setF} />
        
        <KpiCards
          gross={Number(summary?.gross_amount || 0)}
          tax={Number(summary?.tax_amount || 0)}
          totalTx={Number(summary?.total_transactions || 0)}
          aov={Number(summary?.average_sales || 0)}
          currency={summary?.currency || 'EUR'}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TimeSeriesGrossTax data={ts} />
          <ByCountryBar data={byCountry} />
        </div>

        <ActivityTable from={f.from} to={f.to} />
      </div>
    </>
  );
};

export default ActivityPage;