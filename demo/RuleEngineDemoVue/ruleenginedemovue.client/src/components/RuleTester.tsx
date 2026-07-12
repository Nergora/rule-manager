import { useState, useEffect } from 'react';
import { api, RuleDefinition } from '../lib/api';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface RuleTesterProps {
  rules: RuleDefinition[];
  defaultSelectedRuleId?: string;
}

export default function RuleTester({ rules, defaultSelectedRuleId }: RuleTesterProps) {
  const [selectedRuleId, setSelectedRuleId] = useState<string>('');
  
  useEffect(() => {
    if (defaultSelectedRuleId) {
      setSelectedRuleId(defaultSelectedRuleId);
    }
  }, [defaultSelectedRuleId]);
  const [inputJson, setInputJson] = useState<string>('{\n  "amount": 100\n}');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleTest = async () => {
    if (!selectedRuleId) {
      setError('Please select a rule to test.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setResult(null);
      const parsedInput = JSON.parse(inputJson);
      const res = await api.evaluateRule(selectedRuleId, parsedInput);
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Invalid JSON or evaluation failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-2">
        <Label htmlFor="rule">Select Rule</Label>
        <Select value={selectedRuleId} onValueChange={(v) => setSelectedRuleId(v || '')}>
          <SelectTrigger id="rule">
            <SelectValue placeholder="Select a rule" />
          </SelectTrigger>
          <SelectContent>
            {rules.map((r) => (
              <SelectItem key={r.id} value={r.id}>
                {r.name} (v{r.version})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="input">Input JSON</Label>
        <Textarea
          id="input"
          className="font-mono text-sm h-32"
          value={inputJson}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInputJson(e.target.value)}
        />
      </div>

      <Button onClick={handleTest} disabled={loading || rules.length === 0}>
        {loading ? 'Evaluating...' : 'Evaluate Rule'}
      </Button>

      {error && (
        <div className="p-4 border border-destructive text-destructive rounded-md bg-destructive/10">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-2 mt-4">
          <Label>Evaluation Result</Label>
          <div className="p-4 bg-muted rounded-md overflow-auto max-h-64">
            <pre className="text-xs font-mono">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
