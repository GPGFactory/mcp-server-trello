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

// Logging middleware - réduit pour éviter la limite Railway
app.use((req, res, next) => {
  // Log seulement les requêtes importantes, pas toutes
  if (req.path === '/mcp' || req.path === '/test') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${req.method} ${req.path}`;
    console.log(logMessage);
  }
  next();
});

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
  const response = {
    message: 'MCP Server Trello HTTP',
    version: '1.3.1',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      mcp: '/mcp',
      tools: '/tools',
      test: '/test'
    }
  };
  // Log réduit pour éviter la limite Railway
  console.log('Root endpoint accessed');
  res.json(response);
});

// Test endpoint for Railway logs
app.get('/test', (req, res) => {
  const testResponse = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    message: 'Server is running and logging works!',
    environment: process.env.NODE_ENV || 'development',
    trello: {
      apiKey: process.env.TRELLO_API_KEY ? 'Set' : 'Missing',
      token: process.env.TRELLO_TOKEN ? 'Set' : 'Missing'
    }
  };
  // Log réduit pour éviter la limite Railway
  console.log('Test endpoint accessed');
  res.json(testResponse);
});

// MCP endpoint for OpenAI Platform
app.post('/mcp', async (req, res) => {
  // Timeout de 30 secondes pour éviter les blocages
  const timeout = setTimeout(() => {
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Request timeout'
        },
        id: req.body.id || null
      });
    }
  }, 30000);

  try {
    // Log réduit pour éviter la limite Railway - seulement la méthode
    console.log(`MCP Request: ${req.body.method || 'unknown'}`);
    
    // Support both JSON-RPC format and simple format
    let method, params, id;
    
    if (req.body.jsonrpc) {
      // JSON-RPC format: {"jsonrpc": "2.0", "method": "...", "params": {...}, "id": 1}
      method = req.body.method;
      params = req.body.params || {};
      id = req.body.id;
    } else {
      // Simple format: {"method": "...", "params": {...}}
      method = req.body.method;
      params = req.body.params || {};
    }
    
    if (!method) {
      console.log('Error: Method is required');
      return res.status(400).json({ 
        error: 'Method is required',
        jsonrpc: '2.0',
        id: id || null
      });
    }

    let result;
    
    switch (method) {
      case 'initialize':
        result = {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {}
          },
          serverInfo: {
            name: 'mcp-server-trello',
            version: '1.3.1'
          }
        };
        break;
        
      case 'tools/list':
        result = {
          tools: [
            {
              name: 'list_boards',
              description: 'List all accessible Trello boards',
              inputSchema: {
                type: 'object',
                properties: {},
                required: []
              }
            },
            {
              name: 'get_cards_by_list_id',
              description: 'Get cards from a specific Trello list',
              inputSchema: {
                type: 'object',
                properties: {
                  listId: { 
                    type: 'string', 
                    description: 'The ID of the Trello list' 
                  }
                },
                required: ['listId']
              }
            },
            {
              name: 'get_lists',
              description: 'Get all lists from a Trello board',
              inputSchema: {
                type: 'object',
                properties: {
                  boardId: { 
                    type: 'string', 
                    description: 'The ID of the Trello board' 
                  }
                },
                required: ['boardId']
              }
            },
            {
              name: 'create_card',
              description: 'Create a new card in a Trello list',
              inputSchema: {
                type: 'object',
                properties: {
                  listId: { 
                    type: 'string', 
                    description: 'The ID of the Trello list' 
                  },
                  name: { 
                    type: 'string', 
                    description: 'The name of the card' 
                  },
                  desc: { 
                    type: 'string', 
                    description: 'The description of the card' 
                  }
                },
                required: ['listId', 'name']
              }
            }
          ]
        };
        break;
        
      case 'tools/call':
        // Handle tool execution
        const toolName = params.name;
        const toolArguments = params.arguments || {};
        
        // Log réduit pour éviter la limite Railway
        console.log(`Tool: ${toolName}`);
        
        switch (toolName) {
          case 'list_boards':
            const boards = await trelloClient.listBoards();
            // Optimiser la réponse pour éviter les timeouts - seulement les infos essentielles
            result = boards.map(board => ({
              id: board.id,
              name: board.name,
              desc: board.desc,
              url: board.url,
              shortUrl: board.shortUrl,
              closed: board.closed,
              idOrganization: board.idOrganization
            }));
            break;
          case 'get_cards_by_list_id':
            result = await trelloClient.getCardsByList(toolArguments.boardId, toolArguments.listId);
            break;
          case 'get_lists':
            result = await trelloClient.getLists(toolArguments.boardId);
            break;
          case 'create_card':
            result = await trelloClient.addCard(toolArguments.boardId, {
              listId: toolArguments.listId,
              name: toolArguments.name,
              description: toolArguments.desc
            });
            break;
          default:
            throw new Error(`Unknown tool: ${toolName}`);
        }
        break;
        
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
        
      case 'notifications/initialized':
        // Handle initialization notification - no response needed for notifications
        // Pas de log pour éviter la limite Railway
        return res.status(200).json({});
        
      default:
        return res.status(400).json({ error: `Unknown method: ${method}` });
    }
    
    // Return in JSON-RPC format if request was JSON-RPC
    const response = req.body.jsonrpc ? {
      jsonrpc: '2.0',
      result: result,
      id: id
    } : { result };
    
    // Log réduit pour éviter la limite Railway
    console.log(`MCP Response: ${method}`);
    clearTimeout(timeout);
    res.json(response);
    
  } catch (error) {
    console.error('MCP Error:', error);
    clearTimeout(timeout);
    const errorResponse = req.body.jsonrpc ? {
      jsonrpc: '2.0',
      error: {
        code: -32603,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      id: req.body.id || null
    } : {
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };

    res.status(500).json(errorResponse);
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

// MCP discovery endpoint
app.get('/mcp', (req, res) => {
  res.json({
    jsonrpc: '2.0',
    result: {
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: {}
      },
      serverInfo: {
        name: 'mcp-server-trello',
        version: '1.3.1'
      }
    },
    id: null
  });
});

// Start server
app.listen(port, () => {
  console.log('='.repeat(60));
  console.log('🚀 MCP SERVER TRELLO HTTP STARTED');
  console.log('='.repeat(60));
  console.log(`📡 Port: ${port}`);
  console.log(`🌐 Root endpoint: http://localhost:${port}/`);
  console.log(`🛠️  MCP endpoint: http://localhost:${port}/mcp`);
  console.log(`📋 Available tools: http://localhost:${port}/tools`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔑 Trello API Key: ${process.env.TRELLO_API_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`🎫 Trello Token: ${process.env.TRELLO_TOKEN ? '✅ Set' : '❌ Missing'}`);
  console.log('='.repeat(60));
  console.log('📝 Server ready to receive requests...');
  console.log('='.repeat(60));
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down MCP Server Trello HTTP...');
  process.exit(0);
});
