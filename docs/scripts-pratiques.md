# Scripts Pratiques pour DevSecOps Local

## Scripts de Configuration Rapide

### 1. Script d'Installation Automatique

**setup-devsecops.sh**
```bash
#!/bin/bash
set -e

echo "🚀 Installation de l'environnement DevSecOps local..."

# Fonction pour vérifier si une commande existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Installation de Docker
if ! command_exists docker; then
    echo "📦 Installation de Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    echo "✅ Docker installé"
else
    echo "✅ Docker déjà installé"
fi

# Installation de Docker Compose
if ! command_exists docker-compose; then
    echo "📦 Installation de Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo "✅ Docker Compose installé"
else
    echo "✅ Docker Compose déjà installé"
fi

# Installation de Node.js
if ! command_exists node; then
    echo "📦 Installation de Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    echo "✅ Node.js installé"
else
    echo "✅ Node.js déjà installé"
fi

# Installation des outils DevSecOps
echo "🔧 Installation des outils DevSecOps..."

# Snyk CLI
if ! command_exists snyk; then
    npm install -g snyk
    echo "✅ Snyk CLI installé"
fi

# SonarScanner
if ! command_exists sonar-scanner; then
    wget https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-4.8.0.2856-linux.zip
    unzip sonar-scanner-cli-4.8.0.2856-linux.zip
    sudo mv sonar-scanner-4.8.0.2856-linux /opt/sonar-scanner
    sudo ln -s /opt/sonar-scanner/bin/sonar-scanner /usr/local/bin/sonar-scanner
    rm sonar-scanner-cli-4.8.0.2856-linux.zip
    echo "✅ SonarScanner installé"
fi

# TruffleHog pour la détection de secrets
echo "🔍 Installation de TruffleHog..."
docker pull trufflesecurity/trufflehog:latest

# OWASP ZAP
echo "🛡️ Installation d'OWASP ZAP..."
docker pull owasp/zap2docker-stable

echo "🎉 Installation terminée!"
echo ""
echo "Prochaines étapes:"
echo "1. Redémarrez votre session pour que Docker fonctionne"
echo "2. Configurez vos tokens: snyk auth, sonar-scanner"
echo "3. Créez votre projet avec: ./create-project.sh"
```

### 2. Script de Création de Projet

