import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Jurisdiction {
  id: string;
  jurisdiction: string;
  taxId: string;
  validFrom: { day: number; month: number; year: number };
  validUntil?: { day: number; month: number; year: number };
  permanentEstablishment: boolean;
  registeredInImportScheme: boolean;
}

const jurisdictionOptions = [
  'European Union - VAT OSS / IOSS',
  'France',
  'Germany', 
  'Spain',
  'Italy',
  'Belgium',
  'Netherlands',
  'Austria',
  'Portugal',
  'Other'
];

const months = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const JurisdictionsPage = () => {
  const { toast } = useToast();
  const [jurisdictions, setJurisdictions] = useState<Jurisdiction[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingJurisdiction, setEditingJurisdiction] = useState<Jurisdiction | null>(null);
  
  const [formData, setFormData] = useState({
    jurisdiction: '',
    taxId: '',
    validFromDay: 1,
    validFromMonth: 1,
    validFromYear: new Date().getFullYear(),
    validUntilDay: 1,
    validUntilMonth: 1,
    validUntilYear: new Date().getFullYear(),
    hasValidUntil: false,
    permanentEstablishment: false,
    registeredInImportScheme: false,
  });

  const resetForm = () => {
    setFormData({
      jurisdiction: '',
      taxId: '',
      validFromDay: 1,
      validFromMonth: 1,
      validFromYear: new Date().getFullYear(),
      validUntilDay: 1,
      validUntilMonth: 1,
      validUntilYear: new Date().getFullYear(),
      hasValidUntil: false,
      permanentEstablishment: false,
      registeredInImportScheme: false,
    });
    setEditingJurisdiction(null);
  };

  const handleAddJurisdiction = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleEditJurisdiction = (jurisdiction: Jurisdiction) => {
    setEditingJurisdiction(jurisdiction);
    setFormData({
      jurisdiction: jurisdiction.jurisdiction,
      taxId: jurisdiction.taxId,
      validFromDay: jurisdiction.validFrom.day,
      validFromMonth: jurisdiction.validFrom.month,
      validFromYear: jurisdiction.validFrom.year,
      validUntilDay: jurisdiction.validUntil?.day || 1,
      validUntilMonth: jurisdiction.validUntil?.month || 1,
      validUntilYear: jurisdiction.validUntil?.year || new Date().getFullYear(),
      hasValidUntil: !!jurisdiction.validUntil,
      permanentEstablishment: jurisdiction.permanentEstablishment,
      registeredInImportScheme: jurisdiction.registeredInImportScheme,
    });
    setIsDialogOpen(true);
  };

  const handleSaveJurisdiction = () => {
    if (!formData.jurisdiction || !formData.taxId) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive"
      });
      return;
    }

    const newJurisdiction: Jurisdiction = {
      id: editingJurisdiction?.id || crypto.randomUUID(),
      jurisdiction: formData.jurisdiction,
      taxId: formData.taxId,
      validFrom: {
        day: formData.validFromDay,
        month: formData.validFromMonth,
        year: formData.validFromYear,
      },
      validUntil: formData.hasValidUntil ? {
        day: formData.validUntilDay,
        month: formData.validUntilMonth,
        year: formData.validUntilYear,
      } : undefined,
      permanentEstablishment: formData.permanentEstablishment,
      registeredInImportScheme: formData.registeredInImportScheme,
    };

    if (editingJurisdiction) {
      setJurisdictions(prev => prev.map(j => j.id === editingJurisdiction.id ? newJurisdiction : j));
      toast({
        title: "Juridiction modifiée",
        description: "La juridiction a été mise à jour avec succès.",
      });
    } else {
      setJurisdictions(prev => [...prev, newJurisdiction]);
      toast({
        title: "Juridiction ajoutée",
        description: "La nouvelle juridiction a été créée avec succès.",
      });
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleDeleteJurisdiction = (id: string) => {
    setJurisdictions(prev => prev.filter(j => j.id !== id));
    toast({
      title: "Juridiction supprimée",
      description: "La juridiction a été supprimée avec succès.",
    });
  };

  const formatDate = (date: { day: number; month: number; year: number }) => {
    return `${date.day.toString().padStart(2, '0')}/${date.month.toString().padStart(2, '0')}/${date.year}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold tracking-tight">Juridictions</h3>
          <p className="text-muted-foreground">
            Gérez vos numéros de TVA par pays et juridiction
          </p>
        </div>
        <Button onClick={handleAddJurisdiction} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Ajouter une juridiction
        </Button>
      </div>

      {/* Jurisdictions List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Juridictions configurées
          </CardTitle>
          <CardDescription>
            Liste de vos juridictions et numéros de TVA
          </CardDescription>
        </CardHeader>
        <CardContent>
          {jurisdictions.length === 0 ? (
            <div className="text-center py-8">
              <Globe className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">Aucune juridiction configurée</h3>
              <p className="mt-2 text-muted-foreground">
                Commencez par ajouter votre première juridiction
              </p>
              <Button onClick={handleAddJurisdiction} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une juridiction
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Juridiction</TableHead>
                  <TableHead>Numéro de TVA</TableHead>
                  <TableHead>Période de validité</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jurisdictions.map((jurisdiction) => (
                  <TableRow key={jurisdiction.id}>
                    <TableCell className="font-medium">
                      {jurisdiction.jurisdiction}
                    </TableCell>
                    <TableCell className="font-mono">{jurisdiction.taxId}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>Du : {formatDate(jurisdiction.validFrom)}</div>
                        {jurisdiction.validUntil && (
                          <div>Au : {formatDate(jurisdiction.validUntil)}</div>
                        )}
                        {!jurisdiction.validUntil && (
                          <div className="text-muted-foreground">Permanent</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {jurisdiction.permanentEstablishment && (
                          <Badge variant="secondary" className="text-xs">
                            Établissement permanent
                          </Badge>
                        )}
                        {jurisdiction.registeredInImportScheme && (
                          <Badge variant="outline" className="text-xs">
                            Régime d'importation
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditJurisdiction(jurisdiction)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteJurisdiction(jurisdiction.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingJurisdiction ? 'Modifier la juridiction' : 'Ajouter une juridiction'}
            </DialogTitle>
            <DialogDescription>
              Configurez une nouvelle juridiction avec son numéro de TVA
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Jurisdiction Selection */}
            <div className="space-y-2">
              <Label htmlFor="jurisdiction">Juridiction *</Label>
              <Select 
                value={formData.jurisdiction} 
                onValueChange={(value) => setFormData({...formData, jurisdiction: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une juridiction" />
                </SelectTrigger>
                <SelectContent>
                  {jurisdictionOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tax ID */}
            <div className="space-y-2">
              <Label htmlFor="taxId">Numéro de TVA *</Label>
              <Input
                id="taxId"
                value={formData.taxId}
                onChange={(e) => setFormData({...formData, taxId: e.target.value})}
                placeholder="Ex: FR12345678901"
              />
            </div>

            {/* Valid From Date */}
            <div className="space-y-2">
              <Label>Valide à partir du *</Label>
              <div className="grid grid-cols-3 gap-3">
                <Select 
                  value={formData.validFromDay.toString()} 
                  onValueChange={(value) => setFormData({...formData, validFromDay: parseInt(value)})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({length: 31}, (_, i) => i + 1).map((day) => (
                      <SelectItem key={day} value={day.toString()}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select 
                  value={formData.validFromMonth.toString()} 
                  onValueChange={(value) => setFormData({...formData, validFromMonth: parseInt(value)})}
                >
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

                <Select 
                  value={formData.validFromYear.toString()} 
                  onValueChange={(value) => setFormData({...formData, validFromYear: parseInt(value)})}
                >
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
            </div>

            {/* Valid Until Date */}
            <div className="space-y-2">
              <Label>Valide jusqu'au</Label>
              <div className="grid grid-cols-3 gap-3">
                <Select 
                  value={formData.validUntilDay.toString()} 
                  onValueChange={(value) => setFormData({...formData, validUntilDay: parseInt(value)})}
                  disabled={!formData.hasValidUntil}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({length: 31}, (_, i) => i + 1).map((day) => (
                      <SelectItem key={day} value={day.toString()}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select 
                  value={formData.validUntilMonth.toString()} 
                  onValueChange={(value) => setFormData({...formData, validUntilMonth: parseInt(value)})}
                  disabled={!formData.hasValidUntil}
                >
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

                <Select 
                  value={formData.validUntilYear.toString()} 
                  onValueChange={(value) => setFormData({...formData, validUntilYear: parseInt(value)})}
                  disabled={!formData.hasValidUntil}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({length: 15}, (_, i) => new Date().getFullYear() + i).map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2 mt-2">
                <Checkbox
                  id="hasValidUntil"
                  checked={formData.hasValidUntil}
                  onCheckedChange={(checked) => setFormData({...formData, hasValidUntil: !!checked})}
                />
                <Label htmlFor="hasValidUntil" className="text-sm">
                  Définir une date de fin
                </Label>
              </div>
            </div>

            {/* Checkboxes */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="permanentEstablishment"
                  checked={formData.permanentEstablishment}
                  onCheckedChange={(checked) => setFormData({...formData, permanentEstablishment: !!checked})}
                />
                <Label htmlFor="permanentEstablishment">
                  Établissement permanent
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="registeredInImportScheme"
                  checked={formData.registeredInImportScheme}
                  onCheckedChange={(checked) => setFormData({...formData, registeredInImportScheme: !!checked})}
                />
                <Label htmlFor="registeredInImportScheme">
                  Enregistré dans le régime d'importation
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveJurisdiction}>
              {editingJurisdiction ? 'Modifier la juridiction' : 'Ajouter la juridiction'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default JurisdictionsPage;