# 🚂 Déploiement sur Railway

Ce guide vous explique comment déployer le MCP Server Trello sur Railway.

## 📋 Prérequis

1. **Compte Railway** : Créez un compte sur [railway.app](https://railway.app)
2. **Compte GitHub** : Votre code doit être sur GitHub
3. **Clés Trello** : API Key et Token Trello

## 🔑 Variables d'environnement requises

Configurez ces variables dans Railway :

### Variables obligatoires
```bash
TRELLO_API_KEY=your-api-key-here
TRELLO_TOKEN=your-token-here
```

### Variables optionnelles
```bash
TRELLO_BOARD_ID=your-default-board-id
TRELLO_WORKSPACE_ID=your-workspace-id
```

## 🚀 Processus de déploiement

### 1. Connecter votre repository GitHub

1. Allez sur [railway.app](https://railway.app)
2. Cliquez sur "New Project"
3. Sélectionnez "Deploy from GitHub repo"
4. Choisissez votre repository `mcp-server-trello`

### 2. Configuration du déploiement

Railway détectera automatiquement :
- Le fichier `railway.json` pour la configuration
- Le `Dockerfile.railway` pour le build
- Les variables d'environnement à configurer

### 3. Configuration des variables d'environnement

Dans le dashboard Railway :

1. Allez dans l'onglet "Variables"
2. Ajoutez les variables suivantes :

```
TRELLO_API_KEY = votre-clé-api-trello
TRELLO_TOKEN = votre-token-trello
```

### 4. Déploiement

Railway va automatiquement :
- Cloner votre repository
- Construire l'image Docker
- Déployer l'application
- Assigner une URL publique

## 🌐 URL de votre application

Une fois déployé, Railway vous fournira une URL au format :

```
https://votre-nom-de-projet-production.up.railway.app
```

**Exemple :**
```
https://mcp-server-trello-production.up.railway.app
```

## 🔧 Configuration MCP Client

Pour utiliser votre serveur déployé avec un client MCP, configurez :

```json
{
  "mcpServers": {
    "trello-railway": {
      "command": "node",
      "args": ["build/index.js"],
      "env": {
        "TRELLO_API_KEY": "your-api-key",
        "TRELLO_TOKEN": "your-token"
      }
    }
  }
}
```

## 📊 Monitoring et logs

Railway fournit :
- **Logs en temps réel** dans le dashboard
- **Métriques de performance**
- **Health checks** automatiques
- **Redémarrage automatique** en cas d'erreur

## 🔄 Mise à jour

Pour mettre à jour votre déploiement :
1. Poussez vos changements sur GitHub
2. Railway détectera automatiquement les changements
3. Un nouveau déploiement sera lancé automatiquement

## 🛠️ Dépannage

### Problèmes courants

1. **Erreur de build** : Vérifiez les logs dans Railway
2. **Variables d'environnement** : Assurez-vous qu'elles sont correctement configurées
3. **Clés Trello** : Vérifiez que vos clés sont valides

### Logs utiles

```bash
# Dans le dashboard Railway, section "Deployments"
# Cliquez sur votre déploiement pour voir les logs
```

## 💰 Coûts

Railway offre :
- **Plan gratuit** : 500 heures de déploiement/mois
- **Plans payants** : À partir de 5$/mois pour un usage illimité

## 🔒 Sécurité

- Les variables d'environnement sont chiffrées
- L'application utilise un utilisateur non-root
- Health checks automatiques
- HTTPS automatique

## 📞 Support

- **Documentation Railway** : [docs.railway.app](https://docs.railway.app)
- **Support Railway** : Via le dashboard
- **Issues GitHub** : Pour les problèmes spécifiques au projet
