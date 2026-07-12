import { useState, useEffect } from 'react';
import { api, RuleDefinition } from '../lib/api';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CodeEditor } from "@/components/ui/code-editor";

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
  const [codeLoading, setCodeLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<{ Predicate: string; Result: string } | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (selectedRuleId) {
      const selected = rules.find(r => r.id === selectedRuleId);
      if (selected) {
        let paramsTemplate: any = {};
        if (selected.parameters) {
           Object.keys(selected.parameters).forEach(k => paramsTemplate[k] = "");
        } else {
           paramsTemplate = { amount: 100 };
        }
        setInputJson(JSON.stringify(paramsTemplate, null, 2));
      }

      fetchCode(selectedRuleId);
    } else {
      setGeneratedCode(null);
    }
  }, [selectedRuleId, rules]);

  const fetchCode = async (ruleId: string) => {
    try {
      setCodeLoading(true);
      const code = await api.getRuleCode(ruleId);
      setGeneratedCode(code);
    } catch (e) {
      console.error("Failed to load generated code", e);
    } finally {
      setCodeLoading(false);
    }
  };

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
    <div className="space-y-4">
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 md:col-span-6 space-y-4">
          <div className="space-y-2">
            <Label>Select Rule</Label>
            <Select value={selectedRuleId} onValueChange={(v) => setSelectedRuleId(v || '')}>
              <SelectTrigger>
                <SelectValue placeholder="Select a rule to test" />
              </SelectTrigger>
              <SelectContent>
                {rules.map(r => (
                  <SelectItem key={r.id} value={r.id}>{r.name} (v{r.version})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Input & Code</Label>
            <Tabs defaultValue="input" className="w-full">
              <TabsList className="mb-2">
                <TabsTrigger value="input">JSON Input</TabsTrigger>
                <TabsTrigger value="code" disabled={!selectedRuleId}>Generated C# Code</TabsTrigger>
              </TabsList>
              <TabsContent value="input">
                <div className="pt-2">
                  <CodeEditor 
                    language="json" 
                    value={inputJson} 
                    onChange={(val) => setInputJson(val || '')} 
                    height="350px"
                  />
                </div>
              </TabsContent>
              <TabsContent value="code">
                <div className="pt-2">
                  {codeLoading ? (
                    <div className="text-muted-foreground p-4 bg-muted rounded-md text-sm">Loading code...</div>
                  ) : generatedCode ? (
                    <div className="space-y-4">
                      <div>
                        <div className="font-semibold text-muted-foreground mb-1 text-sm">Predicate (bool):</div>
                        <CodeEditor 
                          language="csharp" 
                          value={generatedCode.Predicate} 
                          readOnly 
                          height="150px" 
                        />
                      </div>
                      <div>
                        <div className="font-semibold text-muted-foreground mb-1 text-sm">Result (object):</div>
                        <CodeEditor 
                          language="csharp" 
                          value={generatedCode.Result} 
                          readOnly 
                          height="150px" 
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-muted-foreground p-4 bg-muted rounded-md text-sm">Select a rule to view its generated C# code.</div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          <Button onClick={handleTest} disabled={!selectedRuleId || loading} className="w-full">
            {loading ? 'Executing...' : 'Execute Rule'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 border border-destructive text-destructive rounded-md bg-destructive/10">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-2 mt-4">
          <Label>Evaluation Result</Label>
          <div className="pt-2">
            <CodeEditor 
              language="json" 
              value={JSON.stringify(result, null, 2)} 
              readOnly 
              height="200px" 
            />
          </div>
        </div>
      )}
    </div>
  );
}
