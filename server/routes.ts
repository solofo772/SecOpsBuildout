import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertPipelineRunSchema, 
  insertSecurityIssueSchema, 
  insertCodeMetricsSchema, 
  insertDashboardMetricsSchema,
  insertPipelineStageSchema,
  insertTestResultsSchema,
  insertDeploymentSchema,
  insertComplianceCheckSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
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

  const httpServer = createServer(app);
  return httpServer;
}
