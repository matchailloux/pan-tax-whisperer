import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type Row = {
  event_date: string;
  country: string;
  type: 'SALES' | 'REFUND';
  vat_rate_pct: number;
  amount_net: number;
  amount_tax: number;
  amount_gross: number;
  amount_bucket: string;
};

interface ActivityTableProps {
  from: string;
  to: string;
}

export default function ActivityTable({ from, to }: ActivityTableProps) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('activity_events_v1')
          .select('event_date,country,type,vat_rate_pct,amount_net,amount_tax,amount_gross,amount_bucket')
          .gte('event_date', from)
          .lte('event_date', to)
          .order('event_date', { ascending: false })
          .limit(200);
        
        if (!error && data) {
          setRows(data as Row[]);
        }
      } catch (error) {
        console.error('Error fetching activity data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [from, to]);

  const downloadCSV = () => {
    const headers = ['Date', 'Pays', 'Type', 'TVA %', 'HT', 'TVA', 'TTC', 'Bucket'];
    const lines = [
      headers.join(','),
      ...rows.map(r => [
        r.event_date,
        r.country,
        r.type,
        r.vat_rate_pct,
        r.amount_net,
        r.amount_tax,
        r.amount_gross,
        r.amount_bucket
      ].join(','))
    ];
    
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'activity.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="relative overflow-hidden border-2 border-gradient-to-br from-accent/20 to-primary/20">
      <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent" />
      <CardHeader className="flex flex-row items-center justify-between relative">
        <CardTitle className="text-lg font-semibold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
          Transactions (extrait)
        </CardTitle>
        <Button onClick={downloadCSV} variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          Exporter CSV
        </Button>
      </CardHeader>
      <CardContent className="relative">
        <div className="overflow-auto max-h-96">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Pays</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>TVA %</TableHead>
                <TableHead className="text-right">HT</TableHead>
                <TableHead className="text-right">TVA</TableHead>
                <TableHead className="text-right">TTC</TableHead>
                <TableHead>Bucket</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-4">
                    Chargement...
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-4 text-muted-foreground">
                    Aucune donnée trouvée pour cette période
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell>{r.event_date}</TableCell>
                    <TableCell>{r.country}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        r.type === 'SALES' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                      }`}>
                        {r.type}
                      </span>
                    </TableCell>
                    <TableCell>{r.vat_rate_pct?.toFixed(2)}%</TableCell>
                    <TableCell className="text-right">{r.amount_net.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{r.amount_tax.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-medium">{r.amount_gross.toFixed(2)}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 bg-muted rounded text-xs">
                        {r.amount_bucket}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {rows.length > 0 && (
          <div className="text-xs text-muted-foreground mt-2">
            Affichage limité à 200 lignes.
          </div>
        )}
      </CardContent>
    </Card>
  );
}