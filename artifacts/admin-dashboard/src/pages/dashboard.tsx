import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock, TrendingUp, Layers, RefreshCw } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Layout } from "@/components/layout";
import { api, type DashboardStats, type IssueReport, type ActivityLog } from "@/lib/api";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

const STATUS_COLORS: Record<string, string> = {
  open: "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-400",
  in_progress: "text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-400",
  resolved: "text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-400",
};

function StatusBadge({ status }: { status: string }) {
  const label = status === "in_progress" ? "In Progress" : status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border", STATUS_COLORS[status] ?? "bg-muted text-muted-foreground border-border")}>
      {label}
    </span>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number | string; icon: React.ElementType; color: string }) {
  return (
    <div className="bg-card border border-card-border rounded-lg p-4 space-y-2" data-testid={`card-stat-${label.toLowerCase().replace(/\s/g, "-")}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
        <div className={cn("w-7 h-7 rounded-md flex items-center justify-center", color)}>
          <Icon className="w-3.5 h-3.5" />
        </div>
      </div>
      <p className="text-2xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentReports, setRecentReports] = useState<IssueReport[]>([]);
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [s, r, a] = await Promise.all([
        api.getStats(),
        api.getReports(),
        api.getActivity(),
      ]);
      setStats(s);
      setRecentReports(r.slice(0, 5));
      setActivity(a.slice(0, 8));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <Layout>
      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-0.5">System issue overview</p>
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

        {loading && !stats ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 animate-pulse">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 rounded-lg bg-muted" />
            ))}
          </div>
        ) : stats ? (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard label="Total Reports" value={stats.total} icon={Layers} color="bg-primary/10 text-primary" />
              <StatCard label="Open" value={stats.open} icon={AlertTriangle} color="bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400" />
              <StatCard label="In Progress" value={stats.inProgress} icon={Clock} color="bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400" />
              <StatCard label="Resolved" value={stats.resolved} icon={CheckCircle2} color="bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-card border border-card-border rounded-lg p-4" data-testid="card-systems-chart">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <h2 className="text-sm font-semibold">Issues by System</h2>
                  <span className="ml-auto text-xs text-muted-foreground">{stats.thisWeek} this week</span>
                </div>
                {stats.bySystem.length > 0 ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={stats.bySystem} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <XAxis dataKey="systemName" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ fontSize: 12, borderRadius: 6, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", color: "hsl(var(--card-foreground))" }}
                        cursor={{ fill: "hsl(var(--accent))" }}
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {stats.bySystem.map((_, index) => (
                          <Cell key={index} fill="hsl(var(--primary))" fillOpacity={0.85} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-44 flex items-center justify-center text-sm text-muted-foreground">No data yet</div>
                )}
              </div>

              <div className="bg-card border border-card-border rounded-lg p-4" data-testid="card-recent-activity">
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="w-4 h-4 text-primary" />
                  <h2 className="text-sm font-semibold">Recent Activity</h2>
                </div>
                {activity.length > 0 ? (
                  <ul className="space-y-2">
                    {activity.map((log) => (
                      <li key={log.id} className="flex gap-3 text-sm" data-testid={`row-activity-${log.id}`}>
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-none" />
                        <div className="flex-1 min-w-0">
                          <p className="truncate font-medium leading-tight">{log.details || log.eventType}</p>
                          <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No activity yet</p>
                )}
              </div>
            </div>

            <div className="bg-card border border-card-border rounded-lg p-4" data-testid="card-recent-reports">
              <h2 className="text-sm font-semibold mb-3">Recent Reports</h2>
              {recentReports.length > 0 ? (
                <div className="space-y-2">
                  {recentReports.map((r) => (
                    <div key={r.id} className="flex items-start gap-3 py-2 border-b border-border last:border-0" data-testid={`row-report-${r.id}`}>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{r.systemName}</p>
                        <p className="text-xs text-muted-foreground truncate">{r.issueDescription}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">by {r.reporterName} · {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}</p>
                      </div>
                      <StatusBadge status={r.status} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No reports yet</p>
              )}
            </div>
          </>
        ) : null}
      </div>
    </Layout>
  );
}

function Activity(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}
