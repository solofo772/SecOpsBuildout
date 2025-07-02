import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Table des utilisateurs pour l'authentification
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default("developer"), // developer, security, devops, admin
  createdAt: timestamp("created_at").defaultNow(),
});

// Exécutions de pipeline CI/CD
export const pipelineRuns = pgTable("pipeline_runs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  branch: text("branch").notNull().default("main"),
  status: text("status").notNull(), // pending, running, success, failed, cancelled
  currentStage: text("current_stage"), // source, build, sast, test, dast, deploy
  startTime: timestamp("start_time").defaultNow(),
  endTime: timestamp("end_time"),
  duration: integer("duration"), // en secondes
  triggeredBy: text("triggered_by").notNull(),
  commitHash: text("commit_hash"),
  environment: text("environment").default("staging"), // staging, production
});

// Étapes détaillées du pipeline
export const pipelineStages = pgTable("pipeline_stages", {
  id: serial("id").primaryKey(),
  pipelineRunId: integer("pipeline_run_id").references(() => pipelineRuns.id),
  stageName: text("stage_name").notNull(), // source, build, sast, test, dast, deploy
  status: text("status").notNull(), // pending, running, success, failed, skipped
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  duration: integer("duration"),
  logs: text("logs"),
  artifactsUrl: text("artifacts_url"),
});

