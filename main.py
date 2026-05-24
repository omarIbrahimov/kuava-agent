from fastapi import FastAPI, Header, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
import logging

from fastapi.middleware.cors import CORSMiddleware

from contextlib import asynccontextmanager

# We will build this file in the next step!
from agent_logic import process_and_stream
from mcp_client import notion_mcp

# Initialize the Bouncer
app = FastAPI()

# 3. Create the Lifespan Event Manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- STARTUP LOGIC ---
    print("Starting up: Initializing Notion MCP Server...")
    try:
        await notion_mcp.connect()
        print("Notion MCP Server connected successfully!")
    except Exception as e:
        print(f"Warning: Could not start Notion MCP. AI will run without Notion access. Error: {e}")
    
    yield # This tells FastAPI to pause here and actually run your server
    
    # --- SHUTDOWN LOGIC ---
    print("Shutting down: Disconnecting Notion MCP Server...")
    await notion_mcp.disconnect()

# 4. Attach the lifespan to your FastAPI app
# Update your existing app = FastAPI() line to this:
app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In test, replace with ["*"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


logging.basicConfig(level=logging.INFO)




# --- SECURITY CONFIGURATION ---
# Replace these with the actual university emails of your teammates.
TEAM_WHITELIST = [
    "local_developer@uni.edu",
    "omaribrahimov123@gmail.com"
]

@app.post("/ask")
async def chat_endpoint(
    prompt: str = Form(...), 
    file: UploadFile = File(None),
    tailscale_user: str = Header(None, alias="Tailscale-User-Login")
):
    # CHANGE 3: Allow the local developer fallback if no header is present
    if not tailscale_user:
        # Check if we are in local dev mode (optional) or just use the fallback
        raise HTTPException(status_code=403, detail="Direct access forbidden.")

    tailscale_user = tailscale_user.strip().lower()
    
    # Verify the user is in your whitelist
    if tailscale_user not in TEAM_WHITELIST:
        raise HTTPException(status_code=403, detail="Unauthorized")

        
    logging.info(f"Access granted to {tailscale_user}. Processing prompt...")

    # --- PHASE 2: THE RECEIVING DOCK ---
    
    file_bytes = None
    file_type = None
    file_name = None
    
    # If the teammate attached a PDF or Image, grab it into RAM
    if file:
        file_bytes = await file.read()
        file_type = file.content_type
        file_name = file.filename
        logging.info(f"Received file attachment: {file_name} ({file_type})")

    # --- PHASE 3: THE HANDOFF ---
    
    # We hand the prompt and the file bytes to agent_logic.py. 
    # process_and_stream() will return a Python "Generator" that yields words.
    response_generator = process_and_stream(prompt, file_bytes, file_type, file_name)
    
    # We pipe that generator directly back to ui.py
    return StreamingResponse(response_generator, media_type="text/plain")