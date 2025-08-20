import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";

export interface VATRule {
  id: string;
  country: string;
  vatType: 'LOCAL_B2C' | 'LOCAL_B2B' | 'INTRACOMMUNAUTAIRE' | 'OSS';
  conditions: {
    column: string;
    operator: 'equals' | 'contains' | 'starts_with';
    value: string;
  }[];
}

interface RulesConfigProps {
  onRulesChange: (rules: VATRule[]) => void;
}

export function RulesConfig({ onRulesChange }: RulesConfigProps) {
  const [rules, setRules] = useState<VATRule[]>([]);
  const [editingRule, setEditingRule] = useState<Partial<VATRule> | null>(null);

  const vatTypes = [
    { value: 'LOCAL_B2C', label: 'TVA Locale B2C' },
    { value: 'LOCAL_B2B', label: 'TVA Locale B2B' },
    { value: 'INTRACOMMUNAUTAIRE', label: 'Ventes Intracommunautaires' },
    { value: 'OSS', label: 'TVA OSS' }
  ];

  const operators = [
    { value: 'equals', label: 'Égal à' },
    { value: 'contains', label: 'Contient' },
    { value: 'starts_with', label: 'Commence par' }
  ];

  const addRule = () => {
    if (!editingRule?.country || !editingRule?.vatType) return;

    const newRule: VATRule = {
      id: Date.now().toString(),
      country: editingRule.country,
      vatType: editingRule.vatType as VATRule['vatType'],
      conditions: editingRule.conditions || []
    };

    const updatedRules = [...rules, newRule];
    setRules(updatedRules);
    onRulesChange(updatedRules);
    setEditingRule(null);
  };

  const removeRule = (id: string) => {
    const updatedRules = rules.filter(rule => rule.id !== id);
    setRules(updatedRules);
    onRulesChange(updatedRules);
  };

  const addCondition = () => {
    setEditingRule(prev => ({
      ...prev,
      conditions: [
        ...(prev?.conditions || []),
        { column: '', operator: 'equals', value: '' }
      ]
    }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configuration des Règles de Ventilation TVA</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {editingRule ? (
            <div className="border rounded-lg p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="country">Pays</Label>
                  <Input
                    id="country"
                    value={editingRule.country || ''}
                    onChange={(e) => setEditingRule(prev => ({ ...prev, country: e.target.value }))}
                    placeholder="FR, DE, IT..."
                  />
                </div>
                <div>
                  <Label htmlFor="vatType">Type de TVA</Label>
                  <Select
                    value={editingRule.vatType}
                    onValueChange={(value) => setEditingRule(prev => ({ ...prev, vatType: value as VATRule['vatType'] }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner le type" />
                    </SelectTrigger>
                    <SelectContent>
                      {vatTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Conditions</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addCondition}>
                    <Plus className="h-4 w-4 mr-1" />
                    Ajouter condition
                  </Button>
                </div>
                
                {editingRule.conditions?.map((condition, index) => (
                  <div key={index} className="grid grid-cols-4 gap-2 mb-2">
                    <Input
                      placeholder="Colonne CSV"
                      value={condition.column}
                      onChange={(e) => {
                        const newConditions = [...(editingRule.conditions || [])];
                        newConditions[index] = { ...condition, column: e.target.value };
                        setEditingRule(prev => ({ ...prev, conditions: newConditions }));
                      }}
                    />
                    <Select
                      value={condition.operator}
                      onValueChange={(value) => {
                        const newConditions = [...(editingRule.conditions || [])];
                        newConditions[index] = { ...condition, operator: value as any };
                        setEditingRule(prev => ({ ...prev, conditions: newConditions }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {operators.map(op => (
                          <SelectItem key={op.value} value={op.value}>
                            {op.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Valeur"
                      value={condition.value}
                      onChange={(e) => {
                        const newConditions = [...(editingRule.conditions || [])];
                        newConditions[index] = { ...condition, value: e.target.value };
                        setEditingRule(prev => ({ ...prev, conditions: newConditions }));
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newConditions = editingRule.conditions?.filter((_, i) => i !== index) || [];
                        setEditingRule(prev => ({ ...prev, conditions: newConditions }));
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button onClick={addRule}>Ajouter la règle</Button>
                <Button variant="outline" onClick={() => setEditingRule(null)}>
                  Annuler
                </Button>
              </div>
            </div>
          ) : (
            <Button onClick={() => setEditingRule({})}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle règle
            </Button>
          )}

          <div className="space-y-2">
            <Label>Règles configurées ({rules.length})</Label>
            {rules.map(rule => (
              <div key={rule.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{rule.country}</Badge>
                  <Badge variant="secondary">
                    {vatTypes.find(t => t.value === rule.vatType)?.label}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {rule.conditions.length} condition(s)
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeRule(rule.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}