// Problèmes de sécurité détectés
export const securityIssues = pgTable("security_issues", {
  id: serial("id").primaryKey(),
  pipelineRunId: integer("pipeline_run_id").references(() => pipelineRuns.id),
  title: text("title").notNull(),
  severity: text("severity").notNull(), // critical, high, medium, low, info
  category: text("category").notNull(), // vulnerability, secret, license, dependency
  tool: text("tool").notNull(), // sonarqube, snyk, bandit, semgrep, etc.
  file: text("file").notNull(),
  line: integer("line"),
  column: integer("column"),
  description: text("description"),
  recommendation: text("recommendation"),
  cweId: text("cwe_id"), // Common Weakness Enumeration ID
  cvssScore: text("cvss_score"), // Common Vulnerability Scoring System
  status: text("status").default("open"), // open, acknowledged, resolved, false_positive
  assignedTo: text("assigned_to"),
  createdAt: timestamp("created_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

// Métriques de qualité du code
export const codeMetrics = pgTable("code_metrics", {
  id: serial("id").primaryKey(),
  pipelineRunId: integer("pipeline_run_id").references(() => pipelineRuns.id),
  coverage: text("coverage").notNull(), // pourcentage de couverture
  linesOfCode: integer("lines_of_code"),
  cyclomaticComplexity: text("cyclomatic_complexity"),
  maintainabilityIndex: text("maintainability_index"),
  technicalDebt: text("technical_debt"), // en heures
  duplicatedLines: integer("duplicated_lines"),
  codeSmells: integer("code_smells"),
  bugs: integer("bugs"),
  vulnerabilities: integer("vulnerabilities"),
  securityHotspots: integer("security_hotspots"),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// Tests et résultats
export const testResults = pgTable("test_results", {
  id: serial("id").primaryKey(),
  pipelineRunId: integer("pipeline_run_id").references(() => pipelineRuns.id),
  testSuite: text("test_suite").notNull(), // unit, integration, e2e, performance, security
  totalTests: integer("total_tests").notNull(),
  passedTests: integer("passed_tests").notNull(),
  failedTests: integer("failed_tests").notNull(),
  skippedTests: integer("skipped_tests").notNull(),
  duration: integer("duration"), // en millisecondes
  coverage: text("coverage"),
  reportUrl: text("report_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Déploiements
export const deployments = pgTable("deployments", {
  id: serial("id").primaryKey(),
  pipelineRunId: integer("pipeline_run_id").references(() => pipelineRuns.id),
  environment: text("environment").notNull(), // staging, production
  version: text("version").notNull(),
  status: text("status").notNull(), // pending, deploying, success, failed, rolled_back
  deployedBy: text("deployed_by").notNull(),
  deploymentUrl: text("deployment_url"),
  healthCheckUrl: text("health_check_url"),
  startTime: timestamp("start_time").defaultNow(),
  endTime: timestamp("end_time"),
  rollbackTime: timestamp("rollback_time"),
});

// Conformité et audit
export const complianceChecks = pgTable("compliance_checks", {
  id: serial("id").primaryKey(),
  pipelineRunId: integer("pipeline_run_id").references(() => pipelineRuns.id),
  framework: text("framework").notNull(), // SOC2, ISO27001, GDPR, PCI-DSS
  checkType: text("check_type").notNull(), // policy, control, requirement
  checkName: text("check_name").notNull(),
  status: text("status").notNull(), // passed, failed, warning, not_applicable
  severity: text("severity"), // high, medium, low
  description: text("description"),
  evidence: text("evidence"),
  remediation: text("remediation"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Métriques globales du tableau de bord
export const dashboardMetrics = pgTable("dashboard_metrics", {
  id: serial("id").primaryKey(),
  period: text("period").notNull(), // daily, weekly, monthly
  date: timestamp("date").defaultNow(),
  
  // Métriques de pipeline
  totalPipelines: integer("total_pipelines").notNull().default(0),
  successfulPipelines: integer("successful_pipelines").notNull().default(0),
  failedPipelines: integer("failed_pipelines").notNull().default(0),
  averageDuration: integer("average_duration").default(0), // en secondes
  
  // Métriques de sécurité
  totalSecurityIssues: integer("total_security_issues").notNull().default(0),
  criticalIssues: integer("critical_issues").notNull().default(0),
  highIssues: integer("high_issues").notNull().default(0),
  mediumIssues: integer("medium_issues").notNull().default(0),
  lowIssues: integer("low_issues").notNull().default(0),
  resolvedIssues: integer("resolved_issues").notNull().default(0),
  
  // Métriques de qualité
  averageCoverage: text("average_coverage").default("0"),
  averageComplexity: text("average_complexity").default("0"),
  totalTechnicalDebt: text("total_technical_debt").default("0h"),
  
  // Métriques de déploiement
  totalDeployments: integer("total_deployments").notNull().default(0),
  successfulDeployments: integer("successful_deployments").notNull().default(0),
  failedDeployments: integer("failed_deployments").notNull().default(0),
  averageDeploymentTime: integer("average_deployment_time").default(0),
  
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// Schémas d'insertion
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertPipelineRunSchema = createInsertSchema(pipelineRuns).omit({
  id: true,
  startTime: true,
  endTime: true,
});

export const insertPipelineStageSchema = createInsertSchema(pipelineStages).omit({
  id: true,
});

export const insertSecurityIssueSchema = createInsertSchema(securityIssues).omit({
  id: true,
  createdAt: true,
  resolvedAt: true,
});

export const insertCodeMetricsSchema = createInsertSchema(codeMetrics).omit({
  id: true,
  lastUpdated: true,
});

export const insertTestResultsSchema = createInsertSchema(testResults).omit({
  id: true,
  createdAt: true,
});

export const insertDeploymentSchema = createInsertSchema(deployments).omit({
  id: true,
  startTime: true,
  endTime: true,
  rollbackTime: true,
});

export const insertComplianceCheckSchema = createInsertSchema(complianceChecks).omit({
  id: true,
  createdAt: true,
});

export const insertDashboardMetricsSchema = createInsertSchema(dashboardMetrics).omit({
  id: true,
  lastUpdated: true,
});

// Types exportés
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type PipelineRun = typeof pipelineRuns.$inferSelect;
export type InsertPipelineRun = z.infer<typeof insertPipelineRunSchema>;

export type PipelineStage = typeof pipelineStages.$inferSelect;
export type InsertPipelineStage = z.infer<typeof insertPipelineStageSchema>;

export type SecurityIssue = typeof securityIssues.$inferSelect;
export type InsertSecurityIssue = z.infer<typeof insertSecurityIssueSchema>;

export type CodeMetrics = typeof codeMetrics.$inferSelect;
export type InsertCodeMetrics = z.infer<typeof insertCodeMetricsSchema>;

export type TestResults = typeof testResults.$inferSelect;
export type InsertTestResults = z.infer<typeof insertTestResultsSchema>;

export type Deployment = typeof deployments.$inferSelect;
export type InsertDeployment = z.infer<typeof insertDeploymentSchema>;

export type ComplianceCheck = typeof complianceChecks.$inferSelect;
export type InsertComplianceCheck = z.infer<typeof insertComplianceCheckSchema>;

export type DashboardMetrics = typeof dashboardMetrics.$inferSelect;
export type InsertDashboardMetrics = z.infer<typeof insertDashboardMetricsSchema>;
