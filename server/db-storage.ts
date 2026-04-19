import { eq, desc } from "drizzle-orm";
import { db } from "./db";
import {
  users,
  pipelineRuns,
  pipelineStages,
  securityIssues,
  codeMetrics,
  testResults,
  deployments,
  complianceChecks,
  dashboardMetrics,
  type User,
  type InsertUser,
  type PipelineRun,
  type InsertPipelineRun,
  type PipelineStage,
  type InsertPipelineStage,
  type SecurityIssue,
  type InsertSecurityIssue,
  type CodeMetrics,
  type InsertCodeMetrics,
  type TestResults,
  type InsertTestResults,
  type Deployment,
  type InsertDeployment,
  type ComplianceCheck,
  type InsertComplianceCheck,
  type DashboardMetrics,
  type InsertDashboardMetrics
} from "../shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getPipelineRuns(): Promise<PipelineRun[]>;
  getCurrentPipelineRun(): Promise<PipelineRun | undefined>;
  createPipelineRun(run: InsertPipelineRun): Promise<PipelineRun>;
  updatePipelineRun(id: number, updates: Partial<PipelineRun>): Promise<PipelineRun | undefined>;
  
  getPipelineStages(pipelineRunId: number): Promise<PipelineStage[]>;
  createPipelineStage(stage: InsertPipelineStage): Promise<PipelineStage>;
  
  getSecurityIssues(): Promise<SecurityIssue[]>;
  getSecurityIssuesByPipeline(pipelineRunId: number): Promise<SecurityIssue[]>;
  createSecurityIssue(issue: InsertSecurityIssue): Promise<SecurityIssue>;
  updateSecurityIssue(id: number, updates: Partial<SecurityIssue>): Promise<SecurityIssue | undefined>;
  
  getCodeMetrics(): Promise<CodeMetrics | undefined>;
  getCodeMetricsByPipeline(pipelineRunId: number): Promise<CodeMetrics | undefined>;
  createOrUpdateCodeMetrics(metrics: InsertCodeMetrics): Promise<CodeMetrics>;
  
  getTestResults(pipelineRunId: number): Promise<TestResults[]>;
  createTestResults(results: InsertTestResults): Promise<TestResults>;
  
  getDeployments(): Promise<Deployment[]>;
  getDeploymentsByPipeline(pipelineRunId: number): Promise<Deployment[]>;
  createDeployment(deployment: InsertDeployment): Promise<Deployment>;
  updateDeployment(id: number, updates: Partial<Deployment>): Promise<Deployment | undefined>;
  
  getComplianceChecks(pipelineRunId: number): Promise<ComplianceCheck[]>;
  createComplianceCheck(check: InsertComplianceCheck): Promise<ComplianceCheck>;
  
  getDashboardMetrics(): Promise<DashboardMetrics | undefined>;
  createOrUpdateDashboardMetrics(metrics: InsertDashboardMetrics): Promise<DashboardMetrics>;
}

