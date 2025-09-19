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
  // Timeout de 3 secondes pour éviter les timeouts OpenAI
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
  }, 3000);

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
              annotations: null,
              name: 'search',
              description: 'Search for content in Trello boards, lists, and cards. Use this to find specific boards or content. Example: search for "SAV" to find all boards containing "SAV" in their name or description.',
              inputSchema: {
                "$schema": "https://json-schema.org/draft/2020-12/schema",
                type: 'object',
                properties: {
                  query: { 
                    type: 'string', 
                    description: 'Search query to find boards, lists, or cards. Examples: "SAV", "projet", "Maxence", "urgent"',
                    examples: ["SAV", "projet", "urgent", "finance"]
                  }
                },
                required: ['query'],
                additionalProperties: false,
                examples: [
                  {"query": "SAV"},
                  {"query": "projet"},
                  {"query": "urgent"}
                ]
              }
            },
            {
              annotations: null,
              name: 'fetch',
              description: 'Fetch detailed information about a specific Trello resource (board, list, or card) using its ID. Example: fetch a board by its ID to get full details including description, URL, and metadata.',
              inputSchema: {
                "$schema": "https://json-schema.org/draft/2020-12/schema",
                type: 'object',
                properties: {
                  id: { 
                    type: 'string', 
                    description: 'The unique ID of the Trello resource to fetch (board, list, or card ID). Example: "5f8b2c1a3d4e5f6a7b8c9d0e"',
                    examples: ["5bed4a25a96b2a582160d31b", "5d0cb0d644b32880ea8268ea"]
                  }
                },
                required: ['id'],
                additionalProperties: false,
                examples: [
                  {"id": "5bed4a25a96b2a582160d31b"},
                  {"id": "5d0cb0d644b32880ea8268ea"}
                ]
              }
            },
            {
              annotations: null,
              name: 'list_boards',
              description: 'List all accessible Trello boards. Returns the 5 most recent open boards with basic information. Use this as the first step to see what boards are available. Example: call list_boards to see all your Trello boards.',
              inputSchema: {
                "$schema": "https://json-schema.org/draft/2020-12/schema",
                type: 'object',
                properties: {},
                required: [],
                additionalProperties: false,
                examples: [
                  {}
                ]
              }
            },
            {
              annotations: null,
              name: 'get_cards_by_list_id',
              description: 'Get all cards from a specific Trello list. Use this to see what tasks or items are in a list. Example: get all cards from a "To Do" list to see pending tasks.',
              inputSchema: {
                "$schema": "https://json-schema.org/draft/2020-12/schema",
                type: 'object',
                properties: {
                  listId: { 
                    type: 'string', 
                    description: 'The ID of the Trello list to get cards from. Example: "5f8b2c1a3d4e5f6a7b8c9d0f"',
                    examples: ["5f8b2c1a3d4e5f6a7b8c9d0f", "5a1b2c3d4e5f6a7b8c9d0e1f"]
                  }
                },
                required: ['listId'],
                additionalProperties: false,
                examples: [
                  {"listId": "5f8b2c1a3d4e5f6a7b8c9d0f"},
                  {"listId": "5a1b2c3d4e5f6a7b8c9d0e1f"}
                ]
              }
            },
            {
              annotations: null,
              name: 'get_lists',
              description: 'Get all lists from a specific Trello board. Use this to see the structure of a board and find list IDs. Example: get lists from a project board to see "To Do", "In Progress", "Done" columns.',
              inputSchema: {
                "$schema": "https://json-schema.org/draft/2020-12/schema",
                type: 'object',
                properties: {
                  boardId: { 
                    type: 'string', 
                    description: 'The ID of the Trello board to get lists from. Example: "5f8b2c1a3d4e5f6a7b8c9d0e"',
                    examples: ["5bed4a25a96b2a582160d31b", "5d0cb0d644b32880ea8268ea"]
                  }
                },
                required: ['boardId'],
                additionalProperties: false,
                examples: [
                  {"boardId": "5bed4a25a96b2a582160d31b"},
                  {"boardId": "5d0cb0d644b32880ea8268ea"}
                ]
              }
            },
            {
              annotations: null,
              name: 'create_card',
              description: 'Create a new card in a Trello list. Use this to add new tasks or items to a list. Example: create a card "Fix bug in login" in the "To Do" list.',
              inputSchema: {
                "$schema": "https://json-schema.org/draft/2020-12/schema",
                type: 'object',
                properties: {
                  listId: { 
                    type: 'string', 
                    description: 'The ID of the Trello list where to create the card. Example: "5f8b2c1a3d4e5f6a7b8c9d0f"',
                    examples: ["5f8b2c1a3d4e5f6a7b8c9d0f", "5a1b2c3d4e5f6a7b8c9d0e1f"]
                  },
                  name: { 
                    type: 'string', 
                    description: 'The name/title of the new card. Example: "Fix bug in login", "Review document", "Call client"',
                    examples: ["Fix bug in login", "Review document", "Call client", "Update website"]
                  },
                  desc: { 
                    type: 'string', 
                    description: 'Optional description for the new card. Example: "Fix the authentication issue reported by users"',
                    examples: ["Fix the authentication issue reported by users", "Review the contract before signing", "Call to discuss project timeline"]
                  }
                },
                required: ['listId', 'name'],
                additionalProperties: false,
                examples: [
                  {"listId": "5f8b2c1a3d4e5f6a7b8c9d0f", "name": "Fix bug in login", "desc": "Fix the authentication issue reported by users"},
                  {"listId": "5a1b2c3d4e5f6a7b8c9d0e1f", "name": "Review document", "desc": "Review the contract before signing"},
                  {"listId": "5f8b2c1a3d4e5f6a7b8c9d0f", "name": "Call client"}
                ]
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
              case 'search':
                // Recherche simple dans les tableaux Trello
                const allBoards = await trelloClient.listBoards();
                const query = toolArguments.query.toLowerCase();
                const searchResults = allBoards
                  .filter(board =>
                    board.name.toLowerCase().includes(query) ||
                    board.desc.toLowerCase().includes(query)
                  )
                  .map(board => ({
                    id: board.id,
                    title: board.name,
                    url: board.url
                  }));

                // Format requis par OpenAI MCP - chaîne JSON simple
                result = JSON.stringify({ results: searchResults });
                break;
            
          case 'fetch':
            // Récupération d'informations détaillées sur une ressource
            const id = toolArguments.id;
            
            // Essayer de récupérer comme tableau d'abord
            try {
              const board = await trelloClient.getBoardById(id);
              const fetchResult = {
                id: board.id,
                title: board.name,
                text: board.desc || `Tableau Trello: ${board.name}`,
                url: board.url,
                metadata: {
                  type: 'board',
                  closed: board.closed,
                  organization: board.idOrganization
                }
              };
              
              // Format requis par OpenAI MCP - chaîne JSON simple
              result = JSON.stringify(fetchResult);
            } catch (error) {
              // Si ce n'est pas un tableau, essayer comme liste
              try {
                const lists = await trelloClient.getLists(id);
                if (lists.length === 0) {
                  throw new Error(`No resource found with ID ${id}`);
                }
                const list = lists[0];
                const fetchResult = {
                  id: list.id,
                  title: list.name,
                  text: `Liste Trello: ${list.name}`,
                  url: `https://trello.com/b/${id}`,
                  metadata: {
                    type: 'list',
                    closed: list.closed,
                    boardId: list.idBoard
                  }
                };
                
                // Format requis par OpenAI MCP - chaîne JSON simple
                result = JSON.stringify(fetchResult);
              } catch (error2) {
                throw new Error(`No resource found with ID ${id}`);
              }
            }
            break;
            
          case 'list_boards':
            try {
              // Timeout spécifique pour l'appel Trello (2 secondes)
              const boardsPromise = trelloClient.listBoards();
              const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Trello API timeout')), 2000)
              );
              
              const boards = await Promise.race([boardsPromise, timeoutPromise]) as any[];
              
              // Limiter à 5 tableaux les plus récents pour éviter les timeouts
              const recentBoards = boards
                .filter((board: any) => !board.closed) // Seulement les tableaux ouverts
                .slice(0, 5) // Limiter à 5 tableaux pour plus de rapidité
                .map((board: any) => ({
                  id: board.id,
                  name: board.name,
                  url: board.shortUrl // Utiliser shortUrl plus court
                }));
              // Format requis par OpenAI MCP - chaîne JSON simple
              result = JSON.stringify(recentBoards);
            } catch (error) {
              console.error('Error in list_boards:', error);
              // Retourner une réponse d'erreur au lieu de faire planter
              result = JSON.stringify({ 
                error: 'Failed to fetch boards', 
                message: error instanceof Error ? error.message : 'Unknown error',
                boards: [] 
              });
            }
            break;
          case 'get_cards_by_list_id':
            const cards = await trelloClient.getCardsByList(toolArguments.boardId, toolArguments.listId);
            result = JSON.stringify(cards);
            break;
          case 'get_lists':
            const lists = await trelloClient.getLists(toolArguments.boardId);
            result = JSON.stringify(lists);
            break;
          case 'create_card':
            const newCard = await trelloClient.addCard(toolArguments.boardId, {
              listId: toolArguments.listId,
              name: toolArguments.name,
              description: toolArguments.desc
            });
            result = JSON.stringify(newCard);
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
    
    // Réponse immédiate pour éviter les timeouts
    if (!res.headersSent) {
      res.json(response);
    }
    
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
    'search',
    'fetch', 
    'list_boards',
    'get_cards_by_list_id',
    'get_lists',
    'create_card'
  ];
  
  res.json({ 
    tools,
    count: tools.length,
    description: 'Available Trello MCP tools - conform to OpenAI MCP specification'
  });
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

// SSE endpoint for OpenAI MCP compatibility
app.get('/sse', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  // Send initial connection event
  res.write('data: {"type":"connection","status":"connected"}\n\n');
  
  // Keep connection alive
  const keepAlive = setInterval(() => {
    res.write('data: {"type":"ping"}\n\n');
  }, 30000);

  req.on('close', () => {
    clearInterval(keepAlive);
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
