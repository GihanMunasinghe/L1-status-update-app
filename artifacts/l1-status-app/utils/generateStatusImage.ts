import { Platform } from "react-native";

// ── Design tokens ──────────────────────────────────────────────────────────────
const BG = "#0f1720";
const CARD = "#13202e";
const BORDER = "#1e3a5f";
const TEXT = "#cbd5e1";
const TEXT_BOLD = "#ffffff";
const MUTED = "#64748b";
const PRIMARY = "#2f81f7";
const AMBER = "#fbbf24";
const AMBER_BG = "rgba(251,191,36,0.10)";
const RED = "#f87171";
const GREEN = "#4ade80";
const ENGINEER = "#7dd3fc";

const WIDTH = 860;
const HPAD = 40;
const VPAD = 44;
const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", "Inter", system-ui, sans-serif';

// ── Segment parser (handles *bold* markers) ─────────────────────────────────
type Seg = { text: string; bold: boolean };

function parseSegs(raw: string): Seg[] {
  return raw
    .split("*")
    .map((t, i) => ({ text: t, bold: i % 2 === 1 }))
    .filter((s) => s.text.length > 0);
}

// ── Measure a line of segments ───────────────────────────────────────────────
function measureSegs(ctx: CanvasRenderingContext2D, segs: Seg[], size: number): number {
  return segs.reduce((w, s) => {
    ctx.font = `${s.bold ? "700" : "400"} ${size}px ${FONT}`;
    return w + ctx.measureText(s.text).width;
  }, 0);
}

// ── Draw segments, return new x ──────────────────────────────────────────────
function drawSegs(
  ctx: CanvasRenderingContext2D,
  segs: Seg[],
  x: number,
  y: number,
  size: number,
  color: string,
  boldColor: string
): void {
  let cx = x;
  for (const s of segs) {
    ctx.font = `${s.bold ? "700" : "400"} ${size}px ${FONT}`;
    ctx.fillStyle = s.bold ? boldColor : color;
    ctx.fillText(s.text, cx, y);
    cx += ctx.measureText(s.text).width;
  }
}

