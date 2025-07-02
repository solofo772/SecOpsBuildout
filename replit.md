# DevSecOps Hub - Replit Configuration

## Overview

This is a full-stack DevSecOps dashboard application built with a modern React frontend and Express.js backend. The application provides comprehensive monitoring and visualization for DevSecOps pipelines, security scanning, code quality metrics, and best practices guidance.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Session Management**: Express sessions with PostgreSQL store
- **Development**: In-memory storage fallback for development

### Database Design
- **Users**: Authentication and user management
- **Pipeline Runs**: CI/CD pipeline execution tracking
- **Security Issues**: Vulnerability and security scan results
- **Code Quality**: Code coverage, complexity, and maintainability metrics
- **Metrics**: Aggregated dashboard metrics and KPIs

## Key Components

### Dashboard Components
- **MetricsGrid**: High-level KPI cards showing success rates, security issues, coverage, and deployments
- **PipelineVisualization**: Interactive pipeline stage visualization with real-time status
- **SecurityDashboard**: Security scan results with severity-based filtering
- **QualityMetrics**: Code quality metrics with grade visualization
- **ArchitectureDiagram**: DevSecOps architecture visualization
- **BestPractices**: Educational content for DevSecOps best practices

### Backend Services
- **Storage Layer**: Abstracted storage interface with memory and database implementations
- **API Routes**: RESTful endpoints for metrics, pipeline runs, and security data
- **Middleware**: Request logging, error handling, and development tooling

## Data Flow

1. **Client Requests**: React components use TanStack Query to fetch data from API endpoints
2. **API Layer**: Express routes handle HTTP requests and interact with storage layer
3. **Storage Layer**: Abstracted interface allows switching between memory (development) and database (production)
4. **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
5. **Real-time Updates**: Query invalidation triggers UI updates when pipeline states change

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL connection
- **drizzle-orm**: Type-safe database ORM with PostgreSQL dialect
- **drizzle-zod**: Schema validation integration
- **@tanstack/react-query**: Server state management
- **wouter**: Lightweight React router

### UI Dependencies
- **@radix-ui/***: Headless UI components for accessibility
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **lucide-react**: Icon library

### Development Dependencies
- **vite**: Fast build tool with HMR
- **tsx**: TypeScript execution for development
- **esbuild**: Fast bundling for production builds

## Deployment Strategy

### Development
- **Dev Server**: Vite development server with Express API proxy
- **Database**: In-memory storage or development PostgreSQL instance
- **Hot Reload**: Full-stack hot module replacement

### Production Build
- **Frontend**: Vite builds optimized static assets
- **Backend**: esbuild bundles Express server with external dependencies
- **Database**: Neon Database serverless PostgreSQL
- **Deployment**: Single Node.js process serving both API and static files

### Environment Configuration
- **DATABASE_URL**: PostgreSQL connection string (required for production)
- **NODE_ENV**: Environment detection for development/production modes
- **Port Configuration**: Automatic port detection for various hosting platforms

## User Preferences

Preferred communication style: Simple, everyday language (French).

## Changelog

Changelog:
- July 02, 2025. Initial setup of DevSecOps platform
- July 02, 2025. Complete rebuild with enhanced architecture:
  * Expanded data model with comprehensive tables for pipelines, security, quality, tests, deployments, and compliance
  * Added French translations throughout the UI
  * Created compliance dashboard component
  * Implemented detailed storage layer with realistic sample data
  * Added comprehensive API routes for all DevSecOps functions
  * Enhanced sidebar navigation with French labels
- July 02, 2025. Created complete Docker deployment solution:
  * Added Dockerfile with multi-stage build and security best practices
  * Created docker-compose.yml with full DevSecOps stack (PostgreSQL, SonarQube, Prometheus, Grafana, Nginx)
  * Implemented comprehensive documentation for local deployment and Docker usage
  * Added practical scripts for project generation, pipeline testing, and monitoring
  * Created complete integration guides for GitHub Actions, Snyk, SonarQube, and Docker registries
  * Solution now deployable with single command: docker-compose up -d