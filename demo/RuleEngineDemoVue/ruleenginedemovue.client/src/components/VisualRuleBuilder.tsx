import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, GripVertical } from "lucide-react";
import { Card } from "@/components/ui/card";

export type Operator = '==' | '!=' | '>' | '<' | '>=' | '<=' | 'Contains';

export interface Condition {
  id: string;
  field: string;
  operator: Operator;
  value: string;
  type: 'number' | 'string' | 'date';
}

const FIELDS = [
  { value: 'TotalAmount', label: 'Total Amount', type: 'number' },
  { value: 'CustomerType', label: 'Customer Type', type: 'string' },
  { value: 'OrderCount', label: 'Order Count', type: 'number' },
  { value: 'ProductCount', label: 'Product Count', type: 'number' },
  { value: 'City', label: 'City', type: 'string' },
  { value: 'Category', label: 'Category', type: 'string' },
];

const OPERATORS = [
  { value: '==', label: 'Equals (==)' },
  { value: '!=', label: 'Not Equals (!=)' },
  { value: '>', label: 'Greater Than (>)' },
  { value: '<', label: 'Less Than (<)' },
  { value: '>=', label: 'Greater/Eq (>=)' },
  { value: '<=', label: 'Less/Eq (<=)' },
  { value: 'Contains', label: 'Contains' },
];

interface VisualRuleBuilderProps {
  onCodeChange: (code: string) => void;
  initialCode?: string;
}

export function VisualRuleBuilder({ onCodeChange, initialCode }: VisualRuleBuilderProps) {
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [logicMode, setLogicMode] = useState<'&&' | '||'>('&&');

  // We won't attempt complex reverse-parsing of C# code for now. 
  // Visual Builder drives the code one-way.

  useEffect(() => {
    generateCode();
  }, [conditions, logicMode]);

  const generateCode = () => {
    if (conditions.length === 0) {
      onCodeChange('true');
      return;
    }

    const parts = conditions.map(c => {
      if (!c.field) return 'true';
      
      let val = c.value || '';
      
      // Format value for C# based on type
      if (c.type === 'number') {
        val = val ? `${val}m` : '0m'; // Assuming decimals for amounts/counts
      } else if (c.type === 'string') {
        val = `"${val}"`;
      }

      if (c.operator === 'Contains') {
        return `Input.${c.field}.Contains(${val})`;
      }

      return `Input.${c.field} ${c.operator} ${val}`;
    });

    const code = parts.join(` ${logicMode} `);
    onCodeChange(code);
  };

  const addCondition = () => {
    setConditions([
      ...conditions, 
      { id: Date.now().toString(), field: 'TotalAmount', operator: '>', value: '0', type: 'number' }
    ]);
  };

  const removeCondition = (id: string) => {
    setConditions(conditions.filter(c => c.id !== id));
  };

  const updateCondition = (id: string, updates: Partial<Condition>) => {
    setConditions(conditions.map(c => {
      if (c.id === id) {
        const updated = { ...c, ...updates };
        // Auto-fix type if field changes
        if (updates.field) {
          const fieldDef = FIELDS.find(f => f.value === updates.field);
          if (fieldDef) updated.type = fieldDef.type as any;
        }
        return updated;
      }
      return c;
    }));
  };

  return (
    <div className="space-y-4 border rounded-md p-4 bg-muted/20">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-muted-foreground">Match</span>
          <Select value={logicMode} onValueChange={(val) => setLogicMode((val as '&&' | '||') || '&&')}>
            <SelectTrigger className="w24 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="&&">ALL (AND)</SelectItem>
              <SelectItem value="||">ANY (OR)</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm font-semibold text-muted-foreground">of the following rules:</span>
        </div>
      </div>

      <div className="space-y-3 pl-4 border-l-2 border-primary/20">
        {conditions.length === 0 ? (
          <div className="text-sm text-muted-foreground py-2 italic">
            No conditions defined. Rule will always execute (returns true).
          </div>
        ) : (
          conditions.map((c) => (
            <Card key={c.id} className="p-2 flex items-center gap-2 bg-background border shadow-sm">
              <GripVertical className="h-4 w-4 text-muted-foreground cursor-move opacity-50 hover:opacity-100" />
              
              <Select value={c.field} onValueChange={v => updateCondition(c.id, { field: v || '' })}>
                <SelectTrigger className="w-[160px] h-9">
                  <SelectValue placeholder="Field" />
                </SelectTrigger>
                <SelectContent>
                  {FIELDS.map(f => (
                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={c.operator} onValueChange={v => updateCondition(c.id, { operator: (v as Operator) || '==' })}>
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue placeholder="Operator" />
                </SelectTrigger>
                <SelectContent>
                  {OPERATORS.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input 
                type={c.type === 'number' ? 'number' : 'text'}
                placeholder="Value..."
                className="h-9 flex-1"
                value={c.value}
                onChange={e => updateCondition(c.id, { value: e.target.value })}
              />

              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => removeCondition(c.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </Card>
          ))
        )}
      </div>

      <Button variant="outline" size="sm" onClick={addCondition} className="mt-2 text-xs">
        <Plus className="h-3 w-3 mr-1" /> Add Condition
      </Button>
    </div>
  );
}