export class PostgresStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async getPipelineRuns(): Promise<PipelineRun[]> {
    return db.select().from(pipelineRuns).orderBy(desc(pipelineRuns.startTime));
  }

  async getCurrentPipelineRun(): Promise<PipelineRun | undefined> {
    const result = await db.select().from(pipelineRuns).where(eq(pipelineRuns.status, "running")).limit(1);
    return result[0];
  }

  async createPipelineRun(insertRun: InsertPipelineRun): Promise<PipelineRun> {
    const result = await db.insert(pipelineRuns).values(insertRun).returning();
    return result[0];
  }

  async updatePipelineRun(id: number, updates: Partial<PipelineRun>): Promise<PipelineRun | undefined> {
    const result = await db.update(pipelineRuns).set(updates).where(eq(pipelineRuns.id, id)).returning();
    return result[0];
  }

  async getPipelineStages(pipelineRunId: number): Promise<PipelineStage[]> {
    return db.select().from(pipelineStages).where(eq(pipelineStages.pipelineRunId, pipelineRunId));
  }

  async createPipelineStage(insertStage: InsertPipelineStage): Promise<PipelineStage> {
    const result = await db.insert(pipelineStages).values(insertStage).returning();
    return result[0];
  }

  async getSecurityIssues(): Promise<SecurityIssue[]> {
    return db.select().from(securityIssues).orderBy(desc(securityIssues.createdAt));
  }

  async getSecurityIssuesByPipeline(pipelineRunId: number): Promise<SecurityIssue[]> {
    return db.select().from(securityIssues).where(eq(securityIssues.pipelineRunId, pipelineRunId));
  }

  async createSecurityIssue(insertIssue: InsertSecurityIssue): Promise<SecurityIssue> {
    const result = await db.insert(securityIssues).values(insertIssue).returning();
    return result[0];
  }

  async updateSecurityIssue(id: number, updates: Partial<SecurityIssue>): Promise<SecurityIssue | undefined> {
    const result = await db.update(securityIssues).set(updates).where(eq(securityIssues.id, id)).returning();
    return result[0];
  }

  async getCodeMetrics(): Promise<CodeMetrics | undefined> {
    const result = await db.select().from(codeMetrics).orderBy(desc(codeMetrics.lastUpdated)).limit(1);
    return result[0];
  }

  async getCodeMetricsByPipeline(pipelineRunId: number): Promise<CodeMetrics | undefined> {
    const result = await db.select().from(codeMetrics).where(eq(codeMetrics.pipelineRunId, pipelineRunId)).limit(1);
    return result[0];
  }

  async createOrUpdateCodeMetrics(insertMetrics: InsertCodeMetrics): Promise<CodeMetrics> {
    const existing = await this.getCodeMetricsByPipeline(insertMetrics.pipelineRunId!);
    if (existing) {
      const result = await db.update(codeMetrics)
        .set({ ...insertMetrics, lastUpdated: new Date() })
        .where(eq(codeMetrics.id, existing.id))
        .returning();
      return result[0];
    }
    const result = await db.insert(codeMetrics).values(insertMetrics).returning();
    return result[0];
  }

  async getTestResults(pipelineRunId: number): Promise<TestResults[]> {
    return db.select().from(testResults).where(eq(testResults.pipelineRunId, pipelineRunId));
  }

  async createTestResults(insertResults: InsertTestResults): Promise<TestResults> {
    const result = await db.insert(testResults).values(insertResults).returning();
    return result[0];
  }

  async getDeployments(): Promise<Deployment[]> {
    return db.select().from(deployments).orderBy(desc(deployments.startTime));
  }

  async getDeploymentsByPipeline(pipelineRunId: number): Promise<Deployment[]> {
    return db.select().from(deployments).where(eq(deployments.pipelineRunId, pipelineRunId));
  }

  async createDeployment(insertDeployment: InsertDeployment): Promise<Deployment> {
    const result = await db.insert(deployments).values(insertDeployment).returning();
    return result[0];
  }

  async updateDeployment(id: number, updates: Partial<Deployment>): Promise<Deployment | undefined> {
    const result = await db.update(deployments).set(updates).where(eq(deployments.id, id)).returning();
    return result[0];
  }

  async getComplianceChecks(pipelineRunId: number): Promise<ComplianceCheck[]> {
    return db.select().from(complianceChecks).where(eq(complianceChecks.pipelineRunId, pipelineRunId));
  }

  async createComplianceCheck(insertCheck: InsertComplianceCheck): Promise<ComplianceCheck> {
    const result = await db.insert(complianceChecks).values(insertCheck).returning();
    return result[0];
  }

  async getDashboardMetrics(): Promise<DashboardMetrics | undefined> {
    const result = await db.select().from(dashboardMetrics).orderBy(desc(dashboardMetrics.lastUpdated)).limit(1);
    return result[0];
  }

  async createOrUpdateDashboardMetrics(insertMetrics: InsertDashboardMetrics): Promise<DashboardMetrics> {
    const existing = await this.getDashboardMetrics();
    if (existing) {
      const result = await db.update(dashboardMetrics)
        .set({ ...insertMetrics, lastUpdated: new Date() })
        .where(eq(dashboardMetrics.id, existing.id))
        .returning();
      return result[0];
    }
    const result = await db.insert(dashboardMetrics).values(insertMetrics).returning();
    return result[0];
  }
}

export const storage = new PostgresStorage();