**create-project.sh**
```bash
#!/bin/bash
set -e

# Demander le nom du projet
read -p "📝 Nom du projet: " PROJECT_NAME
read -p "🐳 Nom d'utilisateur Docker Hub: " DOCKER_USERNAME
read -p "📧 Votre email: " USER_EMAIL

# Créer la structure du projet
echo "📁 Création de la structure du projet..."
mkdir -p $PROJECT_NAME
cd $PROJECT_NAME

mkdir -p {src,tests/{unit,integration},docker,security,scripts,.github/workflows,docs}

# Créer package.json
cat > package.json << EOF
{
  "name": "$PROJECT_NAME",
  "version": "1.0.0",
  "description": "Application DevSecOps avec pipeline automatisé",
  "main": "src/app.js",
  "scripts": {
    "start": "node src/app.js",
    "dev": "nodemon src/app.js",
    "test": "jest",
    "test:coverage": "jest --coverage",
    "test:integration": "jest tests/integration",
    "security:scan": "./security/security-scan.sh",
    "security:secrets": "./security/scan-secrets.sh",
    "lint": "eslint src/ tests/",
    "lint:fix": "eslint src/ tests/ --fix",
    "docker:build": "docker build -t $DOCKER_USERNAME/$PROJECT_NAME .",
    "docker:run": "docker run -p 3000:3000 $DOCKER_USERNAME/$PROJECT_NAME",
    "docker:push": "docker push $DOCKER_USERNAME/$PROJECT_NAME"
  },
  "dependencies": {
    "express": "^4.18.2",
    "helmet": "^7.0.0",
    "cors": "^2.8.5",
    "express-rate-limit": "^6.8.1",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "jest": "^29.5.0",
    "supertest": "^6.3.3",
    "eslint": "^8.44.0",
    "eslint-plugin-security": "^1.7.1",
    "nodemon": "^3.0.1"
  },
  "author": "$USER_EMAIL",
  "license": "MIT"
}
EOF

# Créer l'application de base
cat > src/app.js << 'EOF'
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware de sécurité
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

app.use(express.json());

// Routes
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

app.get('/api/status', (req, res) => {
  res.json({ 
    message: 'API fonctionne correctement',
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Middleware de gestion d'erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Erreur interne du serveur' });
});

if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  });
}

module.exports = app;
EOF

# Créer les tests
cat > tests/unit/app.test.js << 'EOF'
const request = require('supertest');
const app = require('../../src/app');

describe('Application Tests', () => {
  describe('GET /health', () => {
    it('devrait retourner le statut de santé', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('GET /api/status', () => {
    it('devrait retourner le statut de l\'API', async () => {
      const response = await request(app)
        .get('/api/status')
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('uptime');
    });
  });

  describe('Sécurité', () => {
    it('devrait avoir les en-têtes de sécurité', async () => {
      const response = await request(app).get('/health');
      expect(response.headers).toHaveProperty('x-frame-options');
    });
  });
});
EOF

# Créer le Dockerfile
cat > Dockerfile << 'EOF'
FROM node:18-alpine

RUN addgroup -g 1001 -S nodejs
RUN adduser -S appuser -u 1001

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY --chown=appuser:nodejs . .

EXPOSE 3000

USER appuser

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

CMD ["npm", "start"]
EOF

# Créer docker-compose.yml
cat > docker-compose.yml << EOF
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - app
EOF

# Créer les scripts de sécurité
cat > security/security-scan.sh << 'EOF'
#!/bin/bash
set -e

echo "🔒 Démarrage du scan de sécurité..."

mkdir -p reports

# Scan des dépendances
echo "📦 Scan des dépendances..."
npm audit --json > reports/npm-audit.json || true
snyk test --json > reports/snyk-deps.json || true

# Scan du code
echo "🔍 Scan du code..."
snyk code test --json > reports/snyk-code.json || true

# Scan des conteneurs
echo "🐳 Scan du conteneur..."
docker build -t security-scan . >/dev/null 2>&1
snyk container test security-scan --json > reports/snyk-container.json || true

echo "✅ Scan de sécurité terminé"
echo "📊 Rapports disponibles dans le dossier reports/"
EOF

cat > security/scan-secrets.sh << 'EOF'
#!/bin/bash
set -e

echo "🔍 Recherche de secrets..."

# TruffleHog
docker run --rm -v "$(pwd):/pwd" trufflesecurity/trufflehog:latest filesystem /pwd --json > reports/secrets.json || true

# Recherche de patterns communs
echo "🔑 Recherche de patterns de secrets..."
grep -r --include="*.js" --include="*.json" --include="*.env*" \
  -E "(password|passwd|secret|key|token|api_key).*=" . > reports/patterns.txt 2>/dev/null || true

echo "✅ Recherche de secrets terminée"
EOF

chmod +x security/*.sh

# Créer le pipeline GitHub Actions
cat > .github/workflows/devsecops.yml << EOF
name: Pipeline DevSecOps

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

env:
  DOCKER_IMAGE: $DOCKER_USERNAME/$PROJECT_NAME

jobs:
  security:
    name: 🔒 Sécurité
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - name: Snyk Security
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: \${{ secrets.SNYK_TOKEN }}

  quality:
    name: 🧪 Qualité
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint
      - run: npm run test:coverage
      - name: SonarCloud
        uses: SonarSource/sonarcloud-github-action@master
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
          SONAR_TOKEN: \${{ secrets.SONAR_TOKEN }}

  build:
    name: 🐳 Build
    needs: [security, quality]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Docker Build
        run: docker build -t \${{ env.DOCKER_IMAGE }}:\${{ github.sha }} .
      - name: Docker Login
        if: github.ref == 'refs/heads/main'
        uses: docker/login-action@v3
        with:
          username: \${{ secrets.DOCKER_USERNAME }}
          password: \${{ secrets.DOCKER_PASSWORD }}
      - name: Docker Push
        if: github.ref == 'refs/heads/main'
        run: |
          docker tag \${{ env.DOCKER_IMAGE }}:\${{ github.sha }} \${{ env.DOCKER_IMAGE }}:latest
          docker push \${{ env.DOCKER_IMAGE }}:\${{ github.sha }}
          docker push \${{ env.DOCKER_IMAGE }}:latest
EOF

# Créer la configuration SonarQube
cat > sonar-project.properties << EOF
sonar.projectKey=$PROJECT_NAME
sonar.projectName=$PROJECT_NAME
sonar.projectVersion=1.0
sonar.sources=src
sonar.tests=tests
sonar.exclusions=node_modules/**,coverage/**
sonar.javascript.lcov.reportPaths=coverage/lcov.info
EOF

# Créer .env.example
cat > .env.example << 'EOF'
# Configuration de l'application
NODE_ENV=development
PORT=3000

# Base de données
DATABASE_URL=postgresql://username:password@localhost:5432/database

# Docker Registry
DOCKER_USERNAME=your_username
DOCKER_PASSWORD=your_token

# Tokens de sécurité
SNYK_TOKEN=your_snyk_token
SONAR_TOKEN=your_sonar_token

# Notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
EOF

# Créer .gitignore
cat > .gitignore << 'EOF'
node_modules/
coverage/
reports/
.env
.env.local
*.log
.DS_Store
dist/
build/
EOF

# Créer README
cat > README.md << EOF
# $PROJECT_NAME

Application DevSecOps avec pipeline automatisé incluant sécurité, qualité et déploiement.

## Démarrage Rapide

\`\`\`bash
# Installation des dépendances
npm install

# Démarrage en développement
npm run dev

# Tests
npm test

# Scan de sécurité
npm run security:scan

# Build Docker
npm run docker:build

# Démarrage avec Docker
npm run docker:run
\`\`\`

## Pipeline DevSecOps

Ce projet inclut un pipeline complet avec :

- 🔒 **Analyse de sécurité** : Snyk, audit npm, scan de secrets
- 🧪 **Tests et qualité** : Jest, ESLint, SonarQube  
- 🐳 **Conteneurisation** : Docker multi-stage avec utilisateur non-root
- 🚀 **Déploiement** : GitHub Actions vers Docker Hub

## Scripts Disponibles

- \`npm run security:scan\` - Scan de sécurité complet
- \`npm run security:secrets\` - Recherche de secrets
- \`npm run test:coverage\` - Tests avec couverture
- \`npm run docker:build\` - Construction de l'image Docker
- \`npm run docker:push\` - Push vers le registre

## Configuration

1. Copiez \`.env.example\` vers \`.env\`
2. Configurez vos tokens et variables
3. Authentifiez-vous avec Snyk : \`snyk auth\`

## Monitoring

L'application expose :
- \`/health\` - Vérification de santé
- \`/api/status\` - Statut de l'API
EOF

echo "✅ Projet $PROJECT_NAME créé avec succès!"
echo ""
echo "Prochaines étapes:"
echo "1. cd $PROJECT_NAME"
echo "2. npm install"
echo "3. cp .env.example .env"
echo "4. Configurez vos tokens dans .env"
echo "5. npm run dev"
```

