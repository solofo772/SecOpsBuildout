import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./db-storage";
import {
  insertPipelineRunSchema,
  insertSecurityIssueSchema,
  insertCodeMetricsSchema,
  insertDashboardMetricsSchema,
  insertPipelineStageSchema,
  insertTestResultsSchema,
  insertDeploymentSchema,
  insertComplianceCheckSchema,
} from "@shared/schema";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  const [hashed, salt] = stored.split(".");
  const buf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(Buffer.from(hashed, "hex"), buf);
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!(req.session as any).userId) {
    return res.status(401).json({ message: "Non authentifié" });
  }
  next();
}
import {
  setGitHubConfig,
  getGitHubConfig,
  clearGitHubConfig,
  fetchWorkflowRuns,
  fetchDependabotAlerts,
  fetchRepoInfo,
  analyzePackageJson,
} from "./github";
import {
  setGitLabConfig,
  getGitLabConfig,
  clearGitLabConfig,
  fetchGitLabPipelines,
  fetchGitLabVulnerabilities,
  fetchGitLabRepoInfo,
} from "./gitlab";
import {
  setBitbucketConfig,
  getBitbucketConfig,
  clearBitbucketConfig,
  fetchBitbucketPipelines,
  fetchBitbucketRepoInfo,
  fetchBitbucketSecurityReports,
} from "./bitbucket";

