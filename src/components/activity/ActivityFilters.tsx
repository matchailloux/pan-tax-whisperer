import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import type { ActivityFilters as F } from '@/hooks/useActivityData';

interface ActivityFiltersProps {
  initial: F;
  onChange: (f: F) => void;
}

export default function ActivityFilters({ initial, onChange }: ActivityFiltersProps) {
  const [f, setF] = useState<F>(initial);

  useEffect(() => {
    const timer = setTimeout(() => onChange(f), 300);
    return () => clearTimeout(timer);
  }, [f, onChange]);

  const setPreset = (preset: 'month' | 'quarter' | 'year') => {
    const now = new Date();
    const y = now.getUTCFullYear();
    const m = now.getUTCMonth();
    const iso = (d: Date) => d.toISOString().slice(0, 10);

    if (preset === 'month') {
      setF(s => ({
        ...s,
        from: iso(new Date(Date.UTC(y, m, 1))),
        to: iso(new Date(Date.UTC(y, m + 1, 0)))
      }));
    }
    if (preset === 'quarter') {
      const q = Math.floor(m / 3) * 3;
      setF(s => ({
        ...s,
        from: iso(new Date(Date.UTC(y, q, 1))),
        to: iso(new Date(Date.UTC(y, q + 3, 0)))
      }));
    }
    if (preset === 'year') {
      setF(s => ({
        ...s,
        from: iso(new Date(Date.UTC(y, 0, 1))),
        to: iso(new Date(Date.UTC(y, 11, 31)))
      }));
    }
  };

  return (
    <Card className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4 border-b">
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Période</span>
          <Select defaultValue="month" onValueChange={(value) => setPreset(value as any)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Mois courant</SelectItem>
              <SelectItem value="quarter">Trimestre</SelectItem>
              <SelectItem value="year">Année</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Du</span>
          <Input
            type="date"
            className="w-auto"
            value={f.from}
            onChange={e => setF({ ...f, from: e.target.value })}
          />
          <span className="text-sm font-medium">au</span>
          <Input
            type="date"
            className="w-auto"
            value={f.to}
            onChange={e => setF({ ...f, to: e.target.value })}
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Type</span>
          <Select value={f.type} onValueChange={(value) => setF({ ...f, type: value as any })}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BOTH">Tous</SelectItem>
              <SelectItem value="SALES">Ventes</SelectItem>
              <SelectItem value="REFUND">Remboursements</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Pays</span>
          <Input
            placeholder="FR, DE..."
            className="w-24"
            value={f.country ?? ''}
            onChange={e => setF({ ...f, country: e.target.value || null })}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="includeRefunds"
            checked={f.includeRefunds ?? true}
            onCheckedChange={(checked) => setF({ ...f, includeRefunds: !!checked })}
          />
          <label htmlFor="includeRefunds" className="text-sm font-medium">
            Inclure remboursements
          </label>
        </div>
      </div>
    </Card>
  );
}