### 3. Script de Test de Pipeline Complet

**test-pipeline.sh**
```bash
#!/bin/bash
set -e

PROJECT_DIR=${1:-$(pwd)}
WEBHOOK_URL=${2:-"http://localhost:5000"}

echo "🧪 Test du pipeline DevSecOps complet..."
echo "📁 Répertoire: $PROJECT_DIR"
echo "🔗 Webhook: $WEBHOOK_URL"

cd "$PROJECT_DIR"

# Fonction pour envoyer des résultats au dashboard
send_result() {
    local stage=$1
    local status=$2
    local data=$3
    
    curl -s -X POST "$WEBHOOK_URL/api/pipeline/$stage" \
        -H "Content-Type: application/json" \
        -d "$data" || echo "⚠️  Erreur envoi résultat $stage"
}

# Démarrer un pipeline
echo "🚀 Démarrage du pipeline..."
PIPELINE_RESPONSE=$(curl -s -X POST "$WEBHOOK_URL/api/pipeline/start" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Test Pipeline Local",
        "branch": "main",
        "triggeredBy": "'$(whoami)'",
        "environment": "test"
    }')

PIPELINE_ID=$(echo "$PIPELINE_RESPONSE" | jq -r '.id' 2>/dev/null || echo "1")
echo "📋 Pipeline ID: $PIPELINE_ID"

# Étape 1: Installation des dépendances
echo "📦 Installation des dépendances..."
npm install --silent
send_result "install" "success" '{"stage": "install", "status": "completed", "message": "Dépendances installées"}'

# Étape 2: Linting
echo "🔍 Vérification du code (Linting)..."
if npm run lint --silent; then
    LINT_STATUS="success"
    LINT_MESSAGE="Code conforme aux standards"
else
    LINT_STATUS="warning"
    LINT_MESSAGE="Problèmes de style détectés"
fi

send_result "lint" "$LINT_STATUS" "{\"stage\": \"lint\", \"status\": \"$LINT_STATUS\", \"message\": \"$LINT_MESSAGE\"}"

# Étape 3: Tests unitaires
echo "🧪 Exécution des tests..."
if npm run test:coverage --silent; then
    COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct' 2>/dev/null || echo "0")
    TEST_STATUS="success"
    TEST_MESSAGE="Tests réussis - Couverture: ${COVERAGE}%"
else
    TEST_STATUS="failed"
    TEST_MESSAGE="Échec des tests"
    COVERAGE="0"
fi

send_result "test" "$TEST_STATUS" "{\"stage\": \"test\", \"status\": \"$TEST_STATUS\", \"message\": \"$TEST_MESSAGE\", \"coverage\": \"$COVERAGE\"}"

# Étape 4: Scan de sécurité
echo "🔒 Scan de sécurité..."
./security/security-scan.sh

if [ -f "reports/snyk-deps.json" ]; then
    HIGH_VULNS=$(cat reports/snyk-deps.json | jq '.vulnerabilities | map(select(.severity == "high")) | length' 2>/dev/null || echo "0")
    CRITICAL_VULNS=$(cat reports/snyk-deps.json | jq '.vulnerabilities | map(select(.severity == "critical")) | length' 2>/dev/null || echo "0")
    
    if [ "$CRITICAL_VULNS" -gt 0 ]; then
        SECURITY_STATUS="failed"
        SECURITY_MESSAGE="$CRITICAL_VULNS vulnérabilités critiques trouvées"
    elif [ "$HIGH_VULNS" -gt 0 ]; then
        SECURITY_STATUS="warning"
        SECURITY_MESSAGE="$HIGH_VULNS vulnérabilités importantes trouvées"
    else
        SECURITY_STATUS="success"
        SECURITY_MESSAGE="Aucune vulnérabilité critique"
    fi
else
    SECURITY_STATUS="warning"
    SECURITY_MESSAGE="Scan de sécurité partiellement complété"
fi

send_result "security" "$SECURITY_STATUS" "{\"stage\": \"security\", \"status\": \"$SECURITY_STATUS\", \"message\": \"$SECURITY_MESSAGE\"}"

# Étape 5: Build Docker
echo "🐳 Construction de l'image Docker..."
if docker build -t test-app:latest . --quiet; then
    BUILD_STATUS="success"
    BUILD_MESSAGE="Image Docker construite avec succès"
    
    # Test du conteneur
    echo "🏃 Test du conteneur..."
    CONTAINER_ID=$(docker run -d -p 3001:3000 test-app:latest)
    sleep 5
    
    if curl -f http://localhost:3001/health --silent; then
        DEPLOY_STATUS="success"
        DEPLOY_MESSAGE="Application déployée et fonctionnelle"
    else
        DEPLOY_STATUS="failed"
        DEPLOY_MESSAGE="Application déployée mais non fonctionnelle"
    fi
    
    docker stop "$CONTAINER_ID" >/dev/null 2>&1
    docker rm "$CONTAINER_ID" >/dev/null 2>&1
    
else
    BUILD_STATUS="failed"
    BUILD_MESSAGE="Échec de la construction Docker"
    DEPLOY_STATUS="failed"
    DEPLOY_MESSAGE="Pas de déploiement (build échoué)"
fi

send_result "build" "$BUILD_STATUS" "{\"stage\": \"build\", \"status\": \"$BUILD_STATUS\", \"message\": \"$BUILD_MESSAGE\"}"
send_result "deploy" "$DEPLOY_STATUS" "{\"stage\": \"deploy\", \"status\": \"$DEPLOY_STATUS\", \"message\": \"$DEPLOY_MESSAGE\"}"

# Étape 6: Scan de sécurité du conteneur
if [ "$BUILD_STATUS" = "success" ]; then
    echo "🛡️ Scan de sécurité du conteneur..."
    if command -v snyk >/dev/null 2>&1; then
        if snyk container test test-app:latest --json > reports/container-scan.json 2>/dev/null; then
            CONTAINER_VULNS=$(cat reports/container-scan.json | jq '.vulnerabilities | length' 2>/dev/null || echo "0")
            CONTAINER_STATUS="success"
            CONTAINER_MESSAGE="Conteneur scanné - $CONTAINER_VULNS vulnérabilités"
        else
            CONTAINER_STATUS="warning"
            CONTAINER_MESSAGE="Scan de conteneur partiellement complété"
        fi
    else
        CONTAINER_STATUS="skipped"
        CONTAINER_MESSAGE="Snyk non disponible"
    fi
    
    send_result "container-scan" "$CONTAINER_STATUS" "{\"stage\": \"container-scan\", \"status\": \"$CONTAINER_STATUS\", \"message\": \"$CONTAINER_MESSAGE\"}"
fi

# Finaliser le pipeline
echo "✅ Finalisation du pipeline..."
curl -s -X PUT "$WEBHOOK_URL/api/pipeline/$PIPELINE_ID" \
    -H "Content-Type: application/json" \
    -d '{
        "status": "completed",
        "endTime": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'"
    }' >/dev/null

# Résumé des résultats
echo ""
echo "📊 RÉSUMÉ DU PIPELINE"
echo "====================="
echo "🔍 Linting: $LINT_STATUS"
echo "🧪 Tests: $TEST_STATUS (Couverture: ${COVERAGE}%)"
echo "🔒 Sécurité: $SECURITY_STATUS"
echo "🐳 Build: $BUILD_STATUS"
echo "🚀 Déploiement: $DEPLOY_STATUS"

if [ "$BUILD_STATUS" = "success" ]; then
    echo "🛡️ Scan conteneur: $CONTAINER_STATUS"
fi

echo ""
echo "📁 Rapports disponibles dans ./reports/"
echo "🌐 Dashboard: $WEBHOOK_URL"
echo ""

# Déterminer le statut global
if [[ "$TEST_STATUS" = "failed" || "$BUILD_STATUS" = "failed" || "$DEPLOY_STATUS" = "failed" ]]; then
    echo "❌ Pipeline ÉCHOUÉ"
    exit 1
elif [[ "$SECURITY_STATUS" = "failed" ]]; then
    echo "⚠️  Pipeline RÉUSSI avec alertes sécurité"
    exit 0
else
    echo "✅ Pipeline RÉUSSI"
    exit 0
fi
```

