import { useEffect, useState } from "react";
import { AlertTriangle, Trash2, Save, ChevronDown, RefreshCw, Loader2 } from "lucide-react";
import { Layout } from "@/components/layout";
import { api, type IssueReport } from "@/lib/api";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

type StatusFilter = "all" | "open" | "in_progress" | "resolved";

const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
};

const STATUS_COLORS: Record<string, string> = {
  open: "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-400",
  in_progress: "text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-400",
  resolved: "text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-400",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border", STATUS_COLORS[status] ?? "bg-muted text-muted-foreground border-border")}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

function ReportRow({ report, onUpdate, onDelete }: {
  report: IssueReport;
  onUpdate: (id: number, status: string, note: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState(report.status);
  const [note, setNote] = useState(report.adminNote);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const dirty = status !== report.status || note !== report.adminNote;

  async function save() {
    setSaving(true);
    await onUpdate(report.id, status, note);
    setSaving(false);
  }

  async function del() {
    if (!confirm(`Delete report #${report.id}? This cannot be undone.`)) return;
    setDeleting(true);
    await onDelete(report.id);
    setDeleting(false);
  }

  return (
    <div className="border border-card-border rounded-lg overflow-hidden" data-testid={`card-report-${report.id}`}>
      <button
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-accent/50 transition-colors"
        onClick={() => setExpanded((v) => !v)}
        data-testid={`button-expand-${report.id}`}
      >
        <div className="flex-1 min-w-0 space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold truncate">{report.systemName}</span>
            <span className="text-xs text-muted-foreground">#{report.id}</span>
            <StatusBadge status={report.status} />
          </div>
          <p className="text-xs text-muted-foreground truncate">{report.issueDescription}</p>
          <p className="text-xs text-muted-foreground">
            {report.reporterName} · {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
          </p>
        </div>
        <ChevronDown className={cn("w-4 h-4 text-muted-foreground flex-none transition-transform", expanded && "rotate-180")} />
      </button>

      {expanded && (
        <div className="border-t border-card-border bg-card p-4 space-y-4" data-testid={`panel-report-${report.id}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Issue Description</p>
              <p className="text-sm leading-relaxed" data-testid={`text-issue-${report.id}`}>{report.issueDescription || "—"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Suggested Solution</p>
              <p className="text-sm leading-relaxed text-muted-foreground" data-testid={`text-solution-${report.id}`}>{report.suggestedSolution || "None provided"}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="space-y-1 flex-none">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="h-8 px-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                data-testid={`select-status-${report.id}`}
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Admin Note</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note for the team..."
                className="w-full h-8 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                data-testid={`input-note-${report.id}`}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={save}
              disabled={saving || !dirty}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
              data-testid={`button-save-${report.id}`}
            >
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
              Save changes
            </button>
            <button
              onClick={del}
              disabled={deleting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-destructive/40 text-destructive text-xs font-semibold hover:bg-destructive/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors ml-auto"
              data-testid={`button-delete-${report.id}`}
            >
              {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReportsPage() {
  const [reports, setReports] = useState<IssueReport[]>([]);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load(f = filter) {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getReports(f === "all" ? undefined : f);
      setReports(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [filter]);

  async function handleUpdate(id: number, status: string, adminNote: string) {
    try {
      const updated = await api.updateReport(id, { status, adminNote });
      setReports((prev) => prev.map((r) => r.id === id ? updated : r));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Update failed");
    }
  }

  async function handleDelete(id: number) {
    try {
      await api.deleteReport(id);
      setReports((prev) => prev.filter((r) => r.id !== id));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Delete failed");
    }
  }

  const filters: { value: StatusFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "open", label: "Open" },
    { value: "in_progress", label: "In Progress" },
    { value: "resolved", label: "Resolved" },
  ];

  return (
    <Layout>
      <div className="p-6 max-w-5xl mx-auto space-y-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Issue Reports</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {reports.length} report{reports.length !== 1 ? "s" : ""}
              {filter !== "all" ? ` · ${STATUS_LABELS[filter]}` : ""}
            </p>
          </div>
          <button
            onClick={() => load()}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-50"
            data-testid="button-refresh"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
            Refresh
          </button>
        </div>

        <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit" data-testid="filter-status">
          {filters.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-semibold transition-colors",
                filter === value
                  ? "bg-card shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
              data-testid={`button-filter-${value}`}
            >
              {label}
            </button>
          ))}
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3" data-testid="text-error">
            <AlertTriangle className="w-4 h-4 flex-none" />
            {error}
          </div>
        )}

        {loading && reports.length === 0 ? (
          <div className="space-y-3 animate-pulse">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 rounded-lg bg-muted" />
            ))}
          </div>
        ) : reports.length > 0 ? (
          <div className="space-y-3">
            {reports.map((r) => (
              <ReportRow
                key={r.id}
                report={r}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center" data-testid="empty-reports">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <AlertTriangle className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">No reports found</p>
            <p className="text-xs text-muted-foreground mt-1">
              {filter !== "all" ? `No ${STATUS_LABELS[filter].toLowerCase()} reports` : "No issue reports submitted yet"}
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
