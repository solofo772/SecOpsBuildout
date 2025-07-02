import { 
  users, 
  pipelineRuns, 
  securityIssues, 
  codeQuality, 
  metrics,
  type User, 
  type InsertUser,
  type PipelineRun,
  type InsertPipelineRun,
  type SecurityIssue,
  type InsertSecurityIssue,
  type CodeQuality,
  type InsertCodeQuality,
  type Metrics,
  type InsertMetrics
} from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getPipelineRuns(): Promise<PipelineRun[]>;
  getCurrentPipelineRun(): Promise<PipelineRun | undefined>;
  createPipelineRun(run: InsertPipelineRun): Promise<PipelineRun>;
  updatePipelineRun(id: number, updates: Partial<PipelineRun>): Promise<PipelineRun | undefined>;
  
  getSecurityIssues(): Promise<SecurityIssue[]>;
  createSecurityIssue(issue: InsertSecurityIssue): Promise<SecurityIssue>;
  
  getCodeQuality(): Promise<CodeQuality | undefined>;
  createOrUpdateCodeQuality(quality: InsertCodeQuality): Promise<CodeQuality>;
  
  getMetrics(): Promise<Metrics | undefined>;
  createOrUpdateMetrics(metricsData: InsertMetrics): Promise<Metrics>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private pipelineRuns: Map<number, PipelineRun>;
  private securityIssues: Map<number, SecurityIssue>;
  private codeQuality: CodeQuality | undefined;
  private metrics: Metrics | undefined;
  private currentId: number;

  constructor() {
    this.users = new Map();
    this.pipelineRuns = new Map();
    this.securityIssues = new Map();
    this.currentId = 1;
    this.initializeData();
  }

  private initializeData() {
    // Initialize with sample data
    this.metrics = {
      id: 1,
      successRate: "94.2",
      securityIssues: 12,
      coverage: "87.3",
      deployments: 24,
      lastUpdated: new Date()
    };

    this.codeQuality = {
      id: 1,
      coverage: "87.3",
      complexity: "6.2",
      maintainability: "A",
      technicalDebt: "3.2h",
      lastUpdated: new Date()
    };

    // Add current pipeline run
    this.pipelineRuns.set(1, {
      id: 1,
      status: "running",
      stage: "security",
      startTime: new Date(Date.now() - 222000), // 3m 42s ago
      duration: 222,
      successRate: "65"
    });

    // Add security issues
    this.securityIssues.set(1, {
      id: 1,
      title: "SQL Injection Vulnerability",
      severity: "critical",
      file: "src/auth/login.js:42",
      line: 42,
      description: "Potential SQL injection vulnerability detected in user authentication",
      status: "open",
      createdAt: new Date()
    });

    this.securityIssues.set(2, {
      id: 2,
      title: "Outdated Dependencies",
      severity: "medium",
      file: "package.json",
      line: null,
      description: "Several dependencies are outdated and may contain security vulnerabilities",
      status: "open",
      createdAt: new Date()
    });

    this.securityIssues.set(3, {
      id: 3,
      title: "Missing Security Headers",
      severity: "low",
      file: "src/middleware/security.js",
      line: 15,
      description: "Security headers are not properly configured",
      status: "open",
      createdAt: new Date()
    });

    this.currentId = 4;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getPipelineRuns(): Promise<PipelineRun[]> {
    return Array.from(this.pipelineRuns.values());
  }

  async getCurrentPipelineRun(): Promise<PipelineRun | undefined> {
    return Array.from(this.pipelineRuns.values()).find(run => run.status === "running");
  }

  async createPipelineRun(insertRun: InsertPipelineRun): Promise<PipelineRun> {
    const id = this.currentId++;
    const run: PipelineRun = { 
      ...insertRun, 
      id,
      startTime: new Date(),
      duration: null
    };
    this.pipelineRuns.set(id, run);
    return run;
  }

  async updatePipelineRun(id: number, updates: Partial<PipelineRun>): Promise<PipelineRun | undefined> {
    const run = this.pipelineRuns.get(id);
    if (!run) return undefined;
    
    const updatedRun = { ...run, ...updates };
    this.pipelineRuns.set(id, updatedRun);
    return updatedRun;
  }

  async getSecurityIssues(): Promise<SecurityIssue[]> {
    return Array.from(this.securityIssues.values());
  }

  async createSecurityIssue(insertIssue: InsertSecurityIssue): Promise<SecurityIssue> {
    const id = this.currentId++;
    const issue: SecurityIssue = { 
      ...insertIssue, 
      id,
      status: "open",
      createdAt: new Date()
    };
    this.securityIssues.set(id, issue);
    return issue;
  }

  async getCodeQuality(): Promise<CodeQuality | undefined> {
    return this.codeQuality;
  }

  async createOrUpdateCodeQuality(insertQuality: InsertCodeQuality): Promise<CodeQuality> {
    if (this.codeQuality) {
      this.codeQuality = {
        ...this.codeQuality,
        ...insertQuality,
        lastUpdated: new Date()
      };
    } else {
      this.codeQuality = {
        id: this.currentId++,
        ...insertQuality,
        lastUpdated: new Date()
      };
    }
    return this.codeQuality;
  }

  async getMetrics(): Promise<Metrics | undefined> {
    return this.metrics;
  }

  async createOrUpdateMetrics(insertMetrics: InsertMetrics): Promise<Metrics> {
    if (this.metrics) {
      this.metrics = {
        ...this.metrics,
        ...insertMetrics,
        lastUpdated: new Date()
      };
    } else {
      this.metrics = {
        id: this.currentId++,
        ...insertMetrics,
        lastUpdated: new Date()
      };
    }
    return this.metrics;
  }
}

export const storage = new MemStorage();
