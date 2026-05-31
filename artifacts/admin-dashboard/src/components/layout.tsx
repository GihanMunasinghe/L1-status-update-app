import { useLocation, Link } from "wouter";
import { LayoutDashboard, FileText, Activity, LogOut, Sun, Moon, AlertTriangle } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/activity", label: "Activity", icon: Activity },
];

function logout() {
  localStorage.removeItem("admin_token");
  window.location.href = import.meta.env.BASE_URL + "login";
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { theme, toggle } = useTheme();

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <aside
        className="w-56 flex-none flex flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground"
        data-testid="sidebar"
      >
        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-sidebar-border">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center flex-none">
            <AlertTriangle className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-bold leading-tight">L1 Admin</p>
            <p className="text-xs text-muted-foreground leading-tight">Operations Hub</p>
          </div>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-0.5">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = location === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
                data-testid={`nav-${label.toLowerCase()}`}
              >
                <Icon className="w-4 h-4 flex-none" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 pb-4 space-y-0.5 border-t border-sidebar-border pt-3">
          <button
            onClick={toggle}
            className="flex w-full items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
            data-testid="button-toggle-theme"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-sidebar-foreground/70 hover:bg-destructive/10 hover:text-destructive transition-colors"
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
