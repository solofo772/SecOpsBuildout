# Démarrage Rapide Docker

## Solution 1: Version Simplifiée (Recommandée pour débuter)

Cette version démarre uniquement le dashboard et PostgreSQL pour éviter les problèmes de SonarQube :

```bash
# 1. Cloner et configurer
git clone <votre-repo>
cd devsecops-platform
cp .env.example .env

# 2. Démarrer la version simple
docker-compose -f docker-compose.simple.yml up -d --build

# 3. Vérifier les services
docker-compose -f docker-compose.simple.yml ps

# 4. Accéder au dashboard
# Dashboard: http://localhost:5001
# Via Nginx: http://localhost:8080
# Base de données: localhost:5433
```

## Solution 2: Stack Complète (Avancé)

Une fois la version simple fonctionnelle, testez la stack complète :

```bash
# Arrêter la version simple
docker-compose -f docker-compose.simple.yml down

# Démarrer la stack complète
docker-compose up -d --build

# Services disponibles:
# Dashboard: http://localhost:5001
# SonarQube: http://localhost:9000
# Grafana: http://localhost:3001
# Prometheus: http://localhost:9090
# Nginx: http://localhost
```

## Dépannage

### Problème 1: Port 5000 déjà utilisé
```bash
# Trouver le processus
sudo lsof -i :5000
# Arrêter le service
sudo systemctl stop <service-name>
```

### Problème 2: SonarQube s'arrête (code 0)
```bash
# Vérifier les logs
docker-compose logs sonarqube

# Solutions possibles:
# 1. Augmenter la mémoire Docker
# 2. Configurer vm.max_map_count (Linux)
sudo sysctl -w vm.max_map_count=262144

# 3. Utiliser la version simple sans SonarQube
docker-compose -f docker-compose.simple.yml up -d
```

### Problème 3: Module '/app/server/index.js' not found
```bash
# Le build Docker a échoué, nettoyer et reconstruire
docker-compose down --rmi all
docker-compose build --no-cache
docker-compose up -d
```

## Vérification de Santé

```bash
# Script de vérification automatique
curl -f http://localhost:5001/health && echo "✅ Dashboard OK" || echo "❌ Dashboard KO"
curl -f http://localhost:5433 && echo "✅ PostgreSQL OK" || echo "❌ PostgreSQL KO"
curl -f http://localhost:8080 && echo "✅ Nginx OK" || echo "❌ Nginx KO"
```

## Commandes Utiles

```bash
# Voir les logs en temps réel
docker-compose logs -f devsecops-dashboard

# Redémarrer un service
docker-compose restart devsecops-dashboard

# Accéder au conteneur
docker-compose exec devsecops-dashboard /bin/sh

# Nettoyer complètement
docker-compose down --volumes --rmi all
docker system prune -a
```

## Configuration Minimale

Pour un test rapide, utilisez ces variables dans `.env` :

```bash
NODE_ENV=production
DATABASE_URL=postgresql://devsecops:devsecops123@postgres:5432/devsecops_db
SESSION_SECRET=test-session-secret
WEBHOOK_SECRET=test-webhook-secret
```