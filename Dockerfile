# Multi-stage build pour optimiser la taille de l'image
FROM node:18-alpine AS builder

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copier le code source
COPY . .

# Build de l'application frontend
RUN npm run build

# Stage de production
FROM node:18-alpine AS production

# Créer un utilisateur non-root pour la sécurité
RUN addgroup -g 1001 -S devsecops
RUN adduser -S devsecops -u 1001

WORKDIR /app

# Installer des outils utiles pour le debugging
RUN apk add --no-cache curl jq

# Copier les fichiers de production depuis le builder
COPY --from=builder --chown=devsecops:devsecops /app/node_modules ./node_modules
COPY --from=builder --chown=devsecops:devsecops /app/dist ./dist
COPY --from=builder --chown=devsecops:devsecops /app/server ./server
COPY --from=builder --chown=devsecops:devsecops /app/shared ./shared
COPY --from=builder --chown=devsecops:devsecops /app/package*.json ./

# Créer les répertoires nécessaires
RUN mkdir -p logs data && chown -R devsecops:devsecops logs data

# Variables d'environnement par défaut
ENV NODE_ENV=production
ENV PORT=5000
ENV DATABASE_URL=""

# Exposer le port
EXPOSE 5000

# Changer vers l'utilisateur non-root
USER devsecops

# Health check pour vérifier que l'application fonctionne
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/api/metrics || exit 1

# Commande de démarrage
CMD ["node", "server/index.js"]