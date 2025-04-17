import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { AuditLog } from "@shared/schema";
import { Check, FileEdit, MessageSquare, AlertTriangle, Bell, Calendar } from "lucide-react";

interface ActivityFeedProps {
  logs: AuditLog[];
  maxHeight?: string;
  showViewAll?: boolean;
}

export default function ActivityFeed({ logs, maxHeight = "400px", showViewAll = true }: ActivityFeedProps) {
  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.round(diffMs / (1000 * 60));
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 60) {
      return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getIconForActivity = (log: AuditLog) => {
    // Action-based icons
    if (log.action === 'create') {
      return <Check className="h-5 w-5 text-green-600" />;
    } else if (log.action === 'update') {
      return <FileEdit className="h-5 w-5 text-blue-600" />;
    } else if (log.action === 'delete') {
      return <AlertTriangle className="h-5 w-5 text-red-600" />;
    }
    
    // Entity-based fallback icons
    if (log.entityType === 'client') {
      return <Check className="h-5 w-5 text-green-600" />;
    } else if (log.entityType === 'interaction') {
      return <MessageSquare className="h-5 w-5 text-blue-600" />;
    } else if (log.entityType === 'admin') {
      return <Bell className="h-5 w-5 text-yellow-600" />;
    }
    
    // Default icon
    return <Calendar className="h-5 w-5 text-neutral-600" />;
  };

  const getIconBgColor = (log: AuditLog) => {
    if (log.action === 'create') {
      return "bg-green-100";
    } else if (log.action === 'update') {
      return "bg-blue-100";
    } else if (log.action === 'delete') {
      return "bg-red-100";
    }
    
    // Entity-based fallback colors
    if (log.entityType === 'client') {
      return "bg-green-100";
    } else if (log.entityType === 'interaction') {
      return "bg-blue-100";
    } else if (log.entityType === 'admin') {
      return "bg-yellow-100";
    }
    
    return "bg-neutral-100";
  };

  const getActivityTitle = (log: AuditLog) => {
    if (log.action === 'create') {
      return `New ${log.entityType} created`;
    } else if (log.action === 'update') {
      return `${log.entityType.charAt(0).toUpperCase() + log.entityType.slice(1)} updated`;
    } else if (log.action === 'delete') {
      return `${log.entityType.charAt(0).toUpperCase() + log.entityType.slice(1)} deleted`;
    }
    
    return `${log.action} ${log.entityType}`;
  };

  return (
    <Card>
      <CardHeader className="border-b border-neutral-200">
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className={`p-0 ${maxHeight ? `h-[${maxHeight}]` : ""} overflow-y-auto`}>
        <ul className="space-y-0">
          {logs.map((log) => (
            <li key={log.id} className="relative pb-4 last:pb-0 p-4 border-b border-neutral-100 last:border-b-0">
              <div className="relative flex items-start space-x-3">
                <div className="relative">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${getIconBgColor(log)}`}>
                    {getIconForActivity(log)}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div>
                    <div className="text-sm text-neutral-800 font-medium">
                      {getActivityTitle(log)}
                    </div>
                    <p className="mt-0.5 text-sm text-neutral-500">
                      {log.details}
                    </p>
                  </div>
                  <div className="mt-1 flex items-center space-x-2 text-xs text-neutral-500">
                    <div>{formatDate(log.createdAt)}</div>
                  </div>
                </div>
              </div>
              
            </li>
          ))}

          {logs.length === 0 && (
            <li className="p-4 text-center text-neutral-500">
              No recent activity found
            </li>
          )}
        </ul>
      </CardContent>
      {showViewAll && (
        <CardFooter className="px-4 py-3 bg-neutral-50 border-t border-neutral-200 justify-center">
          <Link href="/audit-log" className="text-sm font-medium text-primary-600 hover:text-primary-500">
            View all activity
          </Link>
        </CardFooter>
      )}
    </Card>
  );
}
