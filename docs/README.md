# Documentation DevSecOps - Mise en Pratique Locale

Cette documentation vous guide pour implémenter une plateforme DevSecOps complète sur votre machine locale avec de vrais pipelines, analyses de sécurité, et déploiements vers des registres.

## 📚 Guides Disponibles

### 1. [Guide de Déploiement Local](local-setup.md)
Guide complet pour configurer l'environnement DevSecOps sur votre machine locale :
- Installation des outils nécessaires (Docker, Node.js, outils de sécurité)
- Configuration des variables d'environnement
- Setup de la base de données PostgreSQL
- Configuration des pipelines GitHub Actions
- Intégrations avec Snyk, SonarQube, Docker Hub
- Scripts d'automatisation et de surveillance

### 2. [Exemple Pratique](exemple-projet.md)
Application Node.js complète avec pipeline DevSecOps intégré :
- Structure de projet recommandée
- Application Express.js sécurisée
- Tests automatisés avec Jest
- Configuration Docker multi-stage
- Pipeline GitHub Actions complet
- Analyses de sécurité avec Snyk
- Qualité de code avec SonarQube
- Déploiement automatisé vers Docker Hub

### 3. [Scripts Pratiques](scripts-pratiques.md)
Collection de scripts pour automatiser le DevSecOps :
- Script d'installation automatique de l'environnement
- Générateur de projet avec structure DevSecOps
- Script de test de pipeline complet
- Monitoring en temps réel
- Scripts de nettoyage et maintenance

## 🚀 Démarrage Rapide

### Prérequis
```bash
# Cloner le repository de la plateforme
git clone <votre-repo>
cd devsecops-platform

# Installer les dépendances
npm install

# Démarrer la plateforme (dashboard)
npm run dev
```

### Configuration Environnement Local
```bash
# Créer le dossier docs si nécessaire
mkdir -p scripts

# Télécharger le script d'installation
curl -o scripts/setup-devsecops.sh https://raw.githubusercontent.com/votre-repo/devsecops-platform/main/docs/scripts/setup-devsecops.sh

# Rendre exécutable et lancer
chmod +x scripts/setup-devsecops.sh
./scripts/setup-devsecops.sh
```

### Créer un Projet Exemple
```bash
# Télécharger le générateur de projet
curl -o scripts/create-project.sh https://raw.githubusercontent.com/votre-repo/devsecops-platform/main/docs/scripts/create-project.sh

# Créer un nouveau projet
chmod +x scripts/create-project.sh
./scripts/create-project.sh
```

## 🛠️ Outils et Intégrations

### Outils de Sécurité
- **Snyk** : Analyse des vulnérabilités dans les dépendances et le code
- **TruffleHog** : Détection de secrets et clés API
- **OWASP ZAP** : Tests de sécurité des applications web
- **npm audit** : Audit de sécurité des dépendances Node.js

### Qualité de Code
- **SonarQube/SonarCloud** : Analyse statique de code
- **ESLint** : Linting JavaScript/TypeScript
- **Jest** : Tests unitaires et couverture de code
- **Prettier** : Formatage de code

### Conteneurisation
- **Docker** : Conteneurisation des applications
- **Docker Compose** : Orchestration multi-services
- **Registres** : Docker Hub, GitHub Container Registry

### CI/CD
- **GitHub Actions** : Pipelines d'intégration continue
- **Webhooks** : Intégration avec la plateforme DevSecOps
- **Notifications** : Slack, Email, Teams

## 📊 Architecture du Pipeline

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Code Commit   │───▶│  Security Scan  │───▶│   Code Quality  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                       │
                                ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Deployment    │◀───│   Docker Build  │◀───│      Tests      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                       │
        ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│ Health Checks   │    │ Container Scan  │
└─────────────────┘    └─────────────────┘
```

## 🔧 Configuration des Services

### Variables d'Environnement Requises
```bash
# Sécurité
SNYK_TOKEN=your_snyk_token
SONAR_TOKEN=your_sonar_token

# Docker Registry
DOCKER_USERNAME=your_username
DOCKER_PASSWORD=your_token

# GitHub
GITHUB_TOKEN=your_github_token
GITHUB_WEBHOOK_SECRET=your_webhook_secret

# Base de données
DATABASE_URL=postgresql://user:pass@localhost:5432/db

# Notifications
SLACK_WEBHOOK_URL=your_slack_webhook
EMAIL_SMTP_HOST=smtp.gmail.com
```

### Ports Utilisés
- **5000** : Plateforme DevSecOps Dashboard
- **3000** : Application exemple
- **9000** : SonarQube
- **5432** : PostgreSQL
- **6379** : Redis (optionnel)

## 📈 Surveillance et Métriques

### Métriques Collectées
- Taux de réussite des pipelines
- Temps d'exécution moyen
- Nombre de vulnérabilités détectées
- Couverture de code
- Temps de déploiement
- Disponibilité des applications

### Tableaux de Bord
- Vue d'ensemble des métriques DevSecOps
- Suivi des pipelines en temps réel
- Analyse des tendances de sécurité
- Rapports de qualité de code
- Statut des déploiements

## 🔒 Bonnes Pratiques de Sécurité

### Développement Sécurisé
1. **Principe du moindre privilège** dans les conteneurs
2. **Scan de sécurité** à chaque commit
3. **Chiffrement** des secrets et variables sensibles
4. **Mise à jour** régulière des dépendances
5. **Tests de sécurité** automatisés

### Configuration Sécurisée
1. Utilisation d'utilisateurs non-root dans Docker
2. Configuration des en-têtes de sécurité HTTP
3. Rate limiting et protection CSRF
4. Scan des images de conteneurs
5. Audit des accès et logs

## 🚨 Résolution de Problèmes

### Problèmes Courants
- **Docker non démarré** : `sudo systemctl start docker`
- **Permissions insuffisantes** : `sudo usermod -aG docker $USER`
- **Ports occupés** : `sudo lsof -i :5000`
- **Tokens expirés** : Renouveler dans les paramètres des services

### Logs et Debugging
```bash
# Logs de la plateforme
npm run dev | grep ERROR

# Logs Docker
docker-compose logs -f

# Logs des pipelines
curl http://localhost:5000/api/pipeline/logs/1
```

## 📞 Support et Contribution

### Ressources
- Documentation officielle des outils intégrés
- Communautés DevSecOps
- Guides de bonnes pratiques OWASP

### Contribution
1. Fork du repository
2. Création d'une branche pour votre fonctionnalité
3. Tests et documentation
4. Pull request avec description détaillée

---

**Note** : Cette documentation est évolutive. N'hésitez pas à proposer des améliorations ou signaler des problèmes.