### 4. Script de Monitoring Continu

**monitor-pipeline.sh**
```bash
#!/bin/bash

WEBHOOK_URL=${1:-"http://localhost:5000"}
INTERVAL=${2:-30}

echo "👀 Monitoring du pipeline DevSecOps..."
echo "🔗 Dashboard: $WEBHOOK_URL"
echo "⏱️  Intervalle: ${INTERVAL}s"

while true; do
    clear
    echo "📊 DASHBOARD DEVSECOPS - $(date)"
    echo "================================"
    
    # Récupérer les métriques
    METRICS=$(curl -s "$WEBHOOK_URL/api/metrics" 2>/dev/null)
    if [ $? -eq 0 ] && [ "$METRICS" != "" ]; then
        echo "📈 Métriques générales:"
        echo "$METRICS" | jq -r '
            "   Pipelines totaux: \(.totalPipelines // "N/A")",
            "   Réussis: \(.successfulPipelines // "N/A")",
            "   Échoués: \(.failedPipelines // "N/A")",
            "   Durée moyenne: \(.averageDuration // "N/A")min"
        ' 2>/dev/null || echo "   Données non disponibles"
    else
        echo "📈 Métriques: Non disponibles"
    fi
    
    echo ""
    
    # Pipeline actuel
    CURRENT_PIPELINE=$(curl -s "$WEBHOOK_URL/api/pipeline/current" 2>/dev/null)
    if [ $? -eq 0 ] && [ "$CURRENT_PIPELINE" != "" ]; then
        echo "🚀 Pipeline actuel:"
        echo "$CURRENT_PIPELINE" | jq -r '
            "   Nom: \(.name // "N/A")",
            "   Statut: \(.status // "N/A")",
            "   Branche: \(.branch // "N/A")",
            "   Étape: \(.currentStage // "N/A")"
        ' 2>/dev/null || echo "   Données non disponibles"
    else
        echo "🚀 Pipeline actuel: Aucun pipeline en cours"
    fi
    
    echo ""
    
    # Problèmes de sécurité
    SECURITY=$(curl -s "$WEBHOOK_URL/api/security/issues" 2>/dev/null)
    if [ $? -eq 0 ] && [ "$SECURITY" != "" ]; then
        HIGH_ISSUES=$(echo "$SECURITY" | jq '[.[] | select(.severity == "high")] | length' 2>/dev/null || echo "0")
        CRITICAL_ISSUES=$(echo "$SECURITY" | jq '[.[] | select(.severity == "critical")] | length' 2>/dev/null || echo "0")
        
        echo "🔒 Sécurité:"
        echo "   Problèmes critiques: $CRITICAL_ISSUES"
        echo "   Problèmes importants: $HIGH_ISSUES"
    else
        echo "🔒 Sécurité: Données non disponibles"
    fi
    
    echo ""
    
    # Qualité du code
    QUALITY=$(curl -s "$WEBHOOK_URL/api/quality" 2>/dev/null)
    if [ $? -eq 0 ] && [ "$QUALITY" != "" ]; then
        echo "📊 Qualité du code:"
        echo "$QUALITY" | jq -r '
            "   Couverture: \(.coverage // "N/A")%",
            "   Lignes de code: \(.linesOfCode // "N/A")",
            "   Grade: \(.grade // "N/A")"
        ' 2>/dev/null || echo "   Données non disponibles"
    else
        echo "📊 Qualité: Données non disponibles"
    fi
    
    echo ""
    echo "🔄 Actualisation dans ${INTERVAL}s (Ctrl+C pour arrêter)"
    
    sleep $INTERVAL
done
```

