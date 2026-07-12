import { useState, useEffect } from 'react';
import { api, RuleDefinition } from './lib/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import RuleList from './components/RuleList';
import RuleTester from './components/RuleTester';

function App() {
  const [rules, setRules] = useState<RuleDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('rules');
  const [executeRuleId, setExecuteRuleId] = useState<string | undefined>();

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const data = await api.getAllRules();
      setRules(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Nergora Rule Manager</h1>
        <p className="text-muted-foreground">Manage and test your business rules dynamically.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="rules">Rules</TabsTrigger>
          <TabsTrigger value="tester">Tester</TabsTrigger>
        </TabsList>
        <TabsContent value="rules" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Configured Rules</CardTitle>
              <CardDescription>
                Create, update, and manage your rules here.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RuleList 
                rules={rules} 
                loading={loading} 
                onRefresh={fetchRules} 
                onExecute={(ruleId) => {
                  setExecuteRuleId(ruleId);
                  setActiveTab('tester');
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="tester" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Rule Tester</CardTitle>
              <CardDescription>
                Evaluate your active rules by providing JSON input.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RuleTester rules={rules} defaultSelectedRuleId={executeRuleId} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default App;
