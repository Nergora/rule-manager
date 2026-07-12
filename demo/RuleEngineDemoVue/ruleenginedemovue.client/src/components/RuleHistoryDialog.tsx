import { useState, useEffect } from 'react';
import { api, RuleDefinition, RuleExecutionAudit } from '../lib/api';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface RuleHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule?: RuleDefinition;
}

export default function RuleHistoryDialog({ open, onOpenChange, rule }: RuleHistoryDialogProps) {
  const [history, setHistory] = useState<RuleExecutionAudit[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && rule) {
      fetchHistory();
    }
  }, [open, rule]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const data = await api.getAuditHistory(rule!.id);
      setHistory(data);
    } catch (e) {
      console.error("Failed to fetch history", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Execution History</DialogTitle>
          <DialogDescription>
            Audit log for rule: {rule?.name} (ID: {rule?.id})
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {loading ? (
            <div className="text-center py-4">Loading history...</div>
          ) : history.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">No execution history found.</div>
          ) : (
            <ScrollArea className="h-[400px] w-full rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Input/Output</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs whitespace-nowrap">
                        {new Date(log.executedAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={log.success ? 'default' : 'destructive'}>
                          {log.success ? 'Success' : 'Failed'}
                        </Badge>
                      </TableCell>
                      <TableCell>{log.executionDurationMs}ms</TableCell>
                      <TableCell className="text-xs font-mono max-w-[200px] truncate" title={`Input: ${log.input}\nOutput: ${log.output}`}>
                        IN: {log.input} <br/>
                        OUT: {log.output}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
