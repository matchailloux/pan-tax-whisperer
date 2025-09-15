import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar, CalendarCheck } from 'lucide-react';

interface PeriodSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (period: {
    type: 'monthly' | 'quarterly' | 'annual';
    month?: number;
    quarter?: number;
    year: number;
    startDate: Date;
    endDate: Date;
  }) => void;
  fileName?: string;
}

const months = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const quarters = [
  'Q1 (Jan-Mar)', 'Q2 (Avr-Juin)', 'Q3 (Juil-Sep)', 'Q4 (Oct-Déc)'
];

export const PeriodSelectionDialog: React.FC<PeriodSelectionDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  fileName
}) => {
  const [periodType, setPeriodType] = useState<'monthly' | 'quarterly' | 'annual'>('monthly');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedQuarter, setSelectedQuarter] = useState<number>(1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const calculateDates = () => {
    let startDate: Date;
    let endDate: Date;

    if (periodType === 'monthly') {
      startDate = new Date(selectedYear, selectedMonth - 1, 1);
      endDate = new Date(selectedYear, selectedMonth, 0);
    } else if (periodType === 'quarterly') {
      const quarterStartMonth = (selectedQuarter - 1) * 3;
      startDate = new Date(selectedYear, quarterStartMonth, 1);
      endDate = new Date(selectedYear, quarterStartMonth + 3, 0);
    } else {
      startDate = new Date(selectedYear, 0, 1);
      endDate = new Date(selectedYear, 11, 31);
    }

    return { startDate, endDate };
  };

  const handleConfirm = () => {
    const { startDate, endDate } = calculateDates();
    
    onConfirm({
      type: periodType,
      month: periodType === 'monthly' ? selectedMonth : undefined,
      quarter: periodType === 'quarterly' ? selectedQuarter : undefined,
      year: selectedYear,
      startDate,
      endDate
    });
    
    onOpenChange(false);
  };

  const formatPeriodPreview = () => {
    const { startDate, endDate } = calculateDates();
    return `${startDate.toLocaleDateString('fr-FR')} - ${endDate.toLocaleDateString('fr-FR')}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Période du rapport
          </DialogTitle>
          <DialogDescription>
            Définissez la période couverte par ce fichier {fileName && `"${fileName}"`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Type de période */}
          <div className="space-y-2">
            <Label htmlFor="period-type">Type de période</Label>
            <Select value={periodType} onValueChange={(value: any) => setPeriodType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Mensuelle</SelectItem>
                <SelectItem value="quarterly">Trimestrielle</SelectItem>
                <SelectItem value="annual">Annuelle</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Année */}
          <div className="space-y-2">
            <Label htmlFor="year">Année</Label>
            <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({length: 10}, (_, i) => new Date().getFullYear() - 5 + i).map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Mois (si mensuel) */}
          {periodType === 'monthly' && (
            <div className="space-y-2">
              <Label htmlFor="month">Mois</Label>
              <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month, index) => (
                    <SelectItem key={index + 1} value={(index + 1).toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Trimestre (si trimestriel) */}
          {periodType === 'quarterly' && (
            <div className="space-y-2">
              <Label htmlFor="quarter">Trimestre</Label>
              <Select value={selectedQuarter.toString()} onValueChange={(value) => setSelectedQuarter(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {quarters.map((quarter, index) => (
                    <SelectItem key={index + 1} value={(index + 1).toString()}>
                      {quarter}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Aperçu de la période */}
          <div className="bg-muted/50 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <CalendarCheck className="h-4 w-4 text-accent" />
              <span className="font-medium">Période sélectionnée:</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {formatPeriodPreview()}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleConfirm}>
            Confirmer la période
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};