#!/bin/bash

# Script de déploiement Railway pour MCP Server Trello
# Usage: ./deploy-railway.sh

set -e

echo "🚂 Déploiement MCP Server Trello sur Railway"
echo "=============================================="

# Vérifier que Railway CLI est installé
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI n'est pas installé."
    echo "📦 Installation :"
    echo "   npm install -g @railway/cli"
    echo "   ou"
    echo "   curl -fsSL https://railway.app/install.sh | sh"
    exit 1
fi

# Vérifier que l'utilisateur est connecté
if ! railway whoami &> /dev/null; then
    echo "🔐 Connexion à Railway..."
    railway login
fi

echo "✅ Railway CLI configuré"

# Vérifier les variables d'environnement
echo "🔍 Vérification des variables d'environnement..."

if [ -z "$TRELLO_API_KEY" ]; then
    echo "⚠️  TRELLO_API_KEY n'est pas définie"
    echo "   Définissez-la avec : export TRELLO_API_KEY=votre-clé"
fi

if [ -z "$TRELLO_TOKEN" ]; then
    echo "⚠️  TRELLO_TOKEN n'est pas défini"
    echo "   Définissez-le avec : export TRELLO_TOKEN=votre-token"
fi

# Créer un nouveau projet Railway
echo "🚀 Création du projet Railway..."
PROJECT_NAME="mcp-server-trello-$(date +%s)"

railway init --name "$PROJECT_NAME"

# Configurer les variables d'environnement
echo "⚙️  Configuration des variables d'environnement..."

if [ ! -z "$TRELLO_API_KEY" ]; then
    railway variables set TRELLO_API_KEY="$TRELLO_API_KEY"
    echo "✅ TRELLO_API_KEY configurée"
fi

if [ ! -z "$TRELLO_TOKEN" ]; then
    railway variables set TRELLO_TOKEN="$TRELLO_TOKEN"
    echo "✅ TRELLO_TOKEN configuré"
fi

if [ ! -z "$TRELLO_BOARD_ID" ]; then
    railway variables set TRELLO_BOARD_ID="$TRELLO_BOARD_ID"
    echo "✅ TRELLO_BOARD_ID configuré"
fi

if [ ! -z "$TRELLO_WORKSPACE_ID" ]; then
    railway variables set TRELLO_WORKSPACE_ID="$TRELLO_WORKSPACE_ID"
    echo "✅ TRELLO_WORKSPACE_ID configuré"
fi

# Déployer
echo "🚀 Déploiement en cours..."
railway up

echo "✅ Déploiement terminé !"
echo ""
echo "🌐 Votre application sera disponible à l'URL :"
echo "   https://$PROJECT_NAME-production.up.railway.app"
echo ""
echo "📊 Pour voir les logs :"
echo "   railway logs"
echo ""
echo "🔧 Pour gérer votre projet :"
echo "   railway dashboard"
