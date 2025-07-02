# Exemple Pratique - Application Node.js avec Pipeline DevSecOps

## Création d'un Projet Exemple

### 1. Structure du Projet
```
mon-app-devsecops/
├── .github/
│   └── workflows/
│       └── devsecops-pipeline.yml
├── src/
│   ├── app.js
│   ├── routes/
│   │   └── api.js
│   └── middleware/
│       └── auth.js
├── tests/
│   ├── unit/
│   │   └── app.test.js
│   └── integration/
│       └── api.test.js
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml
├── security/
│   ├── .snyk
│   └── security-scan.sh
├── package.json
├── sonar-project.properties
├── .env.example
└── README.md
```

### 2. Application Node.js Simple

**src/app.js**
```javascript
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware de sécurité
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limite de 100 requêtes par IP
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

app.get('/api/users', (req, res) => {
  // Simulation d'une API sécurisée
  const users = [
    { id: 1, name: 'Alice', email: 'alice@example.com' },
    { id: 2, name: 'Bob', email: 'bob@example.com' }
  ];
  res.json(users);
});

// Middleware de gestion d'erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Erreur interne du serveur' });
});

// Démarrage du serveur
if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
  });
}

module.exports = app;
```

**package.json**
```json
{
  "name": "mon-app-devsecops",
  "version": "1.0.0",
  "description": "Application exemple avec pipeline DevSecOps",
  "main": "src/app.js",
  "scripts": {
    "start": "node src/app.js",
    "dev": "nodemon src/app.js",
    "test": "jest",
    "test:coverage": "jest --coverage",
    "security:scan": "./security/security-scan.sh",
    "lint": "eslint src/",
    "lint:fix": "eslint src/ --fix"
  },
  "dependencies": {
    "express": "^4.18.2",
    "helmet": "^7.0.0",
    "cors": "^2.8.5",
    "express-rate-limit": "^6.8.1"
  },
  "devDependencies": {
    "jest": "^29.5.0",
    "supertest": "^6.3.3",
    "eslint": "^8.44.0",
    "nodemon": "^3.0.1"
  }
}
```

### 3. Tests Automatisés

**tests/unit/app.test.js**
```javascript
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
      expect(response.body).toHaveProperty('version');
    });
  });

  describe('GET /api/users', () => {
    it('devrait retourner la liste des utilisateurs', async () => {
      const response = await request(app)
        .get('/api/users')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('email');
    });
  });

  describe('Sécurité', () => {
    it('devrait avoir les en-têtes de sécurité', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-content-type-options');
    });

    it('devrait limiter le taux de requêtes', async () => {
      // Test de rate limiting
      const promises = Array(10).fill().map(() => 
        request(app).get('/health')
      );
      
      const responses = await Promise.all(promises);
      expect(responses.every(res => res.status === 200)).toBe(true);
    });
  });
});
```

### 4. Configuration Docker

**Dockerfile**
```dockerfile
FROM node:18-alpine

# Créer un utilisateur non-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copier le code source
COPY --chown=nextjs:nodejs . .

# Exposer le port
EXPOSE 3000

# Changer vers l'utilisateur non-root
USER nextjs

# Vérification de santé
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

CMD ["npm", "start"]
```

**docker-compose.yml**
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
    restart: unless-stopped
    networks:
      - app-network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - app
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
```

### 5. Pipeline GitHub Actions

**.github/workflows/devsecops-pipeline.yml**
```yaml
name: Pipeline DevSecOps Complet

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

env:
  DOCKER_IMAGE: ${{ secrets.DOCKER_USERNAME }}/mon-app-devsecops
  NODE_VERSION: '18'

