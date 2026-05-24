import json
import logging
import os
from contextlib import AsyncExitStack

# Official MCP SDK imports
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

# Configure logging so you can see what the server is doing
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("mcp-client")

class NotionMCPClient:
    def __init__(self, config_path: str = "mcp_configuration.json"):
        self.config_path = config_path
        self.session: ClientSession | None = None
        self._exit_stack = AsyncExitStack()

    async def connect(self):
        """Reads the JSON config and starts the hidden Node.js Notion server."""
        try:
            # 1. Read the configuration file
            with open(self.config_path, 'r') as f:
                config = json.load(f)
            
            notion_config = config.get("mcpServers", {}).get("notion")
            if not notion_config:
                raise ValueError("Notion MCP server configuration not found.")

            # 2. Extract command and args
            command = notion_config["command"]
            args = notion_config["args"]
            
            # Merge Notion Token with the Mac's current environment variables 
            # (Required so 'npx' knows where to find node)
            env = os.environ.copy()
            env.update(notion_config.get("env", {}))

            # 3. Setup the secure Stdio Server Parameters
            server_params = StdioServerParameters(
                command=command,
                args=args,
                env=env
            )

            logger.info("Starting Notion MCP Server via stdio...")

            # 4. Open the stdio tunnel and create the session
            stdio_transport = await self._exit_stack.enter_async_context(stdio_client(server_params))
            read, write = stdio_transport
            
            self.session = await self._exit_stack.enter_async_context(ClientSession(read, write))
            
            # 5. Perform the MCP Handshake
            await self.session.initialize()
            logger.info("Notion MCP Client successfully initialized and ready.")

        except Exception as e:
            logger.error(f"Failed to connect to Notion MCP server: {e}")
            raise

    async def get_available_tools(self):
        """Returns a list of tools the Notion server can perform (e.g., search, read)."""
        if not self.session:
            raise RuntimeError("Not connected to MCP server.")
        
        response = await self.session.list_tools()
        return response.tools

    async def execute_tool(self, tool_name: str, arguments: dict):
        """Forces the Notion server to execute a specific tool and returns the data."""
        if not self.session:
            raise RuntimeError("Not connected to MCP server.")
        
        logger.info(f"Executing Notion tool: '{tool_name}' with args: {arguments}")
        
        # Call the tool over the MCP bridge
        result = await self.session.call_tool(tool_name, arguments=arguments)
        
        # Tools usually return a list of "Content" objects. 
        # We extract the raw text to feed back to Gemma.
        text_results = [item.text for item in result.content if item.type == "text"]
        return "\n".join(text_results)

    async def disconnect(self):
        """Safely shuts down the Node.js server and closes the tunnel."""
        if self.session:
            logger.info("Shutting down Notion MCP Server...")
            await self._exit_stack.aclose()
            self.session = None

# Create a single global instance that FastAPI will use
notion_mcp = NotionMCPClient()