import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const pipelineRuns = pgTable("pipeline_runs", {
  id: serial("id").primaryKey(),
  status: text("status").notNull(), // running, completed, failed
  stage: text("stage").notNull(), // source, build, security, test, deploy
  startTime: timestamp("start_time").defaultNow(),
  duration: integer("duration"), // in seconds
  successRate: text("success_rate"),
});

export const securityIssues = pgTable("security_issues", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  severity: text("severity").notNull(), // critical, high, medium, low
  file: text("file").notNull(),
  line: integer("line"),
  description: text("description"),
  status: text("status").default("open"), // open, resolved, ignored
  createdAt: timestamp("created_at").defaultNow(),
});

export const codeQuality = pgTable("code_quality", {
  id: serial("id").primaryKey(),
  coverage: text("coverage").notNull(),
  complexity: text("complexity").notNull(),
  maintainability: text("maintainability").notNull(),
  technicalDebt: text("technical_debt").notNull(),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const metrics = pgTable("metrics", {
  id: serial("id").primaryKey(),
  successRate: text("success_rate").notNull(),
  securityIssues: integer("security_issues").notNull(),
  coverage: text("coverage").notNull(),
  deployments: integer("deployments").notNull(),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertPipelineRunSchema = createInsertSchema(pipelineRuns).omit({
  id: true,
  startTime: true,
});

export const insertSecurityIssueSchema = createInsertSchema(securityIssues).omit({
  id: true,
  createdAt: true,
  status: true,
});

export const insertCodeQualitySchema = createInsertSchema(codeQuality).omit({
  id: true,
  lastUpdated: true,
});

export const insertMetricsSchema = createInsertSchema(metrics).omit({
  id: true,
  lastUpdated: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type PipelineRun = typeof pipelineRuns.$inferSelect;
export type InsertPipelineRun = z.infer<typeof insertPipelineRunSchema>;
export type SecurityIssue = typeof securityIssues.$inferSelect;
export type InsertSecurityIssue = z.infer<typeof insertSecurityIssueSchema>;
export type CodeQuality = typeof codeQuality.$inferSelect;
export type InsertCodeQuality = z.infer<typeof insertCodeQualitySchema>;
export type Metrics = typeof metrics.$inferSelect;
export type InsertMetrics = z.infer<typeof insertMetricsSchema>;
