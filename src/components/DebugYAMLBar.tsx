import React, { useEffect, useMemo, useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Info } from 'lucide-react';

interface DebugYAMLBarProps {
  report?: any | null;
}

const readForce = () => {
  try {
    const v = localStorage.getItem('debug:forceYAML');
    return v === '1' || v === 'true';
  } catch {
    return false;
  }
};

export const DebugYAMLBar: React.FC<DebugYAMLBarProps> = ({ report }) => {
  const [forced, setForced] = useState<boolean>(readForce());

  useEffect(() => {
    setForced(readForce());
  }, []);

  const toggle = (checked: boolean) => {
    try {
      localStorage.setItem('debug:forceYAML', checked ? '1' : '0');
      setForced(checked);
      window.dispatchEvent(new CustomEvent('yaml-debug-changed', { detail: { forced: checked } }));
    } catch {}
  };

  const stats: Record<string, number> | null = useMemo(() => {
    if (!report) return null;
    // Plusieurs clés possibles selon versions
    const s = (report as any)?.rulesStatistics ?? (report as any)?.rulesStats ?? null;
    if (s && typeof s === 'object') return s as Record<string, number>;
    return null;
  }, [report]);

  const countriesCount = useMemo(() => {
    return Array.isArray(report?.breakdown) ? report.breakdown.length : 0;
  }, [report]);

  return (
    <div className="w-full rounded-lg border bg-muted/30 p-3 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Debug YAML</span>
          <Badge variant="outline" className="ml-2">{countriesCount} pays</Badge>
          {forced && <Badge variant="secondary">YAML forcé</Badge>}
        </div>
        <div className="flex items-center gap-3">
          <Label htmlFor="force-yaml" className="text-sm">Forcer YAML</Label>
          <Switch id="force-yaml" checked={forced} onCheckedChange={toggle} />
        </div>
      </div>

      {stats ? (
        <div className="flex flex-wrap gap-2">
          {Object.entries(stats).map(([k, v]) => (
            <Badge key={k} variant="outline" className="capitalize">
              {k.replace(/_/g, ' ')}: {v}
            </Badge>
          ))}
        </div>
      ) : (
        <div className="text-xs text-muted-foreground">Aucune statistique disponible pour l'instant. Lancez une analyse pour voir les compteurs.</div>
      )}
    </div>
  );
};

export default DebugYAMLBar;
