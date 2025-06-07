from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import os
import google.generativeai as genai #Import Google Generative AI

# Load environment variables from .env file
load_dotenv()

# Configure Google Gemini API
# Make sure GEMINI_API_KEY is set in your .env file
gemini_api_key = os.getenv("GEMINI_API_KEY")
if not gemini_api_key:
    raise ValueError("GEMINI_API_KEY not found in environment variables. Please set it in your .env file.")
genai.configure(api_key=gemini_api_key)

# Initialize the Generative Model (you can choose 'gemini-pro' or other models)
# 'gemini-pro' is generally good for text-based tasks.
model = genai.GenerativeModel('gemini-1.5-flash-latest')

app = FastAPI()

# Temporarily used it to get valid models
# @app.get("/api/list-models")
# async def list_available_models():
#     try:
#         # Use the genai.list_models() function
#         # This will go to Google and ask "What models can I use from here?"
#         models = genai.list_models()
#         model_names = []
#         for m in models:
#             # We're interested in models that can generate text (like gemini-pro was supposed to)
#             if 'generateContent' in m.supported_generation_methods:
#                 model_names.append(m.name)
#         return {"available_text_models": model_names}
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Failed to list models: {e}")


# Add CORS middleware
origins = [
    "http://localhost",
    "http://localhost:5173", # This is the address where your React frontend runs
    # You might add your deployed frontend URL here later, e.g., "https://your-codebuddy-ai.vercel.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], # Allows all HTTP methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"], # Allows all headers
)

class CodeExplanationRequest(BaseModel):
    code: str
    language: str


@app.get("/")
async def read_root():
    return {"message": "Welcome to CodeBuddy AI Backend!"}


@app.get("/hello/{name}")
async def say_hello(name: str):
    # This is an example of accessing an environment variable
    # (though we don't have one set up yet in .env)
    some_secret = os.getenv("MY_TEST_SECRET", "No secret set")
    return {"message": f"Hello, {name}! From the backend. Secret: {some_secret}"}


# New endpoint for frontend communication (we'll use this in React)
@app.get("/api/message")
async def get_api_message():
    return {"api_message": "Hello from FastAPI backend! Your connection works!"}


@app.post("/api/explain-code")
async def explain_code(request: CodeExplanationRequest):
    """
    Receives code and language, and sends to Google Gemini for explanation.
    """
    code_to_explain = request.code
    programming_language = request.language

    # --- Construct the prompt for Google Gemini ---
    # This is where 'prompt engineering' comes in. We want to guide the AI.
    prompt = f"""
    As an expert programming tutor for beginners, explain the following {programming_language} code.
    Break down the code line-by-line or in small, logical blocks.
    Focus on clarity, simplicity, and explain *why* each part works.
    Avoid jargon where possible, or explain it clearly.
    Do not just re-write the code. Provide actionable understanding.

    Here is the {programming_language} code:
    ```{programming_language}
    {code_to_explain}
    ```
    """

    try:
        #Call the Gemini API
        #This is an asynchronous operation, so we use await
        response = await model.generate_content_async(prompt)
        ai_explanation = response.text # Get the text content from the AI's response

    except Exception as e:
        #Handles potential errors from the AI API (e.g., API key issues, rate limits)
        print(f"Error calling Gemini API: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get explanation from AI: {e}")

    # For now, we'll just return what we received + a placeholder for AI response.
    # In the next step, this is where we'll call the actual AI API.
    # print(f"Received code for explanation ({programming_language}):\n{code_to_explain[:100]}...") # Print first 100 chars
    # print("Simulating AI explanation...")

    # ai_explanation = f"AI Explanation for {programming_language} code (placeholder): Your code looks interesting! I will explain it thoroughly soon."

    return {
        "explanation": ai_explanation,
        "received_code": code_to_explain,
        "received_language": programming_language
    }