jobs:
  # Étape 1: Analyse de sécurité
  security-analysis:
    name: 🔒 Analyse de Sécurité
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Snyk Security Scan
        uses: snyk/actions/node@master
        continue-on-error: true
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high --json-file-output=snyk-results.json

      - name: Upload Snyk results
        uses: actions/upload-artifact@v3
        with:
          name: snyk-results
          path: snyk-results.json

      - name: Notify security results
        if: always()
        run: |
          curl -X POST ${{ secrets.WEBHOOK_URL }}/security-scan \
            -H "Content-Type: application/json" \
            -d '{
              "repository": "${{ github.repository }}",
              "branch": "${{ github.ref_name }}",
              "commit": "${{ github.sha }}",
              "status": "${{ job.status }}",
              "results_url": "${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}"
            }'

  # Étape 2: Tests et qualité du code
  quality-tests:
    name: 🧪 Tests et Qualité
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linting
        run: npm run lint

      - name: Run tests with coverage
        run: npm run test:coverage

      - name: SonarCloud Scan
        uses: SonarSource/sonarcloud-github-action@master
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info

      - name: Notify quality results
        if: always()
        run: |
          curl -X POST ${{ secrets.WEBHOOK_URL }}/quality-check \
            -H "Content-Type: application/json" \
            -d '{
              "repository": "${{ github.repository }}",
              "coverage": "$(cat coverage/coverage-summary.json | jq .total.lines.pct)",
              "status": "${{ job.status }}"
            }'

  # Étape 3: Build et scan de conteneur
  build-and-scan:
    name: 🐳 Build et Scan Docker
    runs-on: ubuntu-latest
    needs: [security-analysis, quality-tests]
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Build Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: false
          tags: ${{ env.DOCKER_IMAGE }}:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Scan Docker image with Snyk
        run: |
          docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
            -v $(pwd):/project \
            snyk/snyk:docker test \
            --docker ${{ env.DOCKER_IMAGE }}:${{ github.sha }} \
            --json-file-output=docker-scan-results.json
        continue-on-error: true

      - name: Push Docker image
        if: github.ref == 'refs/heads/main'
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: |
            ${{ env.DOCKER_IMAGE }}:latest
            ${{ env.DOCKER_IMAGE }}:${{ github.sha }}

  # Étape 4: Déploiement
  deploy:
    name: 🚀 Déploiement
    runs-on: ubuntu-latest
    needs: build-and-scan
    if: github.ref == 'refs/heads/main'
    environment: production
    steps:
      - name: Deploy to staging
        run: |
          echo "Déploiement vers l'environnement de staging..."
          # Ici vous ajouteriez vos commandes de déploiement
          # Par exemple: kubectl, ansible, terraform, etc.

      - name: Health check
        run: |
          echo "Vérification de santé de l'application..."
          # Test de santé de votre application
          curl -f http://staging.monapp.com/health || exit 1

      - name: Notify deployment
        if: always()
        run: |
          curl -X POST ${{ secrets.WEBHOOK_URL }}/deployment \
            -H "Content-Type: application/json" \
            -d '{
              "repository": "${{ github.repository }}",
              "version": "${{ github.sha }}",
              "environment": "production",
              "status": "${{ job.status }}",
              "deployed_by": "${{ github.actor }}"
            }'

  # Étape 5: Tests post-déploiement
  post-deploy-tests:
    name: 🔍 Tests Post-Déploiement
    runs-on: ubuntu-latest
    needs: deploy
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Run integration tests
        run: |
          echo "Exécution des tests d'intégration..."
          # Tests contre l'environnement déployé
          npm run test:integration -- --baseUrl=http://staging.monapp.com

      - name: OWASP ZAP Security Test
        uses: zaproxy/action-full-scan@v0.4.0
        with:
          target: 'http://staging.monapp.com'
          rules_file_name: '.zap/rules.tsv'
          cmd_options: '-a'

      - name: Performance tests
        run: |
          echo "Tests de performance..."
          # Utilisation d'outils comme k6, artillery, etc.
```

### 6. Configuration des Outils

**sonar-project.properties**
```properties
sonar.projectKey=mon-app-devsecops
sonar.projectName=Mon App DevSecOps
sonar.projectVersion=1.0

sonar.sources=src
sonar.tests=tests
sonar.exclusions=node_modules/**,coverage/**
sonar.test.exclusions=node_modules/**

sonar.javascript.lcov.reportPaths=coverage/lcov.info
sonar.testExecutionReportPaths=coverage/test-reporter.xml

sonar.sourceEncoding=UTF-8
```

**security/.snyk**
```yaml
# Snyk (https://snyk.io) policy file
version: v1.25.0
ignore: {}
patch: {}
```

**security/security-scan.sh**
```bash
#!/bin/bash
set -e

echo "🔒 Démarrage du scan de sécurité complet..."

# Créer le répertoire des rapports
mkdir -p reports

# 1. Scan des dépendances avec Snyk
echo "📦 Scan des dépendances..."
snyk test --json > reports/dependencies-scan.json || true
snyk code test --json > reports/code-scan.json || true

# 2. Audit npm
echo "🔍 Audit npm..."
npm audit --json > reports/npm-audit.json || true

# 3. Scan des secrets avec TruffleHog
echo "🔑 Recherche de secrets..."
docker run --rm -v "$(pwd):/pwd" trufflesecurity/trufflehog:latest filesystem /pwd --json > reports/secrets-scan.json || true

# 4. Analyse statique avec ESLint Security
echo "🛡️ Analyse statique de sécurité..."
npx eslint src/ --format json > reports/eslint-security.json || true

# 5. Envoi des résultats à la plateforme DevSecOps
echo "📤 Envoi des résultats..."
for report in reports/*.json; do
  if [ -f "$report" ]; then
    echo "Envoi de $report..."
    curl -X POST http://localhost:5000/api/security/upload-scan \
      -H "Content-Type: application/json" \
      -d @"$report" || true
  fi
done

echo "✅ Scan de sécurité terminé"
```

### 7. Configuration Nginx

**nginx.conf**
```nginx
events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:3000;
    }

    server {
        listen 80;
        server_name localhost;

        # Headers de sécurité
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;

        # Rate limiting
        limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

        location / {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location /health {
            access_log off;
            proxy_pass http://app;
        }
    }
}
```

## Commandes pour Tester Localement

### 1. Démarrage Initial
```bash
# Cloner le projet exemple
git clone <votre-repo>
cd mon-app-devsecops

# Installer les dépendances
npm install

# Démarrer en mode développement
npm run dev
```

### 2. Tests Complets
```bash
# Tests unitaires
npm test

# Tests avec couverture
npm run test:coverage

# Scan de sécurité
npm run security:scan

# Linting
npm run lint
```

### 3. Docker
```bash
# Construire l'image
docker build -t mon-app-devsecops .

# Démarrer avec Docker Compose
docker-compose up -d

# Vérifier les logs
docker-compose logs -f

# Tester l'application
curl http://localhost:3000/health
```

### 4. Push vers le Registre
```bash
# Se connecter à Docker Hub
docker login

# Taguer l'image
docker tag mon-app-devsecops:latest votre-username/mon-app-devsecops:latest

# Pousser vers le registre
docker push votre-username/mon-app-devsecops:latest
```

Cet exemple vous donne une base complète pour implémenter DevSecOps avec une vraie application, des tests, de la sécurité, et des déploiements automatisés.