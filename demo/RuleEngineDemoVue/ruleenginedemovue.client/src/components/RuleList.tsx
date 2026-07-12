import { useState } from 'react';
import { RuleDefinition, RuleStatus } from '../lib/api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import RuleFormDialog from './RuleFormDialog';
import RuleHistoryDialog from './RuleHistoryDialog';
import { PlayIcon, HistoryIcon, Edit2Icon, PlusIcon } from 'lucide-react';

interface RuleListProps {
  rules: RuleDefinition[];
  loading: boolean;
  onRefresh: () => void;
  onExecute: (ruleId: string) => void;
}

export default function RuleList({ rules, loading, onRefresh, onExecute }: RuleListProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<RuleDefinition | undefined>();

  const openEdit = (rule?: RuleDefinition) => {
    setSelectedRule(rule);
    setFormOpen(true);
  };

  const openHistory = (rule: RuleDefinition) => {
    setSelectedRule(rule);
    setHistoryOpen(true);
  };

  if (loading) {
    return <div className="p-4 text-center">Loading rules...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Button onClick={() => openEdit()} size="sm">
          <PlusIcon className="w-4 h-4 mr-2" /> New Rule
        </Button>
        <Button onClick={onRefresh} variant="outline" size="sm">
          Refresh
        </Button>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Version</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rules.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No rules found.
                </TableCell>
              </TableRow>
            ) : (
              rules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="font-mono text-xs">{rule.id.substring(0, 8)}...</TableCell>
                  <TableCell className="font-medium">{rule.name}</TableCell>
                  <TableCell>
                    <Badge variant={rule.status === RuleStatus.Active ? 'default' : 'secondary'}>
                      {RuleStatus[rule.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>v{rule.version}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(rule)} title="Edit">
                      <Edit2Icon className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onExecute(rule.id)} title="Execute/Test">
                      <PlayIcon className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openHistory(rule)} title="History">
                      <HistoryIcon className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <RuleFormDialog 
        open={formOpen} 
        onOpenChange={setFormOpen} 
        rule={selectedRule} 
        onSave={onRefresh} 
      />
      
      <RuleHistoryDialog 
        open={historyOpen} 
        onOpenChange={setHistoryOpen} 
        rule={selectedRule} 
      />
    </div>
  );
}
