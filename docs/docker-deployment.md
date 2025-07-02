# Déploiement Docker - Dashboard DevSecOps

## Vue d'ensemble

Cette solution Docker complète vous permet de déployer facilement le dashboard DevSecOps avec tous les outils intégrés : PostgreSQL, SonarQube, Prometheus, Grafana, et Nginx comme proxy.

## Architecture des Conteneurs

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Nginx       │───▶│   Dashboard     │───▶│   PostgreSQL    │
│   (Port 80)     │    │   (Port 5000)   │    │   (Port 5432)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   SonarQube     │    │   Prometheus    │    │     Redis       │
│   (Port 9000)   │    │   (Port 9090)   │    │   (Port 6379)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│    Grafana      │    │   Monitoring    │
│   (Port 3001)   │    │    Agent        │
└─────────────────┘    └─────────────────┘
```

## Démarrage Rapide

### 1. Prérequis
```bash
# Docker et Docker Compose
sudo apt-get update
sudo apt-get install docker.io docker-compose

# Ajouter votre utilisateur au groupe docker
sudo usermod -aG docker $USER
newgrp docker
```

### 2. Cloner et Déployer
```bash
# Cloner le repository
git clone <votre-repo>
cd devsecops-platform

# Créer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos configurations

# Construire et démarrer tous les services
docker-compose up -d --build

# Vérifier le statut
docker-compose ps
```

### 3. Accès aux Services
- **Dashboard DevSecOps** : http://localhost
- **SonarQube** : http://sonar.localhost (ou http://localhost:9000)
- **Grafana** : http://grafana.localhost (ou http://localhost:3001)
- **Prometheus** : http://localhost:9090
- **Base de données** : localhost:5432

## Configuration des Variables d'Environnement

Créez un fichier `.env` :

```bash
# Base de données
POSTGRES_DB=devsecops_db
POSTGRES_USER=devsecops
POSTGRES_PASSWORD=change-this-password

# Dashboard
NODE_ENV=production
WEBHOOK_SECRET=change-this-secret-key
DATABASE_URL=postgresql://devsecops:change-this-password@postgres:5432/devsecops_db

# Sécurité
JWT_SECRET=your-jwt-secret-key
SESSION_SECRET=your-session-secret

# Intégrations externes
GITHUB_TOKEN=your-github-token
SNYK_TOKEN=your-snyk-token
SONAR_TOKEN=your-sonar-token
DOCKER_USERNAME=your-docker-username
DOCKER_PASSWORD=your-docker-password

# Notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_USERNAME=your-email
EMAIL_PASSWORD=your-app-password

# Grafana
GF_SECURITY_ADMIN_PASSWORD=change-this-grafana-password
```

## Scripts de Gestion

### Script de Déploiement

Créez `deploy-docker.sh` :

```bash
#!/bin/bash
set -e

echo "🐳 Déploiement Docker DevSecOps..."

# Vérifications préalables
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose n'est pas installé"
    exit 1
fi

# Créer les répertoires nécessaires
mkdir -p {logs,data,monitoring/grafana/dashboards,nginx/certs}

# Vérifier le fichier .env
if [ ! -f .env ]; then
    echo "⚠️  Fichier .env manquant, création depuis .env.example"
    cp .env.example .env
    echo "✏️  Veuillez éditer .env avec vos configurations"
    exit 1
fi

# Arrêter les services existants si ils tournent
echo "🛑 Arrêt des services existants..."
docker-compose down 2>/dev/null || true

# Nettoyer les anciennes images si demandé
read -p "🗑️  Nettoyer les anciennes images? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    docker-compose down --rmi all --volumes
fi

# Build et démarrage
echo "🔧 Construction des images..."
docker-compose build --no-cache

echo "🚀 Démarrage des services..."
docker-compose up -d

# Attendre que les services soient prêts
echo "⏳ Attente des services..."
sleep 30

# Vérification de santé
echo "🏥 Vérification de la santé des services..."
services=("devsecops-dashboard:5000/health" "sonarqube:9000" "grafana:3000/api/health")

for service in "${services[@]}"; do
    if docker-compose exec -T $(echo $service | cut -d: -f1) curl -f http://localhost:$(echo $service | cut -d: -f2) &>/dev/null; then
        echo "✅ $(echo $service | cut -d: -f1) fonctionne"
    else
        echo "⚠️  $(echo $service | cut -d: -f1) ne répond pas encore"
    fi
done

# Afficher les informations de connexion
echo ""
echo "🎉 Déploiement terminé!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Dashboard DevSecOps: http://localhost"
echo "🔍 SonarQube: http://localhost:9000"
echo "📈 Grafana: http://localhost:3001 (admin/$(grep GF_SECURITY_ADMIN_PASSWORD .env | cut -d= -f2))"
echo "📊 Prometheus: http://localhost:9090"
echo "🗄️  PostgreSQL: localhost:5432"
echo ""
echo "📋 Statut des conteneurs:"
docker-compose ps
```

### Script de Monitoring

Créez `monitor-docker.sh` :

```bash
#!/bin/bash

echo "📊 Monitoring Docker DevSecOps"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