export async function registerRoutes(app: Express): Promise<Server> {
  // === AUTHENTIFICATION ===

  // Inscription
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, email, password } = req.body;
      if (!username || !email || !password) {
        return res.status(400).json({ message: "Tous les champs sont obligatoires." });
      }
      const existing = await storage.getUserByUsername(username);
      if (existing) {
        return res.status(409).json({ message: "Ce nom d'utilisateur est déjà pris." });
      }
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(409).json({ message: "Cet email est déjà utilisé." });
      }
      const hashed = await hashPassword(password);
      const user = await storage.createUser({ username, email, password: hashed, role: "developer" });
      (req.session as any).userId = user.id;
      res.status(201).json({ id: user.id, username: user.username, email: user.email, role: user.role });
    } catch (error: any) {
      console.error("Erreur inscription:", error);
      res.status(500).json({ message: "Erreur serveur lors de l'inscription.", error: error.message });
    }
  });

  // Connexion
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: "Identifiant et mot de passe requis." });
      }
      const user = await storage.getUserByUsername(username);
      if (!user || !(await comparePasswords(password, user.password))) {
        return res.status(401).json({ message: "Identifiant ou mot de passe incorrect." });
      }
      (req.session as any).userId = user.id;
      res.json({ id: user.id, username: user.username, email: user.email, role: user.role });
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur lors de la connexion." });
    }
  });

  // Déconnexion
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ message: "Déconnecté avec succès." });
    });
  });

  // Utilisateur actuel
  app.get("/api/auth/me", async (req, res) => {
    const userId = (req.session as any).userId;
    if (!userId) {
      return res.status(401).json({ message: "Non authentifié" });
    }
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(401).json({ message: "Utilisateur introuvable" });
    }
    res.json({ id: user.id, username: user.username, email: user.email, role: user.role });
  });

  // === MÉTRIQUES DU TABLEAU DE BORD ===
  
  // Obtenir les métriques globales du tableau de bord
  app.get("/api/dashboard/metrics", async (req, res) => {
    try {
      const metrics = await storage.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard metrics" });
    }
  });

  // Mettre à jour les métriques du tableau de bord
  app.post("/api/dashboard/metrics", async (req, res) => {
    try {
      const metricsData = insertDashboardMetricsSchema.parse(req.body);
      const metrics = await storage.createOrUpdateDashboardMetrics(metricsData);
      res.json(metrics);
    } catch (error) {
      res.status(400).json({ error: "Failed to update dashboard metrics" });
    }
  });

  // === GESTION DES PIPELINES ===
  
  // Obtenir toutes les exécutions de pipeline
  app.get("/api/pipelines", async (req, res) => {
    try {
      const runs = await storage.getPipelineRuns();
      res.json(runs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pipeline runs" });
    }
  });

  // Obtenir le pipeline en cours d'exécution
  app.get("/api/pipelines/current", async (req, res) => {
    try {
      const currentRun = await storage.getCurrentPipelineRun();
      res.json(currentRun);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch current pipeline run" });
    }
  });

  // Démarrer un nouveau pipeline
  app.post("/api/pipelines/start", async (req, res) => {
    try {
      const runData = insertPipelineRunSchema.parse({
        name: "Pipeline automatique",
        branch: "main",
        status: "running",
        currentStage: "source",
        triggeredBy: "utilisateur",
        commitHash: "abc123def456",
        environment: "staging"
      });
      const newRun = await storage.createPipelineRun(runData);
      res.json(newRun);
    } catch (error) {
      res.status(400).json({ error: "Failed to start pipeline run" });
    }
  });

  // Mettre à jour un pipeline
  app.patch("/api/pipelines/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const updatedRun = await storage.updatePipelineRun(id, updates);
      if (!updatedRun) {
        return res.status(404).json({ error: "Pipeline run not found" });
      }
      res.json(updatedRun);
    } catch (error) {
      res.status(400).json({ error: "Failed to update pipeline run" });
    }
  });

  // === ÉTAPES DE PIPELINE ===
  
  // Obtenir les étapes d'un pipeline
  app.get("/api/pipelines/:pipelineId/stages", async (req, res) => {
    try {
      const pipelineId = parseInt(req.params.pipelineId);
      const stages = await storage.getPipelineStages(pipelineId);
      res.json(stages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pipeline stages" });
    }
  });

  // Créer une nouvelle étape de pipeline
  app.post("/api/pipelines/:pipelineId/stages", async (req, res) => {
    try {
      const pipelineId = parseInt(req.params.pipelineId);
      const stageData = insertPipelineStageSchema.parse({
        ...req.body,
        pipelineRunId: pipelineId
      });
      const newStage = await storage.createPipelineStage(stageData);
      res.json(newStage);
    } catch (error) {
      res.status(400).json({ error: "Failed to create pipeline stage" });
    }
  });

  // === SÉCURITÉ ===
  
  // Obtenir tous les problèmes de sécurité
  app.get("/api/security/issues", async (req, res) => {
    try {
      const issues = await storage.getSecurityIssues();
      res.json(issues);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch security issues" });
    }
  });

  // Obtenir les problèmes de sécurité d'un pipeline spécifique
  app.get("/api/pipelines/:pipelineId/security/issues", async (req, res) => {
    try {
      const pipelineId = parseInt(req.params.pipelineId);
      const issues = await storage.getSecurityIssuesByPipeline(pipelineId);
      res.json(issues);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch security issues for pipeline" });
    }
  });

  // Créer un nouveau problème de sécurité
  app.post("/api/security/issues", async (req, res) => {
    try {
      const issueData = insertSecurityIssueSchema.parse(req.body);
      const newIssue = await storage.createSecurityIssue(issueData);
      res.json(newIssue);
    } catch (error) {
      res.status(400).json({ error: "Failed to create security issue" });
    }
  });

  // Mettre à jour un problème de sécurité
  app.patch("/api/security/issues/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const updatedIssue = await storage.updateSecurityIssue(id, updates);
      if (!updatedIssue) {
        return res.status(404).json({ error: "Security issue not found" });
      }
      res.json(updatedIssue);
    } catch (error) {
      res.status(400).json({ error: "Failed to update security issue" });
    }
  });

  // === QUALITÉ DE CODE ===
  
  // Obtenir les métriques de qualité globales
  app.get("/api/code/metrics", async (req, res) => {
    try {
      const metrics = await storage.getCodeMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch code metrics" });
    }
  });

  // Obtenir les métriques de qualité d'un pipeline spécifique
  app.get("/api/pipelines/:pipelineId/code/metrics", async (req, res) => {
    try {
      const pipelineId = parseInt(req.params.pipelineId);
      const metrics = await storage.getCodeMetricsByPipeline(pipelineId);
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch code metrics for pipeline" });
    }
  });

  // Créer ou mettre à jour les métriques de qualité
  app.post("/api/code/metrics", async (req, res) => {
    try {
      const metricsData = insertCodeMetricsSchema.parse(req.body);
      const metrics = await storage.createOrUpdateCodeMetrics(metricsData);
      res.json(metrics);
    } catch (error) {
      res.status(400).json({ error: "Failed to update code metrics" });
    }
  });

  // === TESTS ===
  
  // Obtenir les résultats de tests d'un pipeline
  app.get("/api/pipelines/:pipelineId/tests", async (req, res) => {
    try {
      const pipelineId = parseInt(req.params.pipelineId);
      const testResults = await storage.getTestResults(pipelineId);
      res.json(testResults);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch test results" });
    }
  });

  // Créer des résultats de tests
  app.post("/api/pipelines/:pipelineId/tests", async (req, res) => {
    try {
      const pipelineId = parseInt(req.params.pipelineId);
      const testData = insertTestResultsSchema.parse({
        ...req.body,
        pipelineRunId: pipelineId
      });
      const results = await storage.createTestResults(testData);
      res.json(results);
    } catch (error) {
      res.status(400).json({ error: "Failed to create test results" });
    }
  });

  // === DÉPLOIEMENTS ===
  
  // Obtenir tous les déploiements
  app.get("/api/deployments", async (req, res) => {
    try {
      const deployments = await storage.getDeployments();
      res.json(deployments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch deployments" });
    }
  });

  // Obtenir les déploiements d'un pipeline spécifique
  app.get("/api/pipelines/:pipelineId/deployments", async (req, res) => {
    try {
      const pipelineId = parseInt(req.params.pipelineId);
      const deployments = await storage.getDeploymentsByPipeline(pipelineId);
      res.json(deployments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch deployments for pipeline" });
    }
  });

  // Créer un nouveau déploiement
  app.post("/api/deployments", async (req, res) => {
    try {
      const deploymentData = insertDeploymentSchema.parse(req.body);
      const deployment = await storage.createDeployment(deploymentData);
      res.json(deployment);
    } catch (error) {
      res.status(400).json({ error: "Failed to create deployment" });
    }
  });

  // Mettre à jour un déploiement
  app.patch("/api/deployments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const updatedDeployment = await storage.updateDeployment(id, updates);
      if (!updatedDeployment) {
        return res.status(404).json({ error: "Deployment not found" });
      }
      res.json(updatedDeployment);
    } catch (error) {
      res.status(400).json({ error: "Failed to update deployment" });
    }
  });

  // === CONFORMITÉ ===
  
  // Obtenir les vérifications de conformité d'un pipeline
  app.get("/api/pipelines/:pipelineId/compliance", async (req, res) => {
    try {
      const pipelineId = parseInt(req.params.pipelineId);
      const checks = await storage.getComplianceChecks(pipelineId);
      res.json(checks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch compliance checks" });
    }
  });

  // Créer une vérification de conformité
  app.post("/api/pipelines/:pipelineId/compliance", async (req, res) => {
    try {
      const pipelineId = parseInt(req.params.pipelineId);
      const checkData = insertComplianceCheckSchema.parse({
        ...req.body,
        pipelineRunId: pipelineId
      });
      const check = await storage.createComplianceCheck(checkData);
      res.json(check);
    } catch (error) {
      res.status(400).json({ error: "Failed to create compliance check" });
    }
  });

  // === COMPATIBILITÉ AVEC L'ANCIEN CODE ===
  
  // Maintenir la compatibilité avec les anciennes routes
  app.get("/api/metrics", async (req, res) => {
    try {
      const metrics = await storage.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch metrics" });
    }
  });

  app.get("/api/pipeline/current", async (req, res) => {
    try {
      const currentRun = await storage.getCurrentPipelineRun();
      res.json(currentRun);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch current pipeline run" });
    }
  });

  app.post("/api/pipeline/start", async (req, res) => {
    try {
      const runData = insertPipelineRunSchema.parse({
        name: "Pipeline automatique",
        branch: "main",
        status: "running",
        currentStage: "source",
        triggeredBy: "utilisateur",
        commitHash: "abc123def456",
        environment: "staging"
      });
      const newRun = await storage.createPipelineRun(runData);
      res.json(newRun);
    } catch (error) {
      res.status(400).json({ error: "Failed to start pipeline run" });
    }
  });

  app.get("/api/quality", async (req, res) => {
    try {
      const metrics = await storage.getCodeMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch code metrics" });
    }
  });

  // === INTÉGRATION GITHUB ===

  // Obtenir la configuration GitHub actuelle
  app.get("/api/github/config", (req, res) => {
    const config = getGitHubConfig();
    if (!config) {
      return res.json({ configured: false });
    }
    res.json({ configured: true, owner: config.owner, repo: config.repo });
  });

  // Enregistrer la configuration GitHub
  app.post("/api/github/config", (req, res) => {
    const { owner, repo, token } = req.body;
    if (!owner || !repo || !token) {
      return res.status(400).json({ error: "owner, repo et token sont requis" });
    }
    setGitHubConfig({ owner, repo, token });
    res.json({ success: true, owner, repo });
  });

  // Supprimer la configuration GitHub
  app.delete("/api/github/config", (req, res) => {
    clearGitHubConfig();
    res.json({ success: true });
  });

  // Obtenir les exécutions GitHub Actions
  app.get("/api/github/workflows", async (req, res) => {
    const config = getGitHubConfig();
    if (!config) return res.status(400).json({ error: "GitHub non configuré" });
    try {
      const runs = await fetchWorkflowRuns(config);
      res.json(runs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Obtenir les alertes Dependabot
  app.get("/api/github/security", async (req, res) => {
    const config = getGitHubConfig();
    if (!config) return res.status(400).json({ error: "GitHub non configuré" });
    try {
      const alerts = await fetchDependabotAlerts(config);
      res.json(alerts);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Obtenir les informations du dépôt
  app.get("/api/github/repo", async (req, res) => {
    const config = getGitHubConfig();
    if (!config) return res.status(400).json({ error: "GitHub non configuré" });
    try {
      const info = await fetchRepoInfo(config);
      res.json(info);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Analyser un package.json pour les vulnérabilités
  app.post("/api/github/npm-audit", async (req, res) => {
    const { packageJson } = req.body;
    if (!packageJson) {
      return res.status(400).json({ error: "Contenu du package.json requis" });
    }
    try {
      const result = await analyzePackageJson(packageJson);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // === INTÉGRATION GITLAB ===

  // Obtenir la configuration GitLab actuelle
  app.get("/api/gitlab/config", (req, res) => {
    const config = getGitLabConfig();
    if (!config) return res.json({ configured: false });
    res.json({
      configured: true,
      namespace: config.namespace,
      repo: config.repo,
      instanceUrl: config.instanceUrl,
    });
  });

  // Enregistrer la configuration GitLab
  app.post("/api/gitlab/config", (req, res) => {
    const { namespace, repo, token, instanceUrl } = req.body;
    if (!namespace || !repo || !token) {
      return res.status(400).json({ error: "namespace, repo et token sont requis" });
    }
    setGitLabConfig({
      namespace,
      repo,
      token,
      instanceUrl: instanceUrl || "https://gitlab.com",
    });
    res.json({ success: true, namespace, repo });
  });

  // Supprimer la configuration GitLab
  app.delete("/api/gitlab/config", (req, res) => {
    clearGitLabConfig();
    res.json({ success: true });
  });

  // Obtenir les pipelines GitLab CI/CD
  app.get("/api/gitlab/pipelines", async (req, res) => {
    const config = getGitLabConfig();
    if (!config) return res.status(400).json({ error: "GitLab non configuré" });
    try {
      const pipelines = await fetchGitLabPipelines(config);
      res.json(pipelines);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Obtenir les vulnérabilités GitLab
  app.get("/api/gitlab/security", async (req, res) => {
    const config = getGitLabConfig();
    if (!config) return res.status(400).json({ error: "GitLab non configuré" });
    try {
      const vulns = await fetchGitLabVulnerabilities(config);
      res.json(vulns);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Obtenir les informations du projet GitLab
  app.get("/api/gitlab/repo", async (req, res) => {
    const config = getGitLabConfig();
    if (!config) return res.status(400).json({ error: "GitLab non configuré" });
    try {
      const info = await fetchGitLabRepoInfo(config);
      res.json(info);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // === INTÉGRATION BITBUCKET ===

  app.get("/api/bitbucket/config", (req, res) => {
    const config = getBitbucketConfig();
    if (!config) return res.json({ configured: false });
    res.json({ configured: true, workspace: config.workspace, repo: config.repo });
  });

  app.post("/api/bitbucket/config", (req, res) => {
    const { workspace, repo, username, appPassword } = req.body;
    if (!workspace || !repo || !username || !appPassword) {
      return res.status(400).json({ error: "workspace, repo, username et appPassword sont requis" });
    }
    setBitbucketConfig({ workspace, repo, username, appPassword });
    res.json({ success: true, workspace, repo });
  });

  app.delete("/api/bitbucket/config", (req, res) => {
    clearBitbucketConfig();
    res.json({ success: true });
  });

  app.get("/api/bitbucket/pipelines", async (req, res) => {
    const config = getBitbucketConfig();
    if (!config) return res.status(400).json({ error: "Bitbucket non configuré" });
    try {
      const pipelines = await fetchBitbucketPipelines(config);
      res.json(pipelines);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/bitbucket/repo", async (req, res) => {
    const config = getBitbucketConfig();
    if (!config) return res.status(400).json({ error: "Bitbucket non configuré" });
    try {
      const info = await fetchBitbucketRepoInfo(config);
      res.json(info);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/bitbucket/security", async (req, res) => {
    const config = getBitbucketConfig();
    if (!config) return res.status(400).json({ error: "Bitbucket non configuré" });
    try {
      const reports = await fetchBitbucketSecurityReports(config);
      res.json(reports);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
