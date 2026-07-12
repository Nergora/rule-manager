import React, { useEffect, useState } from 'react';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface VisualActionBuilderProps {
  onCodeChange: (code: string) => void;
  initialCode?: string;
}

export function VisualActionBuilder({ onCodeChange, initialCode }: VisualActionBuilderProps) {
  const [actionType, setActionType] = useState('TotalDiscount');
  const [amount, setAmount] = useState('0');
  const [currency, setCurrency] = useState('TRY');

  useEffect(() => {
    generateCode();
  }, [actionType, amount, currency]);

  const generateCode = () => {
    const val = amount ? `${amount}m` : '0m';
    if (actionType === 'TotalDiscount') {
      onCodeChange(`Output.TotalDiscount = new Price(${val}, "${currency}");`);
    } else {
      // Placeholder for other actions like percentage discount
      onCodeChange(`// Action type ${actionType} not fully mapped\nOutput.TotalDiscount = new Price(${val}, "${currency}");`);
    }
  };

  return (
    <div className="space-y-4 border rounded-md p-4 bg-muted/20">
      <div className="text-sm font-semibold text-muted-foreground mb-4">Then apply the following action:</div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label className="text-xs">Action Type</Label>
          <Select value={actionType} onValueChange={v => setActionType(v || '')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TotalDiscount">Apply Flat Discount</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Discount Amount</Label>
          <Input 
            type="number" 
            value={amount} 
            onChange={(e) => setAmount(e.target.value)} 
            placeholder="e.g. 50"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Currency</Label>
          <Select value={currency} onValueChange={v => setCurrency(v || '')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TRY">TRY</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
