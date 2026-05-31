import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const STORAGE_KEY = "@l1status_v1";

export interface Line {
  id: string;
  text: string;
  highlight: boolean;
}

export interface SubSection {
  id: string;
  title: string;
  numbered: boolean;
  lines: Line[];
}

export interface OngoingIssue {
  id: string;
  text: string;
  supporter: string;
  eta: string;
}

export interface System {
  id: string;
  name: string;
  components: string;
  ongoing: OngoingIssue[];
  subs: SubSection[];
}

export interface AppState {
  reportTitle: string;
  date: string;
  time: string;
  shiftEngineer: string;
  systems: System[];
}

function genId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function newLine(text = ""): Line {
  return { id: genId(), text, highlight: false };
}

function newSubSection(title = "", numbered = true): SubSection {
  return { id: genId(), title, numbered, lines: [newLine()] };
}

function newIssue(): OngoingIssue {
  return { id: genId(), text: "", supporter: "", eta: "" };
}

function newSystem(): System {
  return {
    id: genId(),
    name: "New System",
    components: "",
    ongoing: [],
    subs: [newSubSection("Status:", true)],
  };
}

function templateState(): AppState {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yy = now.getFullYear();
  let h = now.getHours();
  const ap = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  const dateStr = `${dd}/${mm}/${yy}`;
  const timeStr = `${String(h).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")} ${ap}`;

  return {
    reportTitle: "L1 Support Status Update",
    date: dateStr,
    time: timeStr,
    shiftEngineer: "",
    systems: [
      {
        id: genId(),
        name: "Murex",
        components: "MX3, EWRS, Python, Emdms",
        ongoing: [],
        subs: [
          {
            id: genId(),
            title: "Murex status:",
            numbered: true,
            lines: [
              { id: genId(), text: "New Session check - Ok", highlight: false },
              { id: genId(), text: "Users active - 298", highlight: false },
              { id: genId(), text: "Server Load - 0.11", highlight: false },
            ],
          },
          {
            id: genId(),
            title: "",
            numbered: false,
            lines: [
              {
                id: genId(),
                text: "MLC check for Python and Murex is good.",
                highlight: false,
              },
            ],
          },
          {
            id: genId(),
            title: "MXML Pile-up update:",
            numbered: true,
            lines: [
              {
                id: genId(),
                text: "Overall STP - no pileup detected",
                highlight: false,
              },
              {
                id: genId(),
                text: "eFX trades are processed within 5 mins SLA",
                highlight: false,
              },
            ],
          },
        ],
      },
      {
        id: genId(),
        name: "Operations Apps",
        components: "TLM, GTCS, FX retail etc",
        ongoing: [],
        subs: [
          {
            id: genId(),
            title: "TLM Status:",
            numbered: false,
            lines: [
              {
                id: genId(),
                text: "No control m job failure for today",
                highlight: false,
              },
            ],
          },
        ],
      },
    ],
  };
}

export function generateStatusText(state: AppState): string {
  const out: string[] = [];

  out.push(`*${state.reportTitle}*`);
  const dt = [state.date, state.time].filter(Boolean).join("  ·  ");
  if (dt) out.push(dt);
  if (state.shiftEngineer?.trim()) {
    out.push(`👷 Shift Engineer: ${state.shiftEngineer.trim()}`);
  }
  out.push("━━━━━━━━━━━━━━━━━━━━");

  state.systems.forEach((sys, idx) => {
    if (idx > 0) out.push("━━━━━━━━━━━━━━━━━━━━");
    out.push("");
    out.push(`*${sys.name}*${sys.components ? ` (${sys.components})` : ""}`);

    if (sys.ongoing.length > 0) {
      out.push("");
      out.push("🚨 *ONGOING ISSUES*");
      sys.ongoing.forEach((iss, i) => {
        out.push(`${i + 1}. ${iss.text || "(issue not described)"}`);
        if (iss.supporter?.trim()) {
          out.push(`    👤 Checking: ${iss.supporter.trim()}`);
        }
        if (iss.eta?.trim()) {
          out.push(`    ⏱ ETA: ${iss.eta.trim()}`);
        }
      });
    } else {
      out.push("");
      out.push("✅ No ongoing issues");
    }

    sys.subs.forEach((sub) => {
      if (sub.title.trim()) {
        out.push("");
        out.push(`*${sub.title.trim()}*`);
      }
      sub.lines.forEach((ln, i) => {
        if (!ln.text.trim() && !ln.highlight) return;
        const prefix = sub.numbered ? `${i + 1}) ` : "";
        if (ln.highlight) {
          out.push(`⚠️ *${prefix}${ln.text}*`);
        } else {
          out.push(`${prefix}${ln.text}`);
        }
      });
    });
  });

  return out.join("\n").replace(/^\n+/, "").replace(/\n{3,}/g, "\n\n");
}

