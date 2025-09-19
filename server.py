#!/usr/bin/env python3
"""
MCP Server Trello - FastMCP 2.0 Implementation
A modern, Pythonic MCP server for Trello integration
"""

import os
import json
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
import requests
from fastmcp import FastMCP

# Load environment variables
load_dotenv()

# Initialize FastMCP server
mcp = FastMCP("Trello MCP Server 🚀")

# Trello API configuration
TRELLO_API_KEY = os.getenv("TRELLO_API_KEY")
TRELLO_TOKEN = os.getenv("TRELLO_TOKEN")
TRELLO_BASE_URL = "https://api.trello.com/1"

if not TRELLO_API_KEY or not TRELLO_TOKEN:
    raise ValueError("TRELLO_API_KEY and TRELLO_TOKEN must be set in environment variables")

class TrelloClient:
    """Simple Trello API client"""
    
    def __init__(self, api_key: str, token: str):
        self.api_key = api_key
        self.token = token
        self.base_url = TRELLO_BASE_URL
    
    def _make_request(self, endpoint: str, params: Dict[str, Any] = None) -> Dict[str, Any]:
        """Make a request to Trello API"""
        if params is None:
            params = {}
        
        params.update({
            'key': self.api_key,
            'token': self.token
        })
        
        url = f"{self.base_url}/{endpoint}"
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        return response.json()
    
    def list_boards(self) -> List[Dict[str, Any]]:
        """List all accessible boards"""
        return self._make_request("members/me/boards")
    
    def get_board(self, board_id: str) -> Dict[str, Any]:
        """Get board details"""
        return self._make_request(f"boards/{board_id}")
    
    def get_lists(self, board_id: str) -> List[Dict[str, Any]]:
        """Get lists from a board"""
        return self._make_request(f"boards/{board_id}/lists")
    
    def get_cards(self, list_id: str) -> List[Dict[str, Any]]:
        """Get cards from a list"""
        return self._make_request(f"lists/{list_id}/cards")
    
    def create_card(self, list_id: str, name: str, desc: str = "") -> Dict[str, Any]:
        """Create a new card"""
        params = {
            'name': name,
            'desc': desc
        }
        
        url = f"{self.base_url}/cards"
        params.update({
            'key': self.api_key,
            'token': self.token,
            'idList': list_id
        })
        
        response = requests.post(url, params=params, timeout=10)
        response.raise_for_status()
        return response.json()

# Initialize Trello client
trello = TrelloClient(TRELLO_API_KEY, TRELLO_TOKEN)

@mcp.tool
def list_boards() -> str:
    """
    List all accessible Trello boards.
    
    Returns the 5 most recent open boards with basic information.
    Use this as the first step to see what boards are available.
    
    Returns:
        JSON string containing list of boards with id, name, and url
    """
    try:
        boards = trello.list_boards()
        # Filter open boards and limit to 5 for performance
        recent_boards = [
            {
                "id": board["id"],
                "name": board["name"],
                "url": board["shortUrl"]
            }
            for board in boards
            if not board.get("closed", False)
        ][:5]
        
        return json.dumps(recent_boards)
    except Exception as e:
        return json.dumps({"error": f"Failed to fetch boards: {str(e)}", "boards": []})

@mcp.tool
def search_boards(query: str) -> str:
    """
    Search for boards by name or description.
    
    Args:
        query: Search term to find boards containing this text
        
    Returns:
        JSON string containing matching boards
    """
    try:
        boards = trello.list_boards()
        query_lower = query.lower()
        
        matching_boards = [
            {
                "id": board["id"],
                "name": board["name"],
                "url": board["shortUrl"]
            }
            for board in boards
            if not board.get("closed", False) and (
                query_lower in board["name"].lower() or
                query_lower in board.get("desc", "").lower()
            )
        ]
        
        return json.dumps({"results": matching_boards})
    except Exception as e:
        return json.dumps({"error": f"Search failed: {str(e)}", "results": []})

@mcp.tool
def get_board_details(board_id: str) -> str:
    """
    Get detailed information about a specific board.
    
    Args:
        board_id: The ID of the Trello board
        
    Returns:
        JSON string containing board details
    """
    try:
        board = trello.get_board(board_id)
        return json.dumps({
            "id": board["id"],
            "name": board["name"],
            "desc": board.get("desc", ""),
            "url": board["url"],
            "closed": board.get("closed", False),
            "organization": board.get("idOrganization")
        })
    except Exception as e:
        return json.dumps({"error": f"Failed to fetch board: {str(e)}"})

@mcp.tool
def get_lists(board_id: str) -> str:
    """
    Get all lists from a specific Trello board.
    
    Use this to see the structure of a board and find list IDs.
    
    Args:
        board_id: The ID of the Trello board
        
    Returns:
        JSON string containing list of lists with id, name, and closed status
    """
    try:
        lists = trello.get_lists(board_id)
        return json.dumps([
            {
                "id": list_item["id"],
                "name": list_item["name"],
                "closed": list_item.get("closed", False),
                "boardId": list_item["idBoard"]
            }
            for list_item in lists
        ])
    except Exception as e:
        return json.dumps({"error": f"Failed to fetch lists: {str(e)}"})

@mcp.tool
def get_cards(list_id: str) -> str:
    """
    Get all cards from a specific Trello list.
    
    Use this to see what tasks or items are in a list.
    
    Args:
        list_id: The ID of the Trello list
        
    Returns:
        JSON string containing list of cards with id, name, and description
    """
    try:
        cards = trello.get_cards(list_id)
        return json.dumps([
            {
                "id": card["id"],
                "name": card["name"],
                "desc": card.get("desc", ""),
                "url": card["shortUrl"],
                "closed": card.get("closed", False)
            }
            for card in cards
        ])
    except Exception as e:
        return json.dumps({"error": f"Failed to fetch cards: {str(e)}"})

@mcp.tool
def create_card(list_id: str, name: str, desc: str = "") -> str:
    """
    Create a new card in a Trello list.
    
    Use this to add new tasks or items to a list.
    
    Args:
        list_id: The ID of the Trello list where to create the card
        name: The name/title of the new card
        desc: Optional description for the new card
        
    Returns:
        JSON string containing the created card details
    """
    try:
        card = trello.create_card(list_id, name, desc)
        return json.dumps({
            "id": card["id"],
            "name": card["name"],
            "desc": card.get("desc", ""),
            "url": card["shortUrl"],
            "listId": card["idList"]
        })
    except Exception as e:
        return json.dumps({"error": f"Failed to create card: {str(e)}"})

if __name__ == "__main__":
    print("🚀 Starting Trello MCP Server with FastMCP 2.0")
    print(f"📋 Trello API Key: {'✅ Set' if TRELLO_API_KEY else '❌ Missing'}")
    print(f"🎫 Trello Token: {'✅ Set' if TRELLO_TOKEN else '❌ Missing'}")
    mcp.run()