// ── Word-wrap a flat string into lines that fit maxWidth ─────────────────────
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  size: number,
  bold: boolean
): string[] {
  ctx.font = `${bold ? "700" : "400"} ${size}px ${FONT}`;
  const words = text.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const word of words) {
    const test = cur ? `${cur} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && cur) {
      lines.push(cur);
      cur = word;
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [""];
}

// ── Classify a raw text line ─────────────────────────────────────────────────
type LineKind =
  | "empty"
  | "divider"
  | "title"
  | "meta"
  | "engineer"
  | "system"
  | "section"
  | "issue-header"
  | "no-issue"
  | "warning"
  | "muted"
  | "numbered"
  | "normal";

function classify(line: string, idx: number, lines: string[]): LineKind {
  if (!line.trim()) return "empty";
  if (line.startsWith("━")) return "divider";
  if (line.startsWith("    ")) return "muted"; // indented (👤 / ⏱)
  if (line.startsWith("🚨")) return "issue-header";
  if (line.startsWith("✅")) return "no-issue";
  if (line.startsWith("⚠️")) return "warning";
  if (line.startsWith("👷")) return "engineer";

  // Full-bold lines: *text* or *text* (components)
  const fullBold = /^\*[^*]+\*( \(.*\))?$/.test(line);
  if (fullBold) {
    // First full-bold line = title
    const firstBoldIdx = lines.findIndex((l) => /^\*[^*]+\*( \(.*\))?$/.test(l));
    if (idx === firstBoldIdx) return "title";
    // Bold line immediately after an empty line that follows a divider → system name
    const prev = lines[idx - 1] ?? "";
    const prevPrev = lines[idx - 2] ?? "";
    if (!prev.trim() && prevPrev.startsWith("━")) return "system";
    return "section";
  }

  // Starts with a digit and ) or .  → numbered
  if (/^\d+[).] /.test(line)) return "numbered";

  // Date/time meta (contains · separator)
  if (line.includes("·")) return "meta";

  return "normal";
}

// ── Physical row type used for rendering ─────────────────────────────────────
interface Row {
  kind: LineKind;
  raw: string;
  height: number;
}

function buildRows(lines: string[]): Row[] {
  const rows: Row[] = [];
  for (let i = 0; i < lines.length; i++) {
    const kind = classify(lines[i], i, lines);
    const heights: Record<LineKind, number> = {
      empty: 10,
      divider: 28,
      title: 42,
      meta: 22,
      engineer: 24,
      system: 34,
      section: 26,
      "issue-header": 24,
      "no-issue": 24,
      warning: 28,
      muted: 21,
      numbered: 22,
      normal: 22,
    };
    rows.push({ kind, raw: lines[i], height: heights[kind] });
  }
  return rows;
}

// ── Main render ──────────────────────────────────────────────────────────────
function renderToCanvas(text: string): HTMLCanvasElement {
  const lines = text.split("\n");
  const rows = buildRows(lines);
  const totalH = VPAD * 2 + rows.reduce((s, r) => s + r.height, 0);

  const scale = Math.min(window.devicePixelRatio || 1, 2);
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH * scale;
  canvas.height = totalH * scale;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(scale, scale);

  // Background
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, WIDTH, totalH);

  const TW = WIDTH - HPAD * 2; // text area width

  let y = VPAD;

  for (const row of rows) {
    const { kind, raw, height } = row;
    const baseline = y + height * 0.72;

    switch (kind) {
      case "empty":
        break;

      case "divider": {
        const divY = y + height / 2;
        ctx.strokeStyle = BORDER;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(HPAD, divY);
        ctx.lineTo(WIDTH - HPAD, divY);
        ctx.stroke();
        break;
      }

      case "title": {
        const segs = parseSegs(raw);
        ctx.font = `700 20px ${FONT}`;
        ctx.fillStyle = TEXT_BOLD;
        // Strip * before drawing
        const titleText = raw.replace(/\*/g, "");
        ctx.fillText(titleText, HPAD, baseline);
        break;
      }

      case "meta": {
        ctx.font = `400 13px ${FONT}`;
        ctx.fillStyle = MUTED;
        ctx.fillText(raw, HPAD, baseline);
        break;
      }

      case "engineer": {
        ctx.font = `500 13px ${FONT}`;
        ctx.fillStyle = ENGINEER;
        ctx.fillText(raw, HPAD, baseline);
        break;
      }

      case "system": {
        // Blue left accent bar
        ctx.fillStyle = PRIMARY;
        ctx.beginPath();
        ctx.roundRect(HPAD, y + 4, 3, height - 8, 2);
        ctx.fill();
        const segs = parseSegs(raw);
        drawSegs(ctx, segs, HPAD + 12, baseline, 15, TEXT, TEXT_BOLD);
        break;
      }

      case "section": {
        const segs = parseSegs(raw);
        drawSegs(ctx, segs, HPAD, baseline, 13, TEXT, TEXT_BOLD);
        break;
      }

      case "issue-header": {
        const segs = parseSegs(raw);
        drawSegs(ctx, segs, HPAD, baseline, 13, RED, RED);
        break;
      }

      case "no-issue": {
        ctx.font = `400 13px ${FONT}`;
        ctx.fillStyle = GREEN;
        ctx.fillText(raw, HPAD, baseline);
        break;
      }

      case "warning": {
        // Amber background strip
        ctx.fillStyle = AMBER_BG;
        ctx.beginPath();
        ctx.roundRect(HPAD - 6, y + 2, TW + 12, height - 4, 4);
        ctx.fill();
        // Left border
        ctx.fillStyle = AMBER;
        ctx.fillRect(HPAD - 6, y + 2, 3, height - 4);
        const segs = parseSegs(raw);
        drawSegs(ctx, segs, HPAD + 4, baseline, 13, AMBER, AMBER);
        break;
      }

      case "muted": {
        ctx.font = `400 12px ${FONT}`;
        ctx.fillStyle = MUTED;
        ctx.fillText(raw, HPAD + 4, baseline);
        break;
      }

      case "numbered":
      case "normal": {
        // Handle long lines with wrap
        const segs = parseSegs(raw);
        const totalW = measureSegs(ctx, segs, 13);
        if (totalW <= TW) {
          drawSegs(ctx, segs, HPAD, baseline, 13, TEXT, TEXT_BOLD);
        } else {
          const wrapped = wrapText(ctx, raw.replace(/\*/g, ""), TW, 13, false);
          wrapped.forEach((wl, wi) => {
            ctx.font = `400 13px ${FONT}`;
            ctx.fillStyle = TEXT;
            ctx.fillText(wl, HPAD, baseline + wi * 18);
          });
        }
        break;
      }
    }

    y += height;
  }

  // Bottom watermark
  ctx.font = `400 11px ${FONT}`;
  ctx.fillStyle = "#1e3a5f";
  ctx.textAlign = "right";
  ctx.fillText("L1 Status Generator", WIDTH - HPAD, totalH - 14);
  ctx.textAlign = "left";

  return canvas;
}

// ── Public API ────────────────────────────────────────────────────────────────
export function downloadStatusAsImage(text: string, dateStr: string): void {
  if (Platform.OS !== "web" || typeof document === "undefined") return;
  try {
    const canvas = renderToCanvas(text);
    const safe = dateStr.replace(/\//g, "-") || "report";
    const link = document.createElement("a");
    link.download = `L1-Status-${safe}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  } catch (e) {
    console.warn("Image export failed:", e);
  }
}

export const isImageDownloadSupported = Platform.OS === "web";
