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
} from "@shared/schema";

export interface IStorage {
  // Gestion des utilisateurs
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Gestion des pipelines
  getPipelineRuns(): Promise<PipelineRun[]>;
  getCurrentPipelineRun(): Promise<PipelineRun | undefined>;
  createPipelineRun(run: InsertPipelineRun): Promise<PipelineRun>;
  updatePipelineRun(id: number, updates: Partial<PipelineRun>): Promise<PipelineRun | undefined>;
  
  // Gestion des étapes de pipeline
  getPipelineStages(pipelineRunId: number): Promise<PipelineStage[]>;
  createPipelineStage(stage: InsertPipelineStage): Promise<PipelineStage>;
  updatePipelineStage(id: number, updates: Partial<PipelineStage>): Promise<PipelineStage | undefined>;
  
  // Gestion des problèmes de sécurité
  getSecurityIssues(): Promise<SecurityIssue[]>;
  getSecurityIssuesByPipeline(pipelineRunId: number): Promise<SecurityIssue[]>;
  createSecurityIssue(issue: InsertSecurityIssue): Promise<SecurityIssue>;
  updateSecurityIssue(id: number, updates: Partial<SecurityIssue>): Promise<SecurityIssue | undefined>;
  
  // Gestion des métriques de code
  getCodeMetrics(): Promise<CodeMetrics | undefined>;
  getCodeMetricsByPipeline(pipelineRunId: number): Promise<CodeMetrics | undefined>;
  createOrUpdateCodeMetrics(metrics: InsertCodeMetrics): Promise<CodeMetrics>;
  
  // Gestion des résultats de tests
  getTestResults(pipelineRunId: number): Promise<TestResults[]>;
  createTestResults(results: InsertTestResults): Promise<TestResults>;
  
  // Gestion des déploiements
  getDeployments(): Promise<Deployment[]>;
  getDeploymentsByPipeline(pipelineRunId: number): Promise<Deployment[]>;
  createDeployment(deployment: InsertDeployment): Promise<Deployment>;
  updateDeployment(id: number, updates: Partial<Deployment>): Promise<Deployment | undefined>;
  
  // Gestion de la conformité
  getComplianceChecks(pipelineRunId: number): Promise<ComplianceCheck[]>;
  createComplianceCheck(check: InsertComplianceCheck): Promise<ComplianceCheck>;
  
  // Métriques du tableau de bord
  getDashboardMetrics(): Promise<DashboardMetrics | undefined>;
  createOrUpdateDashboardMetrics(metrics: InsertDashboardMetrics): Promise<DashboardMetrics>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private pipelineRuns: Map<number, PipelineRun>;
  private pipelineStages: Map<number, PipelineStage>;
  private securityIssues: Map<number, SecurityIssue>;
  private codeMetrics: Map<number, CodeMetrics>;
  private testResults: Map<number, TestResults>;
  private deployments: Map<number, Deployment>;
  private complianceChecks: Map<number, ComplianceCheck>;
  private dashboardMetrics: DashboardMetrics | undefined;
  private currentId: number;

  constructor() {
    this.users = new Map();
    this.pipelineRuns = new Map();
    this.pipelineStages = new Map();
    this.securityIssues = new Map();
    this.codeMetrics = new Map();
    this.testResults = new Map();
    this.deployments = new Map();
    this.complianceChecks = new Map();
    this.currentId = 1;
    this.initializeData();
  }

