import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, Filter } from "lucide-react";

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
  { value: '==', label: 'Equals' },
  { value: '!=', label: 'Not Equals' },
  { value: '>', label: 'Greater Than' },
  { value: '<', label: 'Less Than' },
  { value: '>=', label: 'Greater/Eq' },
  { value: '<=', label: 'Less/Eq' },
  { value: 'Contains', label: 'Contains' },
];

interface VisualRuleBuilderProps {
  onCodeChange: (code: string) => void;
  initialCode?: string;
}

export function VisualRuleBuilder({ onCodeChange, initialCode }: VisualRuleBuilderProps) {
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [logicMode, setLogicMode] = useState<'&&' | '||'>('&&');
  const hasInitialized = React.useRef(false);

  useEffect(() => {
    if (initialCode && initialCode !== 'true' && !hasInitialized.current) {
      parseInitialCode(initialCode);
      hasInitialized.current = true;
    }
  }, [initialCode]);

  useEffect(() => {
    if (hasInitialized.current) {
      generateCode();
    }
  }, [conditions, logicMode]);

  const parseInitialCode = (code: string) => {
    try {
      const isOr = code.includes(' || ');
      const logicSeparator = isOr ? ' || ' : ' && ';
      setLogicMode(isOr ? '||' : '&&');

      const parts = code.split(logicSeparator);
      const parsedConditions: Condition[] = parts.map((part, index) => {
        const trimmed = part.trim();
        
        // Handle Contains: Input.Field.Contains("value")
        const containsMatch = trimmed.match(/^Input\.(\w+)\.Contains\((.*?)\)$/);
        if (containsMatch) {
          const field = containsMatch[1];
          let value = containsMatch[2];
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.substring(1, value.length - 1);
          }
          const fieldDef = FIELDS.find(f => f.value === field);
          return { id: `initial-${index}`, field, operator: 'Contains', value, type: (fieldDef?.type as any) || 'string' };
        }

        // Handle operators: Input.Field >= value
        const opMatch = trimmed.match(/^Input\.(\w+)\s*(==|!=|>=|<=|>|<)\s*(.*)$/);
        if (opMatch) {
          const field = opMatch[1];
          const operator = opMatch[2] as Operator;
          let value = opMatch[3];

          if (value.endsWith('m')) value = value.slice(0, -1);
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.substring(1, value.length - 1);
          }

          const fieldDef = FIELDS.find(f => f.value === field);
          return { id: `initial-${index}`, field, operator, value, type: (fieldDef?.type as any) || 'string' };
        }

        return null;
      }).filter(c => c !== null) as Condition[];

      if (parsedConditions.length > 0) {
        setConditions(parsedConditions);
      } else if (code !== 'true') {
        // Fallback: If we couldn't parse the code (e.g. complex expression),
        // we emit it back to prevent overwriting it with 'true'
        onCodeChange(code);
      }
    } catch (e) {
      console.error("Failed to parse code:", e);
    }
  };

  const generateCode = () => {
    if (conditions.length === 0) {
      onCodeChange('true');
      return;
    }

    const parts = conditions.map(c => {
      if (!c.field) return 'true';
      
      let val = c.value || '';
      
      if (c.type === 'number') {
        val = val ? `${val}m` : '0m'; 
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
    <div className="flex flex-col rounded-xl border border-border/60 bg-slate-50/50 dark:bg-slate-900/50 overflow-hidden shadow-sm">
      {/* Header Bar */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-950 border-b border-border/50">
        <span className="text-sm font-medium">Match</span>
        <Select value={logicMode} onValueChange={(val) => setLogicMode((val as '&&' | '||') || '&&')}>
          <SelectTrigger className="w-[110px] h-8 font-semibold bg-primary/5 border-primary/20 text-primary focus:ring-1 focus:ring-primary/30">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="&&" className="font-medium">ALL</SelectItem>
            <SelectItem value="||" className="font-medium">ANY</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">of the following conditions:</span>
      </div>

      {/* Conditions Area */}
      <div className="p-4 space-y-3">
        {conditions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center border-2 border-dashed rounded-lg border-muted-foreground/20 bg-white/50 dark:bg-black/20">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Filter className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-sm font-semibold mb-1">No conditions yet</h3>
            <p className="text-xs text-muted-foreground mb-5 max-w-[250px]">
              Rules without conditions will always execute successfully.
            </p>
            <Button variant="default" size="sm" onClick={addCondition} className="shadow-sm">
              <Plus className="h-4 w-4 mr-2" /> Add your first condition
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-3 relative before:absolute before:inset-y-0 before:left-3 before:w-px before:bg-border/60 ml-1">
              {conditions.map((c, index) => (
                <div key={c.id} className="relative flex items-center gap-3 pl-8 group">
                  {/* Connector Line */}
                  <div className="absolute left-3 top-1/2 w-5 h-px bg-border/60 -translate-y-1/2"></div>
                  
                  {/* Condition Card */}
                  <div className="flex-1 flex items-center gap-2 p-2.5 bg-white dark:bg-slate-950 border rounded-lg shadow-sm transition-all hover:border-primary/40 hover:shadow-md">
                    
                    <Select value={c.field} onValueChange={v => updateCondition(c.id, { field: v || '' })}>
                      <SelectTrigger className="w-[180px] h-9 border-transparent bg-muted/30 hover:bg-muted/50 font-medium">
                        <SelectValue placeholder="Field" />
                      </SelectTrigger>
                      <SelectContent>
                        {FIELDS.map(f => (
                          <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={c.operator} onValueChange={v => updateCondition(c.id, { operator: (v as Operator) || '==' })}>
                      <SelectTrigger className="w-[140px] h-9 border-transparent bg-muted/30 hover:bg-muted/50">
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
                      placeholder="Enter value..."
                      className="h-9 flex-1 border-transparent bg-muted/30 hover:bg-muted/50 focus-visible:bg-transparent"
                      value={c.value}
                      onChange={e => updateCondition(c.id, { value: e.target.value })}
                    />

                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all" 
                      onClick={() => removeCondition(c.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <Button 
              variant="outline" 
              size="sm" 
              onClick={addCondition} 
              className="w-full mt-4 border-dashed border-2 hover:border-primary/50 hover:bg-primary/5 text-muted-foreground hover:text-primary transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" /> Add another condition
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

