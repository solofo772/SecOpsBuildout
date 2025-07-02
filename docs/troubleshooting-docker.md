# Résolution des Problèmes Docker

## Problèmes Fréquents et Solutions

### 1. SonarQube s'arrête avec code 0

**Symptôme**: `sonarqube-1 exited with code 0`

**Causes possibles**:
- Mémoire insuffisante
- Configuration vm.max_map_count trop faible (Linux)
- Conflit de ports
- Base de données non prête

**Solutions**:

```bash
# Solution 1: Configurer vm.max_map_count (Linux/WSL)
sudo sysctl -w vm.max_map_count=262144
echo 'vm.max_map_count=262144' | sudo tee -a /etc/sysctl.conf

# Solution 2: Augmenter la mémoire Docker
# Dans Docker Desktop: Settings > Resources > Memory > 4GB minimum

# Solution 3: Vérifier les logs
docker-compose logs sonarqube

# Solution 4: Utiliser la version simplifiée sans SonarQube
docker-compose -f docker-compose.simple.yml up -d
```

### 2. Erreur "Cannot find module '/app/server/index.js'"

**Symptôme**: Le conteneur dashboard s'arrête avec cette erreur

**Causes**:
- Build Docker incomplet
- Problème de script build
- Fichiers manquants

**Solutions**:

```bash
# Solution 1: Nettoyer et reconstruire
docker-compose down --rmi all --volumes
docker-compose build --no-cache
docker-compose up -d

# Solution 2: Vérifier le build localement
npm run build
ls -la dist/

# Solution 3: Construire manuellement l'image
docker build -t devsecops-dashboard .
```

### 3. Port déjà utilisé (EADDRINUSE)

**Symptôme**: `Error: listen EADDRINUSE: address already in use 0.0.0.0:5000`

**Solutions**:

```bash
# Trouver le processus utilisant le port
sudo lsof -i :5000
# ou
netstat -tulpn | grep :5000

# Arrêter le processus
sudo kill -9 <PID>

# Ou arrêter le service Replit en développement
# et utiliser des ports différents dans docker-compose.yml
```

### 4. Base de données PostgreSQL non accessible

**Symptôme**: Erreurs de connexion à la base de données

**Solutions**:

```bash
# Vérifier le statut de PostgreSQL
docker-compose exec postgres pg_isready -U devsecops -d devsecops_db

# Accéder à la base de données manuellement
docker-compose exec postgres psql -U devsecops -d devsecops_db

# Vérifier les logs PostgreSQL
docker-compose logs postgres

# Recréer la base de données
docker-compose down
docker volume rm devsecops-platform_postgres_data
docker-compose up -d postgres
```

### 5. Nginx ne démarre pas

**Symptôme**: Nginx s'arrête ou ne route pas correctement

**Solutions**:

```bash
# Vérifier la configuration Nginx
docker-compose exec nginx nginx -t

# Voir les logs Nginx
docker-compose logs nginx

# Redémarrer Nginx
docker-compose restart nginx

# Tester la configuration localement
nginx -t -c ./nginx/nginx.conf
```

### 6. Images Docker corrompues

**Symptômes**: Erreurs étranges, builds qui échouent

**Solution complète**:

```bash
# Nettoyage complet Docker
docker-compose down --rmi all --volumes
docker system prune -a --volumes
docker builder prune -a

# Redémarrage propre
docker-compose up -d --build
```

### 7. Problèmes de permissions

**Symptômes**: Erreurs d'accès aux fichiers dans les conteneurs

**Solutions**:

```bash
# Vérifier les permissions des volumes
ls -la ./nginx/
ls -la ./monitoring/

# Corriger les permissions si nécessaire
sudo chown -R $USER:$USER ./nginx/
sudo chown -R $USER:$USER ./monitoring/
```

## Commandes de Diagnostic

### Vérification de l'état global

```bash
# Script de diagnostic complet
#!/bin/bash
echo "=== État des conteneurs ==="
docker-compose ps

echo -e "\n=== Utilisation des ressources ==="
docker stats --no-stream

echo -e "\n=== Logs récents ==="
docker-compose logs --tail=10

echo -e "\n=== Tests de connectivité ==="
curl -f http://localhost:5001/health && echo "✅ Dashboard OK" || echo "❌ Dashboard KO"
curl -f http://localhost:8080 && echo "✅ Nginx OK" || echo "❌ Nginx KO"

echo -e "\n=== Volumes Docker ==="
docker volume ls | grep devsecops

echo -e "\n=== Réseaux Docker ==="
docker network ls | grep devsecops
```

### Tests de santé individuels

```bash
# Dashboard
curl -f http://localhost:5001/health
curl -f http://localhost:5001/api/metrics

# Base de données
docker-compose exec postgres pg_isready -U devsecops

# Nginx
curl -I http://localhost:8080

# Réseau interne
docker-compose exec devsecops-dashboard ping postgres
```

## Configuration de Développement Hybride

Si Docker pose trop de problèmes, utilisez cette approche hybride :

```bash
# 1. Démarrer seulement PostgreSQL avec Docker
docker-compose up -d postgres

# 2. Démarrer le dashboard en local
npm run dev

# 3. Accéder au dashboard local connecté à PostgreSQL Docker
# Dashboard: http://localhost:5000
# Base de données: localhost:5433
```

## Environnements de Test

### Environnement minimal
```bash
# Seulement dashboard + PostgreSQL
docker-compose -f docker-compose.simple.yml up -d
```

### Environnement de développement
```bash
# Dashboard local + services Docker
docker-compose up -d postgres redis
npm run dev
```

### Environnement complet
```bash
# Tous les services
docker-compose up -d
```

Cette approche progressive permet de résoudre les problèmes étape par étape.