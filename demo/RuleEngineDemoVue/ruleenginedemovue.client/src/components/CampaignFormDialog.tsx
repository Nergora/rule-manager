import { useState, useEffect } from 'react';
import { campaignApi, GeneralCampaign } from '../lib/api';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CodeEditor } from "@/components/ui/code-editor";
import { VisualRuleBuilder } from "./VisualRuleBuilder";
import { VisualActionBuilder } from "./VisualActionBuilder";

interface CampaignFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign?: GeneralCampaign;
  onSave: () => void;
}

export default function CampaignFormDialog({ open, onOpenChange, campaign, onSave }: CampaignFormDialogProps) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [predicate, setPredicate] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (campaign) {
      setCode(campaign.code);
      setName(campaign.name);
      setDescription(campaign.description || '');
      setPredicate(campaign.predicate || '');
      setResult(campaign.result || '');
    } else {
      setCode('');
      setName('');
      setDescription('');
      setPredicate('Input.TotalAmount > 100m');
      setResult('Output.TotalDiscount = new Price(10m, "TRY");');
    }
  }, [campaign, open]);

  const handleSave = async () => {
    try {
      setLoading(true);
      const payload: Partial<GeneralCampaign> = {
        code,
        name,
        description,
        predicate,
        result,
        usage: "true",
        priority: campaign?.priority || 1,
        startDate: campaign?.startDate || new Date().toISOString(),
        endDate: campaign?.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        modulId: 1,
        campaignTypes: campaign?.campaignTypes || 1
      };

      if (campaign) {
        await campaignApi.updateCampaign(campaign.id, { ...campaign, ...payload } as GeneralCampaign);
      } else {
        await campaignApi.createCampaign(payload);
      }
      onSave();
      onOpenChange(false);
    } catch (e) {
      console.error(e);
      alert('Failed to save campaign. Please check the console.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{campaign ? 'Edit Campaign' : 'Create Campaign'}</DialogTitle>
          <DialogDescription>
            {campaign ? 'Modify the properties of your campaign.' : 'Define a new campaign with dynamic C# evaluation rules.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Code</Label>
              <Input placeholder="e.g. SUMMER50" value={code} onChange={e => setCode(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Name</Label>
              <Input placeholder="Campaign Name" value={name} onChange={e => setName(e.target.value)} />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea placeholder="Describe the campaign" value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          
          <Tabs defaultValue="visual" className="w-full pt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="visual">Visual Builder</TabsTrigger>
              <TabsTrigger value="code">Advanced (C#) Mode</TabsTrigger>
            </TabsList>
            
            <TabsContent value="visual" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>If these conditions are met:</Label>
                <VisualRuleBuilder onCodeChange={setPredicate} initialCode={predicate} />
              </div>
              <div className="space-y-2">
                <VisualActionBuilder onCodeChange={setResult} initialCode={result} />
              </div>
            </TabsContent>

            <TabsContent value="code" className="space-y-4 pt-4">
              <div className="bg-destructive/10 text-destructive text-xs p-2 rounded-md mb-4 border border-destructive/20">
                <strong>Warning:</strong> Manual changes here will overwrite the visual builder state. Only use this for advanced C# logic.
              </div>
              <div className="space-y-2">
                <Label>Predicate (C# Expression returning bool)</Label>
                <CodeEditor 
                  language="csharp" 
                  value={predicate} 
                  onChange={val => setPredicate(val || '')} 
                  height="120px" 
                />
              </div>
              <div className="space-y-2">
                <Label>Result (C# Statements)</Label>
                <CodeEditor 
                  language="csharp" 
                  value={result} 
                  onChange={val => setResult(val || '')} 
                  height="120px" 
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading || !name || !code || !predicate || !result}>
            {loading ? 'Saving...' : 'Save Campaign'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