### 5. Script de Nettoyage

**cleanup.sh**
```bash
#!/bin/bash

echo "🧹 Nettoyage de l'environnement DevSecOps..."

# Arrêter et supprimer les conteneurs
echo "🐳 Nettoyage Docker..."
docker stop $(docker ps -aq) 2>/dev/null || true
docker rm $(docker ps -aq) 2>/dev/null || true

# Supprimer les images de test
docker rmi $(docker images | grep "test-app\|security-scan" | awk '{print $3}') 2>/dev/null || true

# Nettoyer les volumes inutilisés
docker volume prune -f

# Nettoyer les réseaux inutilisés
docker network prune -f

# Nettoyer les images inutilisées
docker image prune -f

# Supprimer les rapports anciens
echo "📄 Nettoyage des rapports..."
find . -name "reports" -type d -exec rm -rf {} + 2>/dev/null || true
find . -name "coverage" -type d -exec rm -rf {} + 2>/dev/null || true
find . -name "*.log" -type f -delete 2>/dev/null || true

# Nettoyer node_modules si demandé
read -p "🗑️  Supprimer node_modules? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    find . -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null || true
    echo "✅ node_modules supprimés"
fi

echo "✅ Nettoyage terminé!"
docker system df
```

## Utilisation des Scripts

### Configuration Initiale
```bash
# 1. Installation de l'environnement
chmod +x setup-devsecops.sh
./setup-devsecops.sh

# 2. Création d'un nouveau projet
chmod +x create-project.sh
./create-project.sh

# 3. Configuration des tokens
cd mon-projet
cp .env.example .env
# Éditer .env avec vos tokens
```

### Tests et Développement
```bash
# Test du pipeline complet
chmod +x test-pipeline.sh
./test-pipeline.sh

# Monitoring en temps réel
chmod +x monitor-pipeline.sh
./monitor-pipeline.sh

# Nettoyage
chmod +x cleanup.sh
./cleanup.sh
```

Ces scripts vous donnent tous les outils nécessaires pour mettre en pratique DevSecOps sur votre machine locale avec de vrais pipelines, tests de sécurité, et intégrations avec les registres.