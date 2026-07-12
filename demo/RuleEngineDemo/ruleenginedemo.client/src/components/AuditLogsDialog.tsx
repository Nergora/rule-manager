import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AuditLog {
  id: string;
  ruleId: string;
  version: number;
  executedAt: string;
  duration: string;
  success: boolean;
  errorMessage: string | null;
  input: string;
  output: string | null;
}

interface AuditLogsDialogProps {
  ruleId: string | null;
  ruleName: string | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuditLogsDialog({
  ruleId,
  ruleName,
  isOpen,
  onOpenChange,
}: AuditLogsDialogProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && ruleId) {
      fetchLogs(ruleId);
    }
  }, [isOpen, ruleId]);

  const fetchLogs = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/Rule/audit/${id}?limit=50`);
      if (!response.ok) throw new Error("Failed to fetch logs");
      const data = await response.json();
      setLogs(data);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            Execution Logs - {ruleName || "Rule"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden mt-4">
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : error ? (
            <div className="text-red-500 text-center py-8">{error}</div>
          ) : logs.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No execution logs found for this rule.
            </div>
          ) : (
            <ScrollArea className="h-full border rounded-md">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Input</TableHead>
                    <TableHead>Output</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap text-xs">
                        {new Date(log.executedAt).toLocaleString("tr-TR", { 
                          day: "2-digit", month: "short", 
                          hour: "2-digit", minute: "2-digit", second: "2-digit" 
                        })}
                      </TableCell>
                      <TableCell>
                        {log.success ? (
                          <Badge variant="default" className="bg-green-500">
                            Success
                          </Badge>
                        ) : (
                          <Badge variant="destructive" title={log.errorMessage || ""}>
                            Failed
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {log.duration}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-xs font-mono" title={log.input}>
                        {log.input}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-xs font-mono" title={log.output || ""}>
                        {log.output || "-"}
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
