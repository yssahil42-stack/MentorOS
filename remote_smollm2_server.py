"""
MentorOS Remote AI Server - SmolLM2-1.7B-Instruct with Ngrok Tunnel
==================================================================
Run this script on Google Colab, a GPU instance, or locally to expose
an OpenAI-compatible /v1/chat/completions endpoint for MentorOS.

Requirements:
  pip install fastapi uvicorn pyngrok pydantic transformers torch accelerate nest-asyncio
"""

import time
import re
import json
from typing import List, Optional
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from pyngrok import ngrok
import nest_asyncio
import uvicorn

# 1. Initialize FastAPI app
app = FastAPI(title="MentorOS Remote SmolLM2 API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Model Configuration
MODEL_ID = "HuggingFaceTB/SmolLM2-1.7B-Instruct"
print(f"[*] Loading model: {MODEL_ID}...")

device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"[*] Detected compute device: {device}")

tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)
model = AutoModelForCausalLM.from_pretrained(
    MODEL_ID,
    torch_dtype=torch.float16 if device == "cuda" else torch.float32,
    device_map="auto" if device == "cuda" else None,
)
if device == "cpu":
    model.to("cpu")

print(f"[✓] {MODEL_ID} loaded successfully on {device}!\n")

# 3. Request / Response Schemas
class Message(BaseModel):
    role: str
    content: str

class ChatCompletionRequest(BaseModel):
    model: Optional[str] = "smollm2:1.7b"
    messages: List[Message]
    temperature: Optional[float] = 0.2
    max_tokens: Optional[int] = 1024

@app.get("/")
def root():
    return {
        "status": "online",
        "service": "MentorOS Remote AI Server",
        "model": MODEL_ID,
        "device": device,
        "endpoint": "/v1/chat/completions"
    }

@app.get("/v1/models")
def list_models():
    return {
        "object": "list",
        "data": [
            {
                "id": "smollm2:1.7b",
                "object": "model",
                "created": int(time.time()),
                "owned_by": "huggingface"
            }
        ]
    }

# 4. OpenAI-Compatible /v1/chat/completions Endpoint
@app.post("/v1/chat/completions")
async def chat_completions(request: ChatCompletionRequest):
    chat_history = [{"role": m.role, "content": m.content} for m in request.messages]
    
    prompt = tokenizer.apply_chat_template(
        chat_history,
        tokenize=False,
        add_generation_prompt=True
    )
    
    inputs = tokenizer(prompt, return_tensors="pt").to(model.device)
    
    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=request.max_tokens or 1024,
            temperature=request.temperature if (request.temperature and request.temperature > 0) else None,
            do_sample=True if (request.temperature and request.temperature > 0) else False,
            pad_token_id=tokenizer.eos_token_id,
        )
    
    generated_tokens = outputs[0][inputs.input_ids.shape[1]:]
    response_text = tokenizer.decode(generated_tokens, skip_special_tokens=True).strip()

    return {
        "id": f"chatcmpl-{int(time.time())}",
        "object": "chat.completion",
        "created": int(time.time()),
        "model": request.model or "smollm2:1.7b",
        "choices": [
            {
                "index": 0,
                "message": {
                    "role": "assistant",
                    "content": response_text,
                },
                "finish_reason": "stop"
            }
        ]
    }

def start_server():
    # 5. Connect ngrok using your Auth Token
    NGROK_AUTH_TOKEN = "3JvZxpzsMQDOQq5yxIgFtKP7tPg_5q2aj5DKX2dBot979fN1Z"
    ngrok.set_auth_token(NGROK_AUTH_TOKEN)

    # Establish tunnel to port 8000
    tunnel = ngrok.connect(8000)
    public_url = tunnel.public_url

    print("=" * 70)
    print("  🚀 MentorOS Remote SmolLM2 API Server is Online!")
    print(f"  Public Ngrok URL: {public_url}")
    print(f"  OpenAI Endpoint:  {public_url}/v1/chat/completions")
    print(f"\n  To connect MentorOS, add this to your .env file:")
    print(f"  CUSTOM_OPENAI_URL=\"{public_url}/v1/chat/completions\"")
    print("=" * 70 + "\n")

    nest_asyncio.apply()
    uvicorn.run(app, host="0.0.0.0", port=8000)

if __name__ == "__main__":
    start_server()
