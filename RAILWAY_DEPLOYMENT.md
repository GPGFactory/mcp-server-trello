# Déploiement Railway - MCP Server Trello FastMCP

Guide de déploiement du serveur MCP Trello FastMCP 2.0 sur Railway.

## 🚀 Déploiement rapide

### 1. Prérequis

- Compte Railway
- Railway CLI installé
- Clés API Trello

### 2. Installation Railway CLI

```bash
npm install -g @railway/cli
```

### 3. Déploiement automatique

```bash
./deploy-railway.sh
```

### 4. Déploiement manuel

```bash
# Se connecter à Railway
railway login

# Initialiser le projet
railway init

# Déployer
railway up
```

## ⚙️ Configuration des variables d'environnement

Dans le dashboard Railway, ajoutez :

```
TRELLO_API_KEY=your_trello_api_key_here
TRELLO_TOKEN=your_trello_token_here
```

## 🔧 Configuration Railway

Le fichier `railway.json` configure :

- **Builder**: Dockerfile
- **Start Command**: `python server.py`
- **Restart Policy**: ON_FAILURE avec 10 tentatives

## 📊 Avantages FastMCP vs TypeScript

| Aspect | FastMCP 2.0 | TypeScript |
|--------|-------------|------------|
| **Code** | 150 lignes | 600+ lignes |
| **Déploiement** | Simple | Complexe |
| **Maintenance** | Facile | Difficile |
| **Performance** | Optimisée | Standard |
| **Fonctionnalités** | Complètes | Basiques |

## 🛠️ Outils disponibles

- `list_boards()` - Lister les tableaux
- `search_boards(query)` - Rechercher des tableaux
- `get_board_details(board_id)` - Détails d'un tableau
- `get_lists(board_id)` - Lister les listes
- `get_cards(list_id)` - Lister les cartes
- `create_card(list_id, name, desc)` - Créer une carte

## 🔍 Test du déploiement

```bash
# Test de l'endpoint
curl -X POST https://your-app.railway.app/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "method": "initialize", "id": 1, "params": {"protocolVersion": "2024-11-05", "capabilities": {}, "clientInfo": {"name": "test", "version": "1.0.0"}}}'
```

## 📚 Documentation

- [FastMCP 2.0](https://gofastmcp.com/getting-started/welcome)
- [Railway Documentation](https://docs.railway.app/)
- [MCP Protocol](https://modelcontextprotocol.io/)
