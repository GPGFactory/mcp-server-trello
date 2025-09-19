# MCP Server Trello - FastMCP 2.0

Un serveur MCP moderne et Pythonic pour l'intégration Trello, construit avec [FastMCP 2.0](https://gofastmcp.com/getting-started/welcome).

## 🚀 Fonctionnalités

- **FastMCP 2.0** - Framework moderne et Pythonic pour MCP
- **Outils Trello** - Gestion complète des tableaux, listes et cartes
- **Performance optimisée** - Réponses rapides et fiables
- **Déploiement simple** - Prêt pour Railway et autres plateformes

## 🛠️ Outils disponibles

- `list_boards()` - Lister les tableaux Trello
- `search_boards(query)` - Rechercher des tableaux
- `get_board_details(board_id)` - Détails d'un tableau
- `get_lists(board_id)` - Lister les listes d'un tableau
- `get_cards(list_id)` - Lister les cartes d'une liste
- `create_card(list_id, name, desc)` - Créer une nouvelle carte

## 📦 Installation

```bash
# Cloner le projet
git clone <repo-url>
cd mcp-server-trello-fastmcp

# Créer un environnement virtuel
python3.11 -m venv venv
source venv/bin/activate

# Installer les dépendances
pip install -r requirements.txt
```

## ⚙️ Configuration

1. Copiez `env.example` vers `.env`
2. Ajoutez vos clés Trello :

```bash
TRELLO_API_KEY=your_trello_api_key_here
TRELLO_TOKEN=your_trello_token_here
```

## 🏃‍♂️ Utilisation

### Développement local

```bash
source venv/bin/activate
python server.py
```

### Déploiement Railway

```bash
# Déployer sur Railway
railway login
railway init
railway up
```

## 🔧 Développement

FastMCP 2.0 simplifie énormément le développement MCP :

```python
from fastmcp import FastMCP

mcp = FastMCP("Trello MCP Server 🚀")

@mcp.tool
def list_boards() -> str:
    """List all accessible Trello boards."""
    # Votre logique ici
    return json.dumps(boards)

if __name__ == "__main__":
    mcp.run()
```

## 📚 Documentation

- [FastMCP 2.0 Documentation](https://gofastmcp.com/getting-started/welcome)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Trello API](https://developer.atlassian.com/cloud/trello/)

## 🆚 Avantages vs Version TypeScript

- ✅ **Plus simple** - Moins de code boilerplate
- ✅ **Plus rapide** - Framework optimisé
- ✅ **Plus maintenable** - Code Pythonic
- ✅ **Plus de fonctionnalités** - FastMCP 2.0 complet
- ✅ **Meilleure intégration** - Support natif des plateformes AI
