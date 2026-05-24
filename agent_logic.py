import json
import requests
import base64

from mcp_client import notion_mcp

# The default address for Ollama running on your Mac
OLLAMA_URL = "http://localhost:11434/api/chat"
# Make sure this matches the model you have downloaded
MODEL_NAME = "gemma4:e4b" 

# Note: Changed to 'async def' because the Notion MCP uses async network tunnels
async def process_and_stream(prompt, file_bytes, file_type, file_name):
    """
    Takes the raw text and images from main.py, intercepts Notion requests,
    formats it for Ollama, and yields the response word-by-word.
    """
    
    images_base64 = []

    # --- MULTIMODAL HANDLING (Images Only) ---
    if file_bytes and file_type and "image" in file_type.lower():
        # Convert image to Base64 so a vision model can see it
        encoded_image = base64.b64encode(file_bytes).decode('utf-8')
        images_base64.append(encoded_image)

    # ==========================================
    # STEP 1: THE TRAFFIC COP ROUTER (Notion)
    # ==========================================
    if prompt.strip().startswith("/notion"):
        clean_prompt = prompt.replace("/notion", "", 1).strip()
        
        # Yield an immediate UI update so the user knows it's searching
        yield "🔍 *Searching Notion internal docs...*\n\n"
        
        try:
        # A. Ask the MCP Server what Notion tools are available
            mcp_tools = await notion_mcp.get_available_tools()
            
            # B. The "Bouncer": Filter the tools down to only the essentials
            allowed_tools = ["notion_query_database"]
            
            ollama_tools = []
            for tool in mcp_tools:
                # ISOLATION CHECK: Only add the tool if it is in our allowed list
                if tool.name in allowed_tools:
                    ollama_tools.append({
                        "type": "function",
                        "function": {
                            "name": tool.name,
                            "description": tool.description,
                            "parameters": tool.inputSchema
                        }
                    })

            # C. The "Hidden" LLM Call: Force Gemma to pick a tool
            tool_payload = {
                "model": MODEL_NAME,
                "messages": [
                    {
                        "role": "system", 
                        "content": "You are a specialized routing agent. You MUST use one of the provided Notion tools (like 'notion_search') to answer the user's request. Output ONLY the tool call."
                    },
                    {"role": "user", "content": clean_prompt}
                ],
                "tools": ollama_tools,
                "stream": False
            }
            
            tool_response = requests.post(OLLAMA_URL, json=tool_payload).json()
            print(ollama_tools)
            message_data = tool_response.get("message", {})
            
            # D. Execute the tool Gemma chose
            if "tool_calls" in message_data and message_data["tool_calls"]:
                chosen_tool = message_data["tool_calls"][0]["function"]
                tool_name = chosen_tool["name"]
                tool_args = chosen_tool["arguments"]
                
                print(f"Success: Gemma chose tool '{tool_name}' with args {tool_args}") # Added for terminal debugging
                
                # Push the command through the MCP tunnel to Notion!
                notion_data = await notion_mcp.execute_tool(tool_name, tool_args)
                
                # E. Inject the retrieved Notion data invisibly into the prompt
                prompt = (
                    f"System Note: You retrieved the following data from Notion:\n"
                    f"---\n{notion_data}\n---\n"
                    f"Please answer the user's question using ONLY this context. "
                    f"User Question: {clean_prompt}"
                )
            else:
                yield "⚠️ *Warning: Gemma didn't select a Notion tool. Proceeding with normal knowledge.*\n\n"
                prompt = clean_prompt

        except Exception as e:
            yield f"⚠️ *Notion MCP Error:* {e}\n\n"
            prompt = clean_prompt  # Fallback to normal chat if Notion fails

    # ==========================================
    # STEP 2: THE STANDARD MESSAGE SCHEMA
    # ==========================================
    messages = [
        {
            "role": "system",
            "content": "You are a senior engineering assistant. Provide concise, accurate technical answers."
        },
        {
            "role": "user",
            "content": prompt,
            "images": images_base64 if images_base64 else None
        }
    ]

    payload = {
        "model": MODEL_NAME,
        "messages": messages,
        "stream": True
    }

    # ==========================================
    # STEP 3: THE STREAMING LOOP
    # ==========================================
    try:
        with requests.post(OLLAMA_URL, json=payload, stream=True) as response:
            response.raise_for_status()
            
            for line in response.iter_lines():
                if line:
                    chunk = json.loads(line)
                    if "message" in chunk and "content" in chunk["message"]:
                        word = chunk["message"]["content"]
                        yield word
                        
    except requests.exceptions.ConnectionError:
        yield "\n\n⚠️ **Error:** Cannot connect to Ollama. Is the Ollama app running on your Mac?"
    except Exception as e:
        yield f"\n\n⚠️ **Error during AI processing:** {e}"