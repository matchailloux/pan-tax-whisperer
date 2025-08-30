import { useEffect, useState } from 'react';
import type { VFilters } from '@/hooks/useVentesData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

interface VentesFiltersProps {
  initial: VFilters;
  onChange: (f: VFilters) => void;
}

export default function VentesFilters({ initial, onChange }: VentesFiltersProps) {
  const [f, setF] = useState<VFilters>(initial);

  useEffect(() => {
    const timeout = setTimeout(() => onChange(f), 300);
    return () => clearTimeout(timeout);
  }, [f, onChange]);

  const setPreset = (preset: 'month' | 'quarter' | 'year') => {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth();
    const iso = (d: Date) => d.toISOString().slice(0, 10);

    if (preset === 'month') {
      setF(s => ({
        ...s,
        from: iso(new Date(Date.UTC(year, month, 1))),
        to: iso(new Date(Date.UTC(year, month + 1, 0)))
      }));
    }
    if (preset === 'quarter') {
      const quarter = Math.floor(month / 3) * 3;
      setF(s => ({
        ...s,
        from: iso(new Date(Date.UTC(year, quarter, 1))),
        to: iso(new Date(Date.UTC(year, quarter + 3, 0)))
      }));
    }
    if (preset === 'year') {
      setF(s => ({
        ...s,
        from: iso(new Date(Date.UTC(year, 0, 1))),
        to: iso(new Date(Date.UTC(year, 11, 31)))
      }));
    }
  };

  return (
    <div className="bg-card border-b border-border p-4 sticky top-0 z-10">
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreset('month')}
          >
            Mois
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreset('quarter')}
          >
            Trimestre
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreset('year')}
          >
            Année
          </Button>
        </div>

        <div className="flex gap-2 items-center">
          <Label htmlFor="from-date" className="text-sm">Du</Label>
          <Input
            id="from-date"
            type="date"
            value={f.from}
            onChange={e => setF({ ...f, from: e.target.value })}
            className="w-auto"
          />
          <Label htmlFor="to-date" className="text-sm">Au</Label>
          <Input
            id="to-date"
            type="date"
            value={f.to}
            onChange={e => setF({ ...f, to: e.target.value })}
            className="w-auto"
          />
        </div>

        <div className="flex gap-2 items-center">
          <Label htmlFor="country" className="text-sm">Pays</Label>
          <Input
            id="country"
            placeholder="FR, DE..."
            value={f.country ?? ''}
            onChange={e => setF({ ...f, country: e.target.value || null })}
            className="w-24"
          />
        </div>

        <div className="flex gap-2 items-center">
          <Label htmlFor="currency" className="text-sm">Devise</Label>
          <Input
            id="currency"
            placeholder="EUR"
            value={f.currency || 'EUR'}
            onChange={e => setF({ ...f, currency: e.target.value || 'EUR' })}
            className="w-20"
          />
        </div>

        <div className="flex gap-2 items-center">
          <Label htmlFor="type" className="text-sm">Type</Label>
          <Select value={f.type || 'ALL'} onValueChange={(value) => setF({ ...f, type: value as any })}>
            <SelectTrigger id="type" className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tous</SelectItem>
              <SelectItem value="SALE">Ventes</SelectItem>
              <SelectItem value="REFUND">Remboursements</SelectItem>
              <SelectItem value="RETURN">Retours</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="include-negatives"
            checked={f.includeNegatives ?? true}
            onCheckedChange={checked => setF({ ...f, includeNegatives: !!checked })}
          />
          <Label htmlFor="include-negatives" className="text-sm">
            Inclure refunds/returns
          </Label>
        </div>
      </div>
    </div>
  );
}