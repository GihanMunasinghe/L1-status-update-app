import { useEffect, useState } from "react";
import { AlertTriangle, RefreshCw, LogIn, LogOut, FileText, ShieldAlert } from "lucide-react";
import { Layout } from "@/components/layout";
import { api, type ActivityLog } from "@/lib/api";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";

const EVENT_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  report_submitted: { label: "Report Submitted", icon: FileText, color: "bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400" },
  admin_login: { label: "Admin Login", icon: LogIn, color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400" },
  admin_login_failed: { label: "Login Failed", icon: ShieldAlert, color: "bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400" },
  admin_logout: { label: "Admin Logout", icon: LogOut, color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
};

function EventIcon({ eventType }: { eventType: string }) {
  const meta = EVENT_META[eventType];
  const Icon = meta?.icon ?? AlertTriangle;
  return (
    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center flex-none", meta?.color ?? "bg-muted text-muted-foreground")}>
      <Icon className="w-3.5 h-3.5" />
    </div>
  );
}

export default function ActivityPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getActivity();
      setLogs(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <Layout>
      <div className="p-6 max-w-3xl mx-auto space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Activity Log</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Last 100 events, newest first</p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-50"
            data-testid="button-refresh"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3" data-testid="text-error">
            <AlertTriangle className="w-4 h-4 flex-none" />
            {error}
          </div>
        )}

        {loading && logs.length === 0 ? (
          <div className="space-y-3 animate-pulse">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-3 items-center">
                <div className="w-8 h-8 rounded-full bg-muted flex-none" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 bg-muted rounded w-48" />
                  <div className="h-3 bg-muted rounded w-32" />
                </div>
              </div>
            ))}
          </div>
        ) : logs.length > 0 ? (
          <div className="relative space-y-0" data-testid="list-activity">
            {logs.map((log, idx) => (
              <div
                key={log.id}
                className="flex gap-4 group"
                data-testid={`row-activity-${log.id}`}
              >
                <div className="flex flex-col items-center">
                  <EventIcon eventType={log.eventType} />
                  {idx < logs.length - 1 && (
                    <div className="w-px flex-1 bg-border my-1 min-h-4" />
                  )}
                </div>
                <div className="flex-1 pb-5 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-sm font-medium">
                      {EVENT_META[log.eventType]?.label ?? log.eventType.replace(/_/g, " ")}
                    </span>
                    <span className="text-xs text-muted-foreground" title={format(new Date(log.createdAt), "PPpp")}>
                      {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  {log.details && (
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed" data-testid={`text-details-${log.id}`}>
                      {log.details}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center" data-testid="empty-activity">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <AlertTriangle className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">No activity yet</p>
            <p className="text-xs text-muted-foreground mt-1">Events will appear here as the team uses the app</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
