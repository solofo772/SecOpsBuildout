import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPipelineRunSchema, insertSecurityIssueSchema, insertCodeQualitySchema, insertMetricsSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get current metrics
  app.get("/api/metrics", async (req, res) => {
    try {
      const metrics = await storage.getMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch metrics" });
    }
  });

  // Get current pipeline run
  app.get("/api/pipeline/current", async (req, res) => {
    try {
      const currentRun = await storage.getCurrentPipelineRun();
      res.json(currentRun);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch current pipeline run" });
    }
  });

  // Get all pipeline runs
  app.get("/api/pipeline/runs", async (req, res) => {
    try {
      const runs = await storage.getPipelineRuns();
      res.json(runs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pipeline runs" });
    }
  });

  // Start a new pipeline run
  app.post("/api/pipeline/start", async (req, res) => {
    try {
      const runData = insertPipelineRunSchema.parse({
        status: "running",
        stage: "source",
        duration: null,
        successRate: "0"
      });
      const newRun = await storage.createPipelineRun(runData);
      res.json(newRun);
    } catch (error) {
      res.status(400).json({ error: "Failed to start pipeline run" });
    }
  });

  // Update pipeline run
  app.patch("/api/pipeline/runs/:id", async (req, res) => {
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

  // Get security issues
  app.get("/api/security/issues", async (req, res) => {
    try {
      const issues = await storage.getSecurityIssues();
      res.json(issues);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch security issues" });
    }
  });

  // Create security issue
  app.post("/api/security/issues", async (req, res) => {
    try {
      const issueData = insertSecurityIssueSchema.parse(req.body);
      const newIssue = await storage.createSecurityIssue(issueData);
      res.json(newIssue);
    } catch (error) {
      res.status(400).json({ error: "Failed to create security issue" });
    }
  });

  // Get code quality metrics
  app.get("/api/quality", async (req, res) => {
    try {
      const quality = await storage.getCodeQuality();
      res.json(quality);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch code quality metrics" });
    }
  });

  // Update code quality metrics
  app.post("/api/quality", async (req, res) => {
    try {
      const qualityData = insertCodeQualitySchema.parse(req.body);
      const quality = await storage.createOrUpdateCodeQuality(qualityData);
      res.json(quality);
    } catch (error) {
      res.status(400).json({ error: "Failed to update code quality metrics" });
    }
  });

  // Update metrics
  app.post("/api/metrics", async (req, res) => {
    try {
      const metricsData = insertMetricsSchema.parse(req.body);
      const metrics = await storage.createOrUpdateMetrics(metricsData);
      res.json(metrics);
    } catch (error) {
      res.status(400).json({ error: "Failed to update metrics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
