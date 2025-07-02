# Multi-stage build pour optimiser la taille de l'image
FROM node:18-alpine AS builder

# Variables d'environnement pour le build
ENV NODE_ENV=production
ENV CI=true

# Créer un utilisateur non-root pour la sécurité
RUN addgroup -g 1001 -S nodejs && \
    adduser -S devsecops -u 1001

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de configuration des dépendances
COPY package*.json ./
COPY tsconfig.json ./
COPY vite.config.ts ./
COPY components.json ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./

# Installer les dépendances
RUN npm ci --only=production --silent

# Copier le code source
COPY . .

# Construire l'application
RUN npm run build

# Stage de production
FROM node:18-alpine AS production

# Installer curl pour les health checks
RUN apk add --no-cache curl

# Créer un utilisateur non-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S devsecops -u 1001

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers nécessaires depuis le stage builder
COPY --from=builder --chown=devsecops:nodejs /app/package*.json ./
COPY --from=builder --chown=devsecops:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=devsecops:nodejs /app/dist ./dist
COPY --from=builder --chown=devsecops:nodejs /app/server ./server
COPY --from=builder --chown=devsecops:nodejs /app/shared ./shared

# Changer vers l'utilisateur non-root
USER devsecops

# Exposer le port
EXPOSE 5000

# Variables d'environnement par défaut
ENV NODE_ENV=production
ENV PORT=5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

# Commande de démarrage
CMD ["node", "dist/index.js"]