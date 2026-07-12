import { useState, useEffect } from 'react';
import { api, RuleDefinition, RuleStatus, UpdateRuleRequest, CreateRuleRequest } from '../lib/api';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface RuleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule?: RuleDefinition;
  onSave: () => void;
}

export default function RuleFormDialog({ open, onOpenChange, rule, onSave }: RuleFormDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<RuleStatus>(RuleStatus.Active);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (rule) {
      setName(rule.name);
      setDescription(rule.description || '');
      setStatus(rule.status);
    } else {
      setName('');
      setDescription('');
      setStatus(RuleStatus.Active);
    }
  }, [rule, open]);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      if (rule) {
        const updateReq: UpdateRuleRequest = {
          name,
          description,
          status,
        };
        await api.updateRule(rule.id, updateReq);
      } else {
        const createReq: CreateRuleRequest = {
          name,
          description,
          content: { type: 0 }, // Basic default content
        };
        await api.createRule(createReq);
      }
      onSave();
      onOpenChange(false);
    } catch (e) {
      console.error("Failed to save rule", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{rule ? 'Edit Rule' : 'Create Rule'}</DialogTitle>
          <DialogDescription>
            {rule ? 'Make changes to your rule here. Click save when you are done.' : 'Add a new rule to your system.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="col-span-3" />
          </div>
          {rule && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">Status</Label>
              <div className="col-span-3">
                <Select value={status.toString()} onValueChange={(v) => setStatus(parseInt(v || '1'))}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select a status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={RuleStatus.Active.toString()}>Active</SelectItem>
                    <SelectItem value={RuleStatus.Draft.toString()}>Draft</SelectItem>
                    <SelectItem value={RuleStatus.Archived.toString()}>Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" onClick={handleSubmit} disabled={loading || !name}>
            {loading ? 'Saving...' : 'Save changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
