import { useState, useEffect } from 'react';
import { api, RuleDefinition, RuleVersionSnapshot } from '../lib/api';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

interface RuleHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule?: RuleDefinition;
}

export default function RuleHistoryDialog({ open, onOpenChange, rule }: RuleHistoryDialogProps) {
  const [versions, setVersions] = useState<RuleVersionSnapshot[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && rule) {
      fetchVersions();
    }
  }, [open, rule]);

  const fetchVersions = async () => {
    try {
      setLoading(true);
      const data = await api.getVersions(rule!.id);
      setVersions(data);
    } catch (e) {
      console.error("Failed to fetch versions", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Version History</DialogTitle>
          <DialogDescription>
            Historical snapshots for rule: {rule?.name} (ID: {rule?.id})
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {loading ? (
            <div className="text-center py-4">Loading versions...</div>
          ) : versions.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">No version history found.</div>
          ) : (
            <ScrollArea className="h-[400px] w-full rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Version</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Predicate</TableHead>
                    <TableHead>Result</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {versions.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell className="font-bold">v{v.version}</TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        {new Date(v.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-xs font-mono max-w-[200px] truncate" title={v.content?.predicateExpression}>
                        {v.content?.predicateExpression || '-'}
                      </TableCell>
                      <TableCell className="text-xs font-mono max-w-[200px] truncate" title={v.content?.resultExpression}>
                        {v.content?.resultExpression || '-'}
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
