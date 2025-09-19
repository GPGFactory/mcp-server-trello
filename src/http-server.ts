#!/usr/bin/env node
import express from 'express';
import cors from 'cors';
import { TrelloClient } from './trello-client.js';
import { z } from 'zod';

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Trello client
const apiKey = process.env.TRELLO_API_KEY;
const token = process.env.TRELLO_TOKEN;
const defaultBoardId = process.env.TRELLO_BOARD_ID;

if (!apiKey || !token) {
  console.error('TRELLO_API_KEY and TRELLO_TOKEN environment variables are required');
  process.exit(1);
}

const trelloClient = new TrelloClient({
  apiKey,
  token,
  defaultBoardId,
  boardId: defaultBoardId,
});

// Load configuration
trelloClient.loadConfig().catch(() => {
  // Continue with default config if loading fails
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'MCP Server Trello HTTP', 
    version: '1.3.1',
    endpoints: {
      mcp: '/mcp',
      tools: '/tools'
    }
  });
});

// MCP endpoint for OpenAI Platform
app.post('/mcp', async (req, res) => {
  try {
    const { method, params } = req.body;
    
    if (!method) {
      return res.status(400).json({ error: 'Method is required' });
    }

    let result;
    
    switch (method) {
      case 'get_cards_by_list_id':
        result = await trelloClient.getCardsByList(params.boardId, params.listId);
        break;
        
      case 'get_lists':
        result = await trelloClient.getLists(params.boardId);
        break;
        
      case 'get_recent_activity':
        result = await trelloClient.getRecentActivity(params.boardId, params.limit);
        break;
        
      case 'add_card_to_list':
        result = await trelloClient.addCard(params.boardId, params);
        break;
        
      case 'update_card_details':
        result = await trelloClient.updateCard(params.boardId, params);
        break;
        
      case 'archive_card':
        result = await trelloClient.archiveCard(params.boardId, params.cardId);
        break;
        
      case 'move_card':
        result = await trelloClient.moveCard(params.boardId, params.cardId, params.listId);
        break;
        
      case 'add_list_to_board':
        result = await trelloClient.addList(params.boardId, params.name);
        break;
        
      case 'archive_list':
        result = await trelloClient.archiveList(params.boardId, params.listId);
        break;
        
      case 'get_my_cards':
        result = await trelloClient.getMyCards();
        break;
        
      case 'attach_image_to_card':
        result = await trelloClient.attachImageToCard(
          params.boardId,
          params.cardId,
          params.imageUrl,
          params.name
        );
        break;
        
      case 'attach_file_to_card':
        result = await trelloClient.attachFileToCard(
          params.boardId,
          params.cardId,
          params.fileUrl,
          params.name,
          params.mimeType
        );
        break;
        
      case 'list_boards':
        result = await trelloClient.listBoards();
        break;
        
      case 'set_active_board':
        result = await trelloClient.setActiveBoard(params.boardId);
        break;
        
      case 'list_workspaces':
        result = await trelloClient.listWorkspaces();
        break;
        
      case 'create_board':
        result = await trelloClient.createBoard(params);
        break;
        
      case 'set_active_workspace':
        result = await trelloClient.setActiveWorkspace(params.workspaceId);
        break;
        
      case 'list_boards_in_workspace':
        result = await trelloClient.listBoardsInWorkspace(params.workspaceId);
        break;
        
      case 'get_active_board_info':
        const boardId = trelloClient.activeBoardId;
        if (!boardId) {
          return res.status(400).json({ error: 'No active board set' });
        }
        result = await trelloClient.getBoardById(boardId);
        break;
        
      case 'get_card':
        result = await trelloClient.getCard(params.cardId, params.includeMarkdown);
        break;
        
      case 'add_comment':
        result = await trelloClient.addCommentToCard(params.cardId, params.text);
        break;
        
      case 'update_comment':
        result = await trelloClient.updateCommentOnCard(params.commentId, params.text);
        break;
        
      case 'get_checklist_items':
        result = await trelloClient.getChecklistItems(params.name, params.boardId);
        break;
        
      case 'add_checklist_item':
        result = await trelloClient.addChecklistItem(
          params.text,
          params.checkListName,
          params.boardId
        );
        break;
        
      case 'find_checklist_items_by_description':
        result = await trelloClient.findChecklistItemsByDescription(
          params.description,
          params.boardId
        );
        break;
        
      case 'get_acceptance_criteria':
        result = await trelloClient.getAcceptanceCriteria(params.boardId);
        break;
        
      case 'get_checklist_by_name':
        result = await trelloClient.getChecklistByName(params.name, params.boardId);
        break;
        
      default:
        return res.status(400).json({ error: `Unknown method: ${method}` });
    }
    
    res.json({ result });
    
  } catch (error) {
    console.error('MCP Error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    });
  }
});

// List available tools
app.get('/tools', (req, res) => {
  const tools = [
    'get_cards_by_list_id',
    'get_lists',
    'get_recent_activity',
    'add_card_to_list',
    'update_card_details',
    'archive_card',
    'move_card',
    'add_list_to_board',
    'archive_list',
    'get_my_cards',
    'attach_image_to_card',
    'attach_file_to_card',
    'list_boards',
    'set_active_board',
    'list_workspaces',
    'create_board',
    'set_active_workspace',
    'list_boards_in_workspace',
    'get_active_board_info',
    'get_card',
    'add_comment',
    'update_comment',
    'get_checklist_items',
    'add_checklist_item',
    'find_checklist_items_by_description',
    'get_acceptance_criteria',
    'get_checklist_by_name'
  ];
  
  res.json({ tools });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 MCP Server Trello HTTP running on port ${port}`);
  console.log(`🌐 Root endpoint: http://localhost:${port}/`);
  console.log(`🛠️  MCP endpoint: http://localhost:${port}/mcp`);
  console.log(`📋 Available tools: http://localhost:${port}/tools`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down MCP Server Trello HTTP...');
  process.exit(0);
});