  private initializeData() {
    // Initialisation des métriques du tableau de bord
    this.dashboardMetrics = {
      id: 1,
      period: "daily",
      date: new Date(),
      totalPipelines: 156,
      successfulPipelines: 147,
      failedPipelines: 9,
      averageDuration: 892, // 14 minutes 52 secondes
      totalSecurityIssues: 24,
      criticalIssues: 3,
      highIssues: 8,
      mediumIssues: 10,
      lowIssues: 3,
      resolvedIssues: 18,
      averageCoverage: "87.3",
      averageComplexity: "6.2",
      totalTechnicalDebt: "14.5h",
      totalDeployments: 89,
      successfulDeployments: 85,
      failedDeployments: 4,
      averageDeploymentTime: 245, // 4 minutes 5 secondes
      lastUpdated: new Date()
    };

    // Ajout d'un pipeline en cours d'exécution
    this.pipelineRuns.set(1, {
      id: 1,
      name: "Build & Deploy - Main Branch",
      branch: "main",
      status: "running",
      currentStage: "sast",
      startTime: new Date(Date.now() - 342000), // 5 minutes 42 secondes
      endTime: null,
      duration: null,
      triggeredBy: "marie.dupont",
      commitHash: "a7b2c9d4e5f6",
      environment: "staging"
    });

    // Ajout des étapes du pipeline
    const pipelineStageData = [
      { stageName: "source", status: "success", duration: 32 },
      { stageName: "build", status: "success", duration: 156 },
      { stageName: "sast", status: "running", duration: null },
      { stageName: "test", status: "pending", duration: null },
      { stageName: "dast", status: "pending", duration: null },
      { stageName: "deploy", status: "pending", duration: null }
    ];

    pipelineStageData.forEach((stage, index) => {
      this.pipelineStages.set(index + 1, {
        id: index + 1,
        pipelineRunId: 1,
        stageName: stage.stageName,
        status: stage.status,
        startTime: stage.status !== "pending" ? new Date(Date.now() - 300000 + (index * 60000)) : null,
        endTime: stage.status === "success" ? new Date(Date.now() - 300000 + (index * 60000) + (stage.duration! * 1000)) : null,
        duration: stage.duration,
        logs: stage.status === "success" ? `${stage.stageName} completed successfully` : null,
        artifactsUrl: stage.status === "success" ? `/artifacts/${stage.stageName}` : null
      });
    });

    // Ajout des problèmes de sécurité
    const securityIssueData = [
      {
        title: "Injection SQL potentielle",
        severity: "critical",
        category: "vulnerability",
        tool: "SonarQube",
        file: "src/auth/login.js",
        line: 42,
        description: "Vulnérabilité d'injection SQL détectée dans l'authentification utilisateur",
        recommendation: "Utiliser des requêtes préparées ou un ORM pour éviter les injections SQL",
        cweId: "CWE-89",
        cvssScore: "9.1"
      },
      {
        title: "Dépendances obsolètes avec vulnérabilités",
        severity: "high",
        category: "dependency",
        tool: "Snyk",
        file: "package.json",
        line: null,
        description: "Plusieurs dépendances contiennent des vulnérabilités de sécurité connues",
        recommendation: "Mettre à jour vers les versions les plus récentes des dépendances",
        cweId: "CWE-1104",
        cvssScore: "7.5"
      },
      {
        title: "Clé API exposée dans le code",
        severity: "critical",
        category: "secret",
        tool: "GitLeaks",
        file: "src/config/database.js",
        line: 15,
        description: "Clé API hardcodée détectée dans le fichier de configuration",
        recommendation: "Déplacer les clés sensibles vers des variables d'environnement",
        cweId: "CWE-798",
        cvssScore: "8.7"
      },
      {
        title: "En-têtes de sécurité manquants",
        severity: "medium",
        category: "vulnerability",
        tool: "OWASP ZAP",
        file: "src/middleware/security.js",
        line: 23,
        description: "Les en-têtes de sécurité ne sont pas correctement configurés",
        recommendation: "Ajouter Content-Security-Policy, X-Frame-Options et autres en-têtes de sécurité",
        cweId: "CWE-693",
        cvssScore: "5.3"
      },
      {
        title: "Validation d'entrée insuffisante",
        severity: "medium",
        category: "vulnerability",
        tool: "ESLint Security",
        file: "src/api/users.js",
        line: 67,
        description: "Les données utilisateur ne sont pas suffisamment validées",
        recommendation: "Implémenter une validation stricte des entrées utilisateur",
        cweId: "CWE-20",
        cvssScore: "6.1"
      }
    ];

    securityIssueData.forEach((issue, index) => {
      this.securityIssues.set(index + 1, {
        id: index + 1,
        pipelineRunId: 1,
        title: issue.title,
        severity: issue.severity,
        category: issue.category,
        tool: issue.tool,
        file: issue.file,
        line: issue.line,
        column: null,
        description: issue.description,
        recommendation: issue.recommendation,
        cweId: issue.cweId,
        cvssScore: issue.cvssScore,
        status: "open",
        assignedTo: null,
        createdAt: new Date(),
        resolvedAt: null
      });
    });

    // Ajout des métriques de qualité de code
    this.codeMetrics.set(1, {
      id: 1,
      pipelineRunId: 1,
      coverage: "87.3",
      linesOfCode: 12547,
      cyclomaticComplexity: "6.2",
      maintainabilityIndex: "A",
      technicalDebt: "14.5h",
      duplicatedLines: 234,
      codeSmells: 18,
      bugs: 5,
      vulnerabilities: 3,
      securityHotspots: 7,
      lastUpdated: new Date()
    });

    // Ajout des résultats de tests
    const testSuites = [
      { testSuite: "unit", totalTests: 1247, passedTests: 1235, failedTests: 12, skippedTests: 0, duration: 45000, coverage: "89.2" },
      { testSuite: "integration", totalTests: 186, passedTests: 184, failedTests: 2, skippedTests: 0, duration: 120000, coverage: "78.5" },
      { testSuite: "e2e", totalTests: 67, passedTests: 65, failedTests: 2, skippedTests: 0, duration: 340000, coverage: "92.1" }
    ];

    testSuites.forEach((suite, index) => {
      this.testResults.set(index + 1, {
        id: index + 1,
        pipelineRunId: 1,
        testSuite: suite.testSuite,
        totalTests: suite.totalTests,
        passedTests: suite.passedTests,
        failedTests: suite.failedTests,
        skippedTests: suite.skippedTests,
        duration: suite.duration,
        coverage: suite.coverage,
        reportUrl: `/reports/${suite.testSuite}`,
        createdAt: new Date()
      });
    });

    // Ajout d'un déploiement
    this.deployments.set(1, {
      id: 1,
      pipelineRunId: 1,
      environment: "staging",
      version: "v2.3.1",
      status: "pending",
      deployedBy: "pipeline-automation",
      deploymentUrl: null,
      healthCheckUrl: "https://staging.app.com/health",
      startTime: new Date(),
      endTime: null,
      rollbackTime: null
    });

    // Ajout des vérifications de conformité
    const complianceData = [
      {
        framework: "SOC2",
        checkType: "control",
        checkName: "Access Control Management",
        status: "passed",
        severity: null,
        description: "Vérification des contrôles d'accès utilisateur",
        evidence: "Logs d'audit disponibles",
        remediation: null
      },
      {
        framework: "GDPR",
        checkType: "requirement",
        checkName: "Data Protection Impact Assessment",
        status: "warning",
        severity: "medium",
        description: "DPIA requis pour ce déploiement",
        evidence: "Données personnelles détectées",
        remediation: "Compléter l'évaluation DPIA avant le déploiement en production"
      },
      {
        framework: "ISO27001",
        checkType: "policy",
        checkName: "Incident Response Plan",
        status: "passed",
        severity: null,
        description: "Plan de réponse aux incidents documenté et testé",
        evidence: "Procédure documentée v2.1",
        remediation: null
      }
    ];

    complianceData.forEach((check, index) => {
      this.complianceChecks.set(index + 1, {
        id: index + 1,
        pipelineRunId: 1,
        framework: check.framework,
        checkType: check.checkType,
        checkName: check.checkName,
        status: check.status,
        severity: check.severity,
        description: check.description,
        evidence: check.evidence,
        remediation: check.remediation,
        createdAt: new Date()
      });
    });

    this.currentId = 100;
  }

