import {
  pgTable,
  serial,
  text,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const reportStatusEnum = pgEnum("report_status", [
  "open",
  "in_progress",
  "resolved",
]);

export const issueReportsTable = pgTable("issue_reports", {
  id: serial("id").primaryKey(),
  reporterName: text("reporter_name").notNull(),
  systemName: text("system_name").notNull(),
  issueDescription: text("issue_description").notNull(),
  suggestedSolution: text("suggested_solution").notNull().default(""),
  status: reportStatusEnum("status").notNull().default("open"),
  adminNote: text("admin_note").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertIssueReportSchema = createInsertSchema(
  issueReportsTable
).omit({ id: true, status: true, adminNote: true, createdAt: true, updatedAt: true });

export type InsertIssueReport = z.infer<typeof insertIssueReportSchema>;
export type IssueReport = typeof issueReportsTable.$inferSelect;

export const activityLogsTable = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  eventType: text("event_type").notNull(),
  details: text("details").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type ActivityLog = typeof activityLogsTable.$inferSelect;
