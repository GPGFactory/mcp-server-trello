#!/bin/bash

echo "🚀 Déploiement du serveur MCP Trello FastMCP sur Railway..."

# Vérifier que Railway CLI est installé
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI n'est pas installé. Installation..."
    npm install -g @railway/cli
fi

# Se connecter à Railway
echo "🔐 Connexion à Railway..."
railway login

# Initialiser le projet Railway
echo "📦 Initialisation du projet Railway..."
railway init

# Déployer
echo "🚀 Déploiement en cours..."
railway up

echo "✅ Déploiement terminé !"
echo "🌐 Votre serveur MCP Trello FastMCP est maintenant disponible sur Railway"
echo "📋 N'oubliez pas de configurer les variables d'environnement :"
echo "   - TRELLO_API_KEY"
echo "   - TRELLO_TOKEN"