  // Méthodes pour les utilisateurs
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
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  // Méthodes pour les pipelines
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
      endTime: null,
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

  // Méthodes pour les étapes de pipeline
  async getPipelineStages(pipelineRunId: number): Promise<PipelineStage[]> {
    return Array.from(this.pipelineStages.values()).filter(
      stage => stage.pipelineRunId === pipelineRunId
    );
  }

  async createPipelineStage(insertStage: InsertPipelineStage): Promise<PipelineStage> {
    const id = this.currentId++;
    const stage: PipelineStage = { ...insertStage, id };
    this.pipelineStages.set(id, stage);
    return stage;
  }

  async updatePipelineStage(id: number, updates: Partial<PipelineStage>): Promise<PipelineStage | undefined> {
    const stage = this.pipelineStages.get(id);
    if (!stage) return undefined;
    
    const updatedStage = { ...stage, ...updates };
    this.pipelineStages.set(id, updatedStage);
    return updatedStage;
  }

  // Méthodes pour les problèmes de sécurité
  async getSecurityIssues(): Promise<SecurityIssue[]> {
    return Array.from(this.securityIssues.values());
  }

  async getSecurityIssuesByPipeline(pipelineRunId: number): Promise<SecurityIssue[]> {
    return Array.from(this.securityIssues.values()).filter(
      issue => issue.pipelineRunId === pipelineRunId
    );
  }

  async createSecurityIssue(insertIssue: InsertSecurityIssue): Promise<SecurityIssue> {
    const id = this.currentId++;
    const issue: SecurityIssue = { 
      ...insertIssue, 
      id,
      status: "open",
      createdAt: new Date(),
      resolvedAt: null
    };
    this.securityIssues.set(id, issue);
    return issue;
  }

