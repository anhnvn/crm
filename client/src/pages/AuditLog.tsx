import { useQuery } from "@tanstack/react-query";
import { AuditLog } from "@shared/schema";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileClock, FileEdit, FilePlus2, FileX2, Settings
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AuditLogPage() {
  const { data: logs = [], isLoading } = useQuery<AuditLog[]>({
    queryKey: ["/api/audit-logs"],
  });

  const getIconForLog = (log: AuditLog) => {
    switch (log.action) {
      case "create":
        return <FilePlus2 className="h-4 w-4 text-green-500" />;
      case "update":
        return <FileEdit className="h-4 w-4 text-blue-500" />;
      case "delete":
        return <FileX2 className="h-4 w-4 text-red-500" />;
      default:
        return <FileClock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getBadgeForEntityType = (entityType: string) => {
    switch (entityType) {
      case "client":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Client</Badge>;
      case "interaction":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Interaction</Badge>;
      case "admin":
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Admin</Badge>;
      default:
        return <Badge variant="outline">{entityType}</Badge>;
    }
  };

  const formatDateTime = (dateString: string | Date) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-neutral-800">Audit Log</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Track all changes made to clients and interactions
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Loading audit logs...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-neutral-500">
              <Settings className="h-12 w-12 mx-auto mb-4 text-neutral-300" />
              <p>No audit logs found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Action</TableHead>
                    <TableHead>Entity Type</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead className="w-[180px]">Timestamp</TableHead>
                    <TableHead>User</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex items-center">
                          {getIconForLog(log)}
                          <span className="ml-2 capitalize">{log.action}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getBadgeForEntityType(log.entityType)}</TableCell>
                      <TableCell>{log.details}</TableCell>
                      <TableCell>{formatDateTime(log.createdAt)}</TableCell>
                      <TableCell>
                        {log.adminId ? `Admin ID: ${log.adminId}` : "System"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
