import { useState } from 'react';
import './App.css'; // Link to styling

function App() {
  // --- STATE VARIABLES ---
  // 1. For user input
  const [code, setCode] = useState(''); // Stores the code the user types
  const [language, setLanguage] = useState('python'); // Stores the selected language (default to python)
  const [errorMessage, setErrorMessage] = useState(''); // Stores the error message for analysis

  // 2. For AI response and status
  const [aiExplanation, setAiExplanation] = useState("Your AI explanation will appear here."); // Stores the AI's explanation
  const [loading, setLoading] = useState(false); // True when waiting for AI response
  const [error, setError] = useState(null); // Stores any error from the backend/AI

  // --- FUNCTION TO SEND REQUEST TO BACKEND ---
  // This function handles sending data to your FastAPI backend based on the button clicked.
  const sendCodeToBackend = async (type) => {
    setLoading(true); // Show loading state
    setError(null);   // Clear any previous errors
    setAiExplanation("Thinking..."); // Display a "thinking" message

    // Determine which FastAPI endpoint to call and what data to send
    let endpoint = '';
    let requestBody = {};
    let promptType = '';

    if (type === 'explain') {
      endpoint = '/api/explain-code'; // Endpoint for code explanation
      requestBody = { code, language }; // Data to send: code and language
      promptType = 'explain'; // For error messages
    } else if (type === 'analyzeError') {
      // Future endpoint for error analysis
      endpoint = '/api/analyze-error';
      requestBody = { code, language, error_message: errorMessage };
      promptType = 'analyze error';
    } else if (type === 'suggestions') {
      // Future endpoint for general suggestions
      endpoint = '/api/get-suggestions';
      // For suggestions, we might add an input for problem_description later
      requestBody = { code, language, problem_description: "" };
      promptType = 'get suggestions';
    } else {
      // Handle invalid action type
      setError("Invalid action type. Please try again.");
      setLoading(false);
      setAiExplanation("An internal error occurred.");
      return;
    }

    try {
      // Make the POST request to your FastAPI backend
      const response = await fetch(`http://localhost:8000${endpoint}`, {
        method: 'POST', // Use POST since we're sending data in the body
        headers: {
          'Content-Type': 'application/json', // Specify that the body is JSON
        },
        body: JSON.stringify(requestBody), // Convert the JavaScript object to a JSON string
      });

      // Check if the response was successful (HTTP status 200-299)
      if (!response.ok) {
        // If not successful, try to parse the error message from the backend
        const errorData = await response.json();
        // Throw an error with a more specific message if available
        throw new Error(errorData.detail || `HTTP error! Status: ${response.status}`);
      }

      // Parse the successful JSON response from FastAPI
      const data = await response.json();
      // Update the AI explanation state with the received explanation
      setAiExplanation(data.explanation || data.api_message || JSON.stringify(data, null, 2));
    } catch (err) {
      // Catch and handle any errors during the fetch operation
      console.error(`Failed to ${promptType}:`, err);
      setError(`Failed to ${promptType}. Please check your backend connection. Error: ${err.message}`);
      setAiExplanation(`An error occurred. Please check the console for details.`);
    } finally {
      // Always stop loading, regardless of success or failure
      setLoading(false);
    }
  };


  // --- UI STRUCTURE (JSX) ---
  return (
    <div className="App">
      <header className="app-header">
        <h1>CodeBuddy AI</h1>
        <p>Your AI-powered assistant for understanding and debugging code. For beginners!</p>
      </header>

      <main className="app-main">
        <section className="input-section card">
          <h2>Provide Your Code</h2>
          <div className="controls-group">
            <label htmlFor="language-select" className="input-label">Language:</label>
            <select
              id="language-select"
              className="language-select"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="python">Python</option>
              <option value="javascript">JavaScript</option>
              <option value="java">Java</option>
              <option value="c++">C++</option>
              <option value="csharp">C#</option>
              <option value="html">HTML</option>
              <option value="css">CSS</option>
              <option value="sql">SQL</option>
              <option value="php">PHP</option>
              <option value="ruby">Ruby</option>
              <option value="go">Go</option>
              {/* Add more languages as needed */}
            </select>
          </div>

          <textarea
            className="code-input"
            placeholder="Paste your code here..."
            value={code}
            onChange={(e) => setCode(e.target.value)}
            rows="15"
          ></textarea>

          <h3 className="sub-heading">Error Message (Optional, for "Analyze Error")</h3>
          <textarea
            className="error-message-input"
            placeholder="Paste your error message here (if any)..."
            value={errorMessage}
            onChange={(e) => setErrorMessage(e.target.value)}
            rows="3"
          ></textarea>

          <div className="action-buttons">
            <button
              onClick={() => sendCodeToBackend('explain')}
              disabled={loading || !code.trim()} // Disable if loading or code is empty
              className="action-button"
            >
              {loading && aiExplanation === "Thinking..." ? 'Explaining...' : 'Explain Code'}
            </button>
            <button
              onClick={() => sendCodeToBackend('analyzeError')}
              disabled={loading || !code.trim() || !errorMessage.trim()} // Disable if loading, code or error is empty
              className="action-button"
            >
              {loading && aiExplanation === "Thinking..." ? 'Analyzing...' : 'Analyze Error'}
            </button>
            <button
              onClick={() => sendCodeToBackend('suggestions')}
              disabled={loading || !code.trim()} // Disable if loading or code is empty
              className="action-button"
            >
              {loading && aiExplanation === "Thinking..." ? 'Suggesting...' : 'Get Suggestions'}
            </button>
          </div>
        </section>

        <section className="output-section card">
          <h2>AI Buddy's Response</h2>
          {error && <p className="status-message error-message">{error}</p>}
          {loading && !error && <p className="status-message loading-message">Thinking...</p>}
          {/* Display AI explanation or placeholder. Using <pre> to preserve formatting. */}
          {!loading && !error && (
            <pre className="ai-output">
              {aiExplanation}
            </pre>
          )}
        </section>
      </main>

      <footer className="app-footer">
        <p>&copy; 2025 CodeBuddy AI. Built with FastAPI and React. Developed by George</p>
      </footer>
    </div>
  );
}

export default App;
