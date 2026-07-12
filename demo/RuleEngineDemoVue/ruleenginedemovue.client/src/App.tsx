import { useState, useEffect } from 'react';
import { api, RuleDefinition } from './lib/api';
import RuleList from './components/RuleList';
import RuleTester from './components/RuleTester';
import CartSimulator from './components/CartSimulator';
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import RuleFormDialog from './components/RuleFormDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function App() {
  const [rules, setRules] = useState<RuleDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [testerDefaultRuleId, setTesterDefaultRuleId] = useState<string>('');
  const [activeTab, setActiveTab] = useState("rules");

  const loadRules = async () => {
    try {
      const data = await api.getAllRules();
      setRules(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary text-primary-foreground w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xl shadow-sm">
              N
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Nergora Rule Manager</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="ecommerce" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
            <TabsTrigger value="ecommerce">E-Commerce Demo</TabsTrigger>
            <TabsTrigger value="manager">Rule Manager</TabsTrigger>
          </TabsList>
          
          <TabsContent value="ecommerce" className="space-y-4 border-none p-0 outline-none">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">Campaign Simulator</h2>
                <p className="text-muted-foreground mt-1">
                  Test dynamic discount rules and campaigns in a realistic e-commerce shopping cart environment.
                </p>
              </div>
            </div>
            <CartSimulator />
          </TabsContent>

          <TabsContent value="manager" className="space-y-4 border-none p-0 outline-none">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">Core Rules</h2>
                <p className="text-muted-foreground mt-1">
                  Manage and test raw business rules.
                </p>
              </div>
              <Button onClick={() => setIsFormOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                New Rule
              </Button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-muted-foreground animate-pulse">Loading rules...</div>
              </div>
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList>
                  <TabsTrigger value="rules">Rules List</TabsTrigger>
                  <TabsTrigger value="tester">Rule Tester</TabsTrigger>
                </TabsList>
                
                <TabsContent value="rules" className="border-none p-0 outline-none">
                  <RuleList 
                    rules={rules} 
                    loading={loading}
                    onRefresh={loadRules}
                    onExecute={(ruleId) => {
                      setTesterDefaultRuleId(ruleId);
                      setActiveTab("tester");
                    }}
                  />
                </TabsContent>
                
                <TabsContent value="tester" className="border-none p-0 outline-none">
                  <RuleTester 
                    rules={rules} 
                    defaultSelectedRuleId={testerDefaultRuleId} 
                  />
                </TabsContent>
              </Tabs>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <RuleFormDialog 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen}
        onSave={loadRules}
      />
    </div>
  );
}

export default App;