interface StatusContextType {
  state: AppState;
  generatedText: string;
  setReportTitle: (v: string) => void;
  setDate: (v: string) => void;
  setTime: (v: string) => void;
  setShiftEngineer: (v: string) => void;
  setNow: () => void;
  addSystem: () => void;
  deleteSystem: (si: number) => void;
  updateSystem: (si: number, field: "name" | "components", value: string) => void;
  addIssue: (si: number) => void;
  deleteIssue: (si: number, ii: number) => void;
  updateIssue: (si: number, ii: number, field: "text" | "supporter" | "eta", value: string) => void;
  addSub: (si: number) => void;
  deleteSub: (si: number, bi: number) => void;
  updateSub: (si: number, bi: number, field: "title" | "numbered", value: string | boolean) => void;
  addLine: (si: number, bi: number) => void;
  deleteLine: (si: number, bi: number, li: number) => void;
  updateLine: (si: number, bi: number, li: number, field: "text" | "highlight", value: string | boolean) => void;
  resetTemplate: () => void;
}

const StatusContext = createContext<StatusContextType | null>(null);

export function StatusProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(templateState);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          setState(JSON.parse(raw));
        } catch {}
      }
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (loaded) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state, loaded]);

  const generatedText = generateStatusText(state);

  const setReportTitle = useCallback(
    (v: string) => setState((s) => ({ ...s, reportTitle: v })),
    []
  );
  const setDate = useCallback(
    (v: string) => setState((s) => ({ ...s, date: v })),
    []
  );
  const setTime = useCallback(
    (v: string) => setState((s) => ({ ...s, time: v })),
    []
  );
  const setShiftEngineer = useCallback(
    (v: string) => setState((s) => ({ ...s, shiftEngineer: v })),
    []
  );

  const setNow = useCallback(() => {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, "0");
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const yy = now.getFullYear();
    let h = now.getHours();
    const ap = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    setState((s) => ({
      ...s,
      date: `${dd}/${mm}/${yy}`,
      time: `${String(h).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")} ${ap}`,
    }));
  }, []);

  const addSystem = useCallback(() => {
    setState((s) => ({ ...s, systems: [...s.systems, newSystem()] }));
  }, []);

  const deleteSystem = useCallback((si: number) => {
    setState((s) => ({
      ...s,
      systems: s.systems.filter((_, i) => i !== si),
    }));
  }, []);

  const updateSystem = useCallback(
    (si: number, field: "name" | "components", value: string) => {
      setState((s) => ({
        ...s,
        systems: s.systems.map((sys, i) =>
          i === si ? { ...sys, [field]: value } : sys
        ),
      }));
    },
    []
  );

  const addIssue = useCallback((si: number) => {
    setState((s) => ({
      ...s,
      systems: s.systems.map((sys, i) =>
        i === si ? { ...sys, ongoing: [...sys.ongoing, newIssue()] } : sys
      ),
    }));
  }, []);

  const deleteIssue = useCallback((si: number, ii: number) => {
    setState((s) => ({
      ...s,
      systems: s.systems.map((sys, i) =>
        i === si
          ? { ...sys, ongoing: sys.ongoing.filter((_, j) => j !== ii) }
          : sys
      ),
    }));
  }, []);

  const updateIssue = useCallback(
    (si: number, ii: number, field: "text" | "supporter" | "eta", value: string) => {
      setState((s) => ({
        ...s,
        systems: s.systems.map((sys, i) =>
          i === si
            ? {
                ...sys,
                ongoing: sys.ongoing.map((iss, j) =>
                  j === ii ? { ...iss, [field]: value } : iss
                ),
              }
            : sys
        ),
      }));
    },
    []
  );

  const addSub = useCallback((si: number) => {
    setState((s) => ({
      ...s,
      systems: s.systems.map((sys, i) =>
        i === si
          ? { ...sys, subs: [...sys.subs, newSubSection()] }
          : sys
      ),
    }));
  }, []);

  const deleteSub = useCallback((si: number, bi: number) => {
    setState((s) => ({
      ...s,
      systems: s.systems.map((sys, i) =>
        i === si
          ? { ...sys, subs: sys.subs.filter((_, j) => j !== bi) }
          : sys
      ),
    }));
  }, []);

  const updateSub = useCallback(
    (si: number, bi: number, field: "title" | "numbered", value: string | boolean) => {
      setState((s) => ({
        ...s,
        systems: s.systems.map((sys, i) =>
          i === si
            ? {
                ...sys,
                subs: sys.subs.map((sub, j) =>
                  j === bi ? { ...sub, [field]: value } : sub
                ),
              }
            : sys
        ),
      }));
    },
    []
  );

  const addLine = useCallback((si: number, bi: number) => {
    setState((s) => ({
      ...s,
      systems: s.systems.map((sys, i) =>
        i === si
          ? {
              ...sys,
              subs: sys.subs.map((sub, j) =>
                j === bi
                  ? { ...sub, lines: [...sub.lines, newLine()] }
                  : sub
              ),
            }
          : sys
      ),
    }));
  }, []);

  const deleteLine = useCallback((si: number, bi: number, li: number) => {
    setState((s) => ({
      ...s,
      systems: s.systems.map((sys, i) =>
        i === si
          ? {
              ...sys,
              subs: sys.subs.map((sub, j) =>
                j === bi
                  ? { ...sub, lines: sub.lines.filter((_, k) => k !== li) }
                  : sub
              ),
            }
          : sys
      ),
    }));
  }, []);

  const updateLine = useCallback(
    (si: number, bi: number, li: number, field: "text" | "highlight", value: string | boolean) => {
      setState((s) => ({
        ...s,
        systems: s.systems.map((sys, i) =>
          i === si
            ? {
                ...sys,
                subs: sys.subs.map((sub, j) =>
                  j === bi
                    ? {
                        ...sub,
                        lines: sub.lines.map((ln, k) =>
                          k === li ? { ...ln, [field]: value } : ln
                        ),
                      }
                    : sub
                ),
              }
            : sys
        ),
      }));
    },
    []
  );

  const resetTemplate = useCallback(() => {
    setState(templateState());
  }, []);

  return (
    <StatusContext.Provider
      value={{
        state,
        generatedText,
        setReportTitle,
        setDate,
        setTime,
        setShiftEngineer,
        setNow,
        addSystem,
        deleteSystem,
        updateSystem,
        addIssue,
        deleteIssue,
        updateIssue,
        addSub,
        deleteSub,
        updateSub,
        addLine,
        deleteLine,
        updateLine,
        resetTemplate,
      }}
    >
      {children}
    </StatusContext.Provider>
  );
}

export function useStatus(): StatusContextType {
  const ctx = useContext(StatusContext);
  if (!ctx) throw new Error("useStatus must be used within StatusProvider");
  return ctx;
}
