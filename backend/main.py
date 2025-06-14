from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import os
import google.generativeai as genai #Google Generative AI import

# Load environment variables from .env file
load_dotenv()

# Configure Google Gemini API
# GEMINI_API_KEY uses the .env file
gemini_api_key = os.getenv("GEMINI_API_KEY")
if not gemini_api_key:
    raise ValueError("GEMINI_API_KEY not found in environment variables. Please set it in your .env file.")
genai.configure(api_key=gemini_api_key)

# Initialize the Generative Model
model = genai.GenerativeModel('gemini-1.5-flash-latest')

app = FastAPI()

# Temporarily used it to get valid Gemini models as gemini-pro was not working for me
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
    "http://localhost:5173", # This is the address where React frontend runs
    # May add  deployed frontend URL here later, e.g., "https://your-codebuddy-ai.vercel.app"
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

class ErrorAnalysisRequest(BaseModel):
    code: str
    language: str
    error_message: str

class SuggestionsRequest(BaseModel):
    code: str
    language: str
    problem_description: str = "" # Optional, if user wants to describe the problem


@app.get("/")
async def read_root():
    return {"message": "Welcome to CodeBuddy AI Backend!"}


@app.get("/hello/{name}")
async def say_hello(name: str):
    # This is an example of accessing an environment variable
    some_secret = os.getenv("MY_TEST_SECRET", "No secret set")
    return {"message": f"Hello, {name}! From the backend. Secret: {some_secret}"}


# New endpoint for frontend communication (this is used in React -- for testing)
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
    # This is where 'prompt engineering' comes in. AI needs to be guided.
    prompt = f"""
    As an expert programming tutor for beginners, explain the following {programming_language} code.
    Break down the code line-by-line or in small, logical blocks.
    Focus on clarity, simplicity, and explain why each part works.
    Avoid being overly verbose where possible.
    Do not just re-write the code. Provide actionable understanding.

    When providing code examples or showing parts of the original code, always wrap them in markdown code blocks like this:
    ```python
    your_code_here
    ```

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

@app.post("/api/analyze-error")
async def analyze_error(request: ErrorAnalysisRequest):
    """
    Receives code, language, and an error message, sends to AI for analysis.
    """
    code_to_analyze = request.code
    programming_language = request.language
    error_msg = request.error_message

    # --- Construct the prompt for Error Analysis ---
    prompt = f"""
    As an expert debugger and programming tutor for beginners, analyze the following error message
    in the context of the provided {programming_language} code.
    Explain:
    1. What the error message means in simple terms.
    2. Why it occurred in this specific code.
    3. Provide clear, actionable steps on how to fix it.
    Focus on explaining the concepts involved for a beginner.

    When providing code examples or showing parts of the original code/fixes, always wrap them in markdown code blocks like this:
    ```python
    your_code_example
    ```
    Use the appropriate language identifier after the backticks (e.g., `python`, `javascript`, `java`).

    Here is the error message:
    ```
    {error_msg}
    ```

    Here is the {programming_language} code:
    ```{programming_language}
    {code_to_analyze}
    ```
    """

    try:
        response = await model.generate_content_async(prompt)
        ai_analysis = response.text
    except Exception as e:
        print(f"Error calling Gemini API for error analysis: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get error analysis from AI: {e}")

    return {
        "explanation": ai_analysis,
        "received_code": code_to_analyze,
        "received_language": programming_language,
        "received_error_message": error_msg
    }

@app.post("/api/get-suggestions")
async def get_suggestions(request: SuggestionsRequest):
    """
    Receives code and language (and optional problem description), sends to AI for suggestions.
    """
    code_for_suggestions = request.code
    programming_language = request.language
    problem_description = request.problem_description

    # --- Construct the prompt for Suggestions ---
    # This prompt is more open-ended for general help or improvements.
    base_prompt = f"""
    As an expert programming tutor for beginners, review the following {programming_language} code.
    Provide helpful suggestions for improvement, best practices, or potential issues.
    Explain your suggestions clearly, in simple terms, and provide code examples where applicable.
    Aim to teach concepts rather than just providing solutions.

    When providing code examples, always wrap them in markdown code blocks like this:
    ```python
    your_code_example
    ```
    Use the appropriate language identifier after the backticks (e.g., `python`, `javascript`, `java`).
    """

    if problem_description.strip():
        prompt = f"""
        {base_prompt}
        The user is trying to achieve the following with their code: "{problem_description}".
        Given that goal, how can the code be improved or fixed?

        Here is the {programming_language} code:
        ```{programming_language}
        {code_for_suggestions}
        ```
        """
    else:
        prompt = f"""
        {base_prompt}
        Provide general improvements, optimizations, or best practices for the following {programming_language} code.

        Here is the {programming_language} code:
        ```{programming_language}
        {code_for_suggestions}
        ```
        """
    try:
        response = await model.generate_content_async(prompt)
        ai_suggestions = response.text
    except Exception as e:
        print(f"Error calling Gemini API for suggestions: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get suggestions from AI: {e}")

    return {
        "explanation": ai_suggestions, # We reuse 'explanation' key for consistency with explain-code
        "received_code": code_for_suggestions,
        "received_language": programming_language,
        "received_problem_description": problem_description
    }