while true; do
    clear
    echo "⏰ $(date)"
    echo ""
    
    # Statut des conteneurs
    echo "🐳 Statut des conteneurs:"
    docker-compose ps --format "table {{.Name}}\t{{.State}}\t{{.Status}}\t{{.Ports}}"
    echo ""
    
    # Utilisation des ressources
    echo "💾 Utilisation des ressources:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
    echo ""
    
    # Logs récents des erreurs
    echo "📋 Logs récents (erreurs):"
    docker-compose logs --tail=5 2>/dev/null | grep -i error || echo "Aucune erreur récente"
    echo ""
    
    # Vérification de santé
    echo "🏥 Vérification de santé:"
    if curl -f http://localhost/health &>/dev/null; then
        echo "✅ Dashboard: OK"
    else
        echo "❌ Dashboard: KO"
    fi
    
    if curl -f http://localhost:9000 &>/dev/null; then
        echo "✅ SonarQube: OK"
    else
        echo "❌ SonarQube: KO"
    fi
    
    if curl -f http://localhost:3001 &>/dev/null; then
        echo "✅ Grafana: OK"
    else
        echo "❌ Grafana: KO"
    fi
    
    echo ""
    echo "🔄 Actualisation dans 30s (Ctrl+C pour arrêter)"
    sleep 30
done
```

## Configuration Avancée

### SSL/TLS avec Let's Encrypt

Pour activer HTTPS avec des certificats automatiques :

1. Modifier `docker-compose.yml` pour ajouter Certbot :

```yaml
  certbot:
    image: certbot/certbot
    volumes:
      - ./nginx/certs:/etc/letsencrypt
      - ./nginx/acme-challenge:/var/www/certbot
    command: certonly --webroot -w /var/www/certbot -d votre-domaine.com --email votre-email@example.com --agree-tos --no-eff-email
```

2. Configurer le renouvellement automatique :

```bash
# Crontab pour renouveler les certificats
0 12 * * * /usr/bin/docker-compose -f /path/to/docker-compose.yml run --rm certbot renew --quiet && /usr/bin/docker-compose -f /path/to/docker-compose.yml exec nginx nginx -s reload
```

### Sauvegarde Automatique

Créez `backup.sh` :

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups/$DATE"

mkdir -p $BACKUP_DIR

# Sauvegarde de la base de données
docker-compose exec postgres pg_dump -U devsecops devsecops_db > $BACKUP_DIR/database.sql

# Sauvegarde des volumes
docker run --rm -v devsecops-platform_postgres_data:/data -v $(pwd)/backups:/backup alpine tar czf /backup/$DATE/postgres_data.tar.gz -C /data .
docker run --rm -v devsecops-platform_grafana_data:/data -v $(pwd)/backups:/backup alpine tar czf /backup/$DATE/grafana_data.tar.gz -C /data .

echo "✅ Sauvegarde créée dans $BACKUP_DIR"
```

### Configuration de Production

Pour un déploiement en production, modifiez ces paramètres :

1. **Sécurité renforcée** dans `docker-compose.yml` :

```yaml
  nginx:
    # ... configuration existante
    command: >
      /bin/sh -c "
      sed -i 's/worker_connections 1024;/worker_connections 2048;/g' /etc/nginx/nginx.conf &&
      nginx -g 'daemon off;'
      "
```

2. **Limites de ressources** :

```yaml
  devsecops-dashboard:
    # ... configuration existante
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '1.0'
        reservations:
          memory: 512M
          cpus: '0.5'
```

3. **Monitoring avancé** avec alertes :

```yaml
  alertmanager:
    image: prom/alertmanager:latest
    ports:
      - "9093:9093"
    volumes:
      - ./monitoring/alertmanager.yml:/etc/alertmanager/alertmanager.yml
```

## Dépannage

### Problèmes Courants

1. **Port déjà utilisé** :
```bash
# Voir les ports utilisés
sudo netstat -tlnp | grep :80
# Arrêter le service conflictuel
sudo systemctl stop apache2  # ou nginx
```

2. **Permissions Docker** :
```bash
# Ajouter l'utilisateur au groupe docker
sudo usermod -aG docker $USER
newgrp docker
```

3. **Mémoire insuffisante** :
```bash
# Vérifier la mémoire disponible
free -h
# Augmenter le swap si nécessaire
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### Logs et Debugging

```bash
# Voir tous les logs
docker-compose logs -f

# Logs d'un service spécifique
docker-compose logs -f devsecops-dashboard

# Entrer dans un conteneur
docker-compose exec devsecops-dashboard /bin/sh

# Vérifier la configuration
docker-compose config
```

## Commandes Utiles

```bash
# Démarrer les services
docker-compose up -d

# Arrêter les services
docker-compose down

# Redémarrer un service
docker-compose restart devsecops-dashboard

# Voir le statut
docker-compose ps

# Mettre à jour une image
docker-compose pull devsecops-dashboard
docker-compose up -d devsecops-dashboard

# Nettoyer le système
docker system prune -a --volumes
```

Cette solution Docker vous permet de déployer rapidement et facilement toute la stack DevSecOps avec tous les outils intégrés.