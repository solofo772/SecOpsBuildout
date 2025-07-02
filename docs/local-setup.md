# Guide de Déploiement Local - Plateforme DevSecOps

## Vue d'ensemble
Ce guide vous permettra de déployer et configurer la plateforme DevSecOps sur votre machine locale avec de vrais pipelines CI/CD, analyses de sécurité, et intégrations avec des registres de conteneurs.

## Prérequis

### Outils Nécessaires
```bash
# Docker et Docker Compose
sudo apt-get update
sudo apt-get install docker.io docker-compose

# Node.js et npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Git
sudo apt-get install git

# PostgreSQL (optionnel, pour base de données locale)
sudo apt-get install postgresql postgresql-contrib
```

### Comptes et Services
- **GitHub** : Pour l'hébergement de code et GitHub Actions
- **Docker Hub** : Pour le registre de conteneurs
- **SonarCloud** : Pour l'analyse de qualité de code
- **Snyk** : Pour l'analyse de sécurité

## Configuration de l'Environnement Local

### 1. Cloner et Configurer le Projet

```bash
# Cloner le projet
git clone <votre-repo>
cd devsecops-platform

# Installer les dépendances
npm install

# Créer le fichier d'environnement
cp .env.example .env
```

### 2. Configuration des Variables d'Environnement

Créez un fichier `.env` avec :

```bash
# Base de données
DATABASE_URL=postgresql://username:password@localhost:5432/devsecops_db

# Docker Registry
DOCKER_REGISTRY_URL=registry.hub.docker.com
DOCKER_USERNAME=votre_username
DOCKER_PASSWORD=votre_token

# GitHub
GITHUB_TOKEN=ghp_votre_token_github
GITHUB_WEBHOOK_SECRET=votre_webhook_secret

# SonarCloud
SONAR_TOKEN=votre_sonar_token
SONAR_PROJECT_KEY=votre_project_key
SONAR_ORGANIZATION=votre_organization

# Snyk
SNYK_TOKEN=votre_snyk_token

# Notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_USERNAME=votre_email
EMAIL_PASSWORD=votre_mot_de_passe_app
```

### 3. Configuration de la Base de Données

```bash
# Créer la base de données PostgreSQL
sudo -u postgres psql
CREATE DATABASE devsecops_db;
CREATE USER devsecops_user WITH PASSWORD 'votre_password';
GRANT ALL PRIVILEGES ON DATABASE devsecops_db TO devsecops_user;
\q

# Exécuter les migrations
npm run db:migrate
```

## Configuration des Pipelines Réels

### 1. GitHub Actions Pipeline

Créez `.github/workflows/main.yml` :

```yaml
name: DevSecOps Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run Snyk Security Scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high
          
      - name: Upload Snyk Results
        run: |
          curl -X POST http://localhost:5000/api/security/issues \
            -H "Content-Type: application/json" \
            -d @snyk-results.json

  code-quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests with coverage
        run: npm run test:coverage
        
      - name: SonarCloud Scan
        uses: SonarSource/sonarcloud-github-action@master
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
          
      - name: Upload Quality Results
        run: |
          curl -X POST http://localhost:5000/api/quality/metrics \
            -H "Content-Type: application/json" \
            -d @quality-results.json

  build-and-push:
    needs: [security-scan, code-quality]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2
        
      - name: Login to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}
          
      - name: Build and push Docker image
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: |
            ${{ secrets.DOCKER_USERNAME }}/devsecops-app:latest
            ${{ secrets.DOCKER_USERNAME }}/devsecops-app:${{ github.sha }}
            
      - name: Update Deployment Status
        run: |
          curl -X POST http://localhost:5000/api/deployments \
            -H "Content-Type: application/json" \
            -d '{
              "version": "${{ github.sha }}",
              "status": "success",
              "environment": "production",
              "deployedBy": "${{ github.actor }}",
              "deploymentUrl": "https://hub.docker.com/r/${{ secrets.DOCKER_USERNAME }}/devsecops-app"
            }'

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to staging
        run: |
          docker run -d \
            --name devsecops-staging \
            -p 3000:3000 \
            ${{ secrets.DOCKER_USERNAME }}/devsecops-app:${{ github.sha }}
            
      - name: Health Check
        run: |
          sleep 30
          curl -f http://localhost:3000/health || exit 1
          
      - name: Update Pipeline Status
        run: |
          curl -X PUT http://localhost:5000/api/pipeline/current \
            -H "Content-Type: application/json" \
            -d '{
              "status": "completed",
              "endTime": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'",
              "currentStage": "deployed"
            }'
```

### 2. Configuration Docker

Créez un `Dockerfile` :

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN npm run build

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["npm", "start"]
```

Créez un `docker-compose.yml` pour l'environnement local :

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/devsecops_db
    depends_on:
      - db
      - redis
    volumes:
      - ./logs:/app/logs

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=devsecops_db
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  sonarqube:
    image: sonarqube:community
    ports:
      - "9000:9000"
    environment:
      - SONAR_JDBC_URL=jdbc:postgresql://db:5432/sonarqube
      - SONAR_JDBC_USERNAME=postgres
      - SONAR_JDBC_PASSWORD=password
    depends_on:
      - db

volumes:
  postgres_data:
```

## Configuration des Outils de Sécurité

### 1. Snyk pour l'Analyse de Sécurité

```bash
# Installer Snyk CLI
npm install -g snyk

# Authentifier
snyk auth

# Créer un script de scan
cat > security-scan.sh << 'EOF'
#!/bin/bash
echo "Démarrage du scan de sécurité..."

# Scan des dépendances
snyk test --json > snyk-dependencies.json

# Scan du code
snyk code test --json > snyk-code.json

# Scan des conteneurs Docker
snyk container test node:18-alpine --json > snyk-container.json

# Envoyer les résultats à la plateforme
curl -X POST http://localhost:5000/api/security/scan-results \
  -H "Content-Type: application/json" \
  -d @snyk-dependencies.json

echo "Scan de sécurité terminé"
EOF

chmod +x security-scan.sh
```

### 2. SonarQube pour la Qualité de Code

Créez `sonar-project.properties` :

```properties
sonar.projectKey=devsecops-platform
sonar.projectName=DevSecOps Platform
sonar.projectVersion=1.0
sonar.sources=client/src,server
sonar.exclusions=**/*.test.js,**/node_modules/**
sonar.javascript.lcov.reportPaths=coverage/lcov.info
sonar.typescript.lcov.reportPaths=coverage/lcov.info
```

## Scripts d'Automatisation

### 1. Script de Déploiement Local

Créez `scripts/deploy-local.sh` :

```bash
#!/bin/bash
set -e

echo "🚀 Démarrage du déploiement local..."

# Vérifier les prérequis
command -v docker >/dev/null 2>&1 || { echo "Docker n'est pas installé" >&2; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo "Docker Compose n'est pas installé" >&2; exit 1; }

# Construire les images
echo "📦 Construction des images Docker..."
docker-compose build

# Démarrer les services
echo "🔧 Démarrage des services..."
docker-compose up -d

# Attendre que les services soient prêts
echo "⏳ Attente des services..."
sleep 30

# Vérifier la santé des services
echo "🏥 Vérification de la santé des services..."
docker-compose ps

# Exécuter les migrations
echo "🗃️ Exécution des migrations..."
docker-compose exec app npm run db:migrate

# Insérer des données de test
echo "📊 Insertion des données de test..."
docker-compose exec app npm run db:seed

echo "✅ Déploiement local terminé!"
echo "🌐 Application disponible sur http://localhost:3000"
echo "📊 SonarQube disponible sur http://localhost:9000"
```