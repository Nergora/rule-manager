import { useState, useEffect } from 'react';
import { api, RuleDefinition } from '../lib/api';
import RuleList from '../components/RuleList';
import RuleTester from '../components/RuleTester';
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import RuleFormDialog from '../components/RuleFormDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function RulesPage() {
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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
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

      <RuleFormDialog 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen}
        onSave={loadRules}
      />
    </div>
  );
}
