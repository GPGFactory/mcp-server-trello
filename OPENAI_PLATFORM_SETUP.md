# 🤖 Configuration pour OpenAI Platform

Ce guide vous explique comment configurer votre MCP Server Trello avec OpenAI Platform (ChatGPT).

## 🚀 **Déploiement sur Railway**

### 1. Déployez votre serveur HTTP

Votre serveur est maintenant configuré pour fonctionner avec HTTP. Déployez-le sur Railway :

```bash
# Installer les nouvelles dépendances
npm install

# Construire le projet
npm run build

# Déployer sur Railway
railway up
```

### 2. Obtenez votre URL Railway

Une fois déployé, votre URL sera :
```
https://votre-projet-production.up.railway.app
```

## 🔧 **Configuration dans OpenAI Platform**

### 1. Accédez à OpenAI Platform

1. Allez sur [platform.openai.com](https://platform.openai.com)
2. Connectez-vous à votre compte
3. Allez dans la section **"Assistants"** ou **"Custom Tools"**

### 2. Configurez votre serveur MCP

Dans l'interface OpenAI Platform, ajoutez votre serveur MCP :

```json
{
  "mcp_servers": {
    "trello": {
      "url": "https://votre-projet-production.up.railway.app",
      "environment_variables": {
        "TRELLO_API_KEY": "votre-clé-api-trello",
        "TRELLO_TOKEN": "votre-token-trello"
      }
    }
  }
}
```

### 3. Endpoints disponibles

Votre serveur expose ces endpoints :

- **`POST /mcp`** - Endpoint principal pour les appels MCP
- **`GET /health`** - Vérification de santé
- **`GET /tools`** - Liste des outils disponibles

## 🛠️ **Outils disponibles**

Votre serveur expose **27 outils Trello** :

### Gestion des cartes
- `get_cards_by_list_id` - Récupérer les cartes d'une liste
- `add_card_to_list` - Ajouter une carte
- `update_card_details` - Modifier une carte
- `archive_card` - Archiver une carte
- `move_card` - Déplacer une carte
- `get_card` - Détails complets d'une carte
- `get_my_cards` - Mes cartes assignées

### Gestion des listes
- `get_lists` - Récupérer les listes
- `add_list_to_board` - Ajouter une liste
- `archive_list` - Archiver une liste

### Gestion des tableaux
- `list_boards` - Lister les tableaux
- `set_active_board` - Définir le tableau actif
- `create_board` - Créer un tableau
- `get_active_board_info` - Infos du tableau actif

### Gestion des espaces de travail
- `list_workspaces` - Lister les espaces
- `set_active_workspace` - Définir l'espace actif
- `list_boards_in_workspace` - Tableaux d'un espace

### Checklists (🆕)
- `get_checklist_items` - Éléments d'une checklist
- `add_checklist_item` - Ajouter un élément
- `find_checklist_items_by_description` - Rechercher
- `get_acceptance_criteria` - Critères d'acceptation
- `get_checklist_by_name` - Checklist complète

### Pièces jointes
- `attach_image_to_card` - Attacher une image
- `attach_file_to_card` - Attacher un fichier

### Activités
- `get_recent_activity` - Activité récente
- `add_comment` - Ajouter un commentaire
- `update_comment` - Modifier un commentaire

## 📝 **Exemple d'utilisation**

### Appel API vers votre serveur

```bash
curl -X POST https://votre-projet-production.up.railway.app/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "method": "list_boards",
    "params": {}
  }'
```

### Réponse

```json
{
  "result": [
    {
      "id": "board123",
      "name": "Mon Projet",
      "desc": "Description du projet",
      "url": "https://trello.com/b/board123/mon-projet"
    }
  ]
}
```

## 🔍 **Test de votre déploiement**

### 1. Vérifiez la santé

```bash
curl https://votre-projet-production.up.railway.app/health
```

### 2. Liste des outils

```bash
curl https://votre-projet-production.up.railway.app/tools
```

### 3. Test d'un outil

```bash
curl -X POST https://votre-projet-production.up.railway.app/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "method": "list_boards",
    "params": {}
  }'
```

## 🚨 **Dépannage**

### Problèmes courants

1. **Erreur 500** : Vérifiez vos variables d'environnement Trello
2. **Timeout** : Railway peut avoir des délais de démarrage
3. **CORS** : Le serveur est configuré pour accepter toutes les origines

### Logs Railway

```bash
railway logs
```

## 🔒 **Sécurité**

- ✅ Variables d'environnement chiffrées sur Railway
- ✅ CORS configuré pour l'usage web
- ✅ Validation des paramètres d'entrée
- ✅ Gestion d'erreurs robuste

## 📊 **Monitoring**

Railway fournit :
- Logs en temps réel
- Métriques de performance
- Health checks automatiques
- Redémarrage automatique

Votre serveur MCP Trello est maintenant prêt pour OpenAI Platform ! 🎉