  async updateSecurityIssue(id: number, updates: Partial<SecurityIssue>): Promise<SecurityIssue | undefined> {
    const issue = this.securityIssues.get(id);
    if (!issue) return undefined;
    
    const updatedIssue = { ...issue, ...updates };
    this.securityIssues.set(id, updatedIssue);
    return updatedIssue;
  }

  // Méthodes pour les métriques de code
  async getCodeMetrics(): Promise<CodeMetrics | undefined> {
    const metrics = Array.from(this.codeMetrics.values());
    return metrics.length > 0 ? metrics[metrics.length - 1] : undefined;
  }

  async getCodeMetricsByPipeline(pipelineRunId: number): Promise<CodeMetrics | undefined> {
    return Array.from(this.codeMetrics.values()).find(
      metrics => metrics.pipelineRunId === pipelineRunId
    );
  }

  async createOrUpdateCodeMetrics(insertMetrics: InsertCodeMetrics): Promise<CodeMetrics> {
    const existingMetrics = await this.getCodeMetricsByPipeline(insertMetrics.pipelineRunId!);
    
    if (existingMetrics) {
      const updatedMetrics = {
        ...existingMetrics,
        ...insertMetrics,
        lastUpdated: new Date()
      };
      this.codeMetrics.set(existingMetrics.id, updatedMetrics);
      return updatedMetrics;
    } else {
      const id = this.currentId++;
      const metrics: CodeMetrics = {
        id,
        ...insertMetrics,
        lastUpdated: new Date()
      };
      this.codeMetrics.set(id, metrics);
      return metrics;
    }
  }

  // Méthodes pour les résultats de tests
  async getTestResults(pipelineRunId: number): Promise<TestResults[]> {
    return Array.from(this.testResults.values()).filter(
      result => result.pipelineRunId === pipelineRunId
    );
  }

  async createTestResults(insertResults: InsertTestResults): Promise<TestResults> {
    const id = this.currentId++;
    const results: TestResults = { 
      ...insertResults, 
      id,
      createdAt: new Date()
    };
    this.testResults.set(id, results);
    return results;
  }

  // Méthodes pour les déploiements
  async getDeployments(): Promise<Deployment[]> {
    return Array.from(this.deployments.values());
  }

  async getDeploymentsByPipeline(pipelineRunId: number): Promise<Deployment[]> {
    return Array.from(this.deployments.values()).filter(
      deployment => deployment.pipelineRunId === pipelineRunId
    );
  }

  async createDeployment(insertDeployment: InsertDeployment): Promise<Deployment> {
    const id = this.currentId++;
    const deployment: Deployment = { 
      ...insertDeployment, 
      id,
      startTime: new Date(),
      endTime: null,
      rollbackTime: null
    };
    this.deployments.set(id, deployment);
    return deployment;
  }

  async updateDeployment(id: number, updates: Partial<Deployment>): Promise<Deployment | undefined> {
    const deployment = this.deployments.get(id);
    if (!deployment) return undefined;
    
    const updatedDeployment = { ...deployment, ...updates };
    this.deployments.set(id, updatedDeployment);
    return updatedDeployment;
  }

  // Méthodes pour la conformité
  async getComplianceChecks(pipelineRunId: number): Promise<ComplianceCheck[]> {
    return Array.from(this.complianceChecks.values()).filter(
      check => check.pipelineRunId === pipelineRunId
    );
  }

  async createComplianceCheck(insertCheck: InsertComplianceCheck): Promise<ComplianceCheck> {
    const id = this.currentId++;
    const check: ComplianceCheck = { 
      ...insertCheck, 
      id,
      createdAt: new Date()
    };
    this.complianceChecks.set(id, check);
    return check;
  }

  // Méthodes pour les métriques du tableau de bord
  async getDashboardMetrics(): Promise<DashboardMetrics | undefined> {
    return this.dashboardMetrics;
  }

  async createOrUpdateDashboardMetrics(insertMetrics: InsertDashboardMetrics): Promise<DashboardMetrics> {
    if (this.dashboardMetrics) {
      this.dashboardMetrics = {
        ...this.dashboardMetrics,
        ...insertMetrics,
        lastUpdated: new Date()
      };
    } else {
      this.dashboardMetrics = {
        id: this.currentId++,
        ...insertMetrics,
        lastUpdated: new Date()
      };
    }
    return this.dashboardMetrics;
  }
}

export const storage = new MemStorage();