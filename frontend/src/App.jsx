import { useState, useEffect } from 'react'; // Added useEffect
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter'; // Import the highlighter
// Import a style for the highlighter (github-dark works well with our theme)
import { coldarkDark } from 'react-syntax-highlighter/dist/esm/styles/prism'; // Or use 'docco', 'atom-one-dark' etc. for light/dark
import {
  python, javascript, java, cpp, csharp, xml, css, sql, php, ruby, go // Import languages you'll support
} from 'react-syntax-highlighter/dist/esm/languages/hljs'; // Use 'hljs' for common languages

import './App.css';

// Register languages with the highlighter
// This tells the highlighter how to understand and color different languages
SyntaxHighlighter.registerLanguage('python', python);
SyntaxHighlighter.registerLanguage('javascript', javascript);
SyntaxHighlighter.registerLanguage('java', java);
SyntaxHighlighter.registerLanguage('c++', cpp);
SyntaxHighlighter.registerLanguage('csharp', csharp);
SyntaxHighlighter.registerLanguage('html', xml); // HTML often uses XML parser
SyntaxHighlighter.registerLanguage('css', css);
SyntaxHighlighter.registerLanguage('sql', sql);
SyntaxHighlighter.registerLanguage('php', php);
SyntaxHighlighter.registerLanguage('ruby', ruby);
SyntaxHighlighter.registerLanguage('go', go);


function App() {
  // --- STATE VARIABLES ---
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('python');
  const [errorMessage, setErrorMessage] = useState('');

  const [aiExplanation, setAiExplanation] = useState("Your AI explanation will appear here.");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- Helper to extract code blocks for highlighting ---
  // This function will look for markdown code blocks (```language ... ```) in the AI's response
  const renderAiExplanation = (text) => {
    const parts = [];
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)\n```/g; // Regex to find code blocks
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      const [fullMatch, langHint, codeContent] = match;
      const preCodeText = text.substring(lastIndex, match.index);

      if (preCodeText) {
        parts.push(<p key={`text-${lastIndex}`}>{preCodeText}</p>);
      }

      // Use the language hint from the markdown, or default to the selected language if none is given
      const detectedLang = langHint || language;

      parts.push(
        <SyntaxHighlighter
          key={`code-${match.index}`}
          language={detectedLang}
          style={coldarkDark} // The dark theme for the highlighter
          showLineNumbers={true} // Show line numbers
          wrapLines={true} // Wrap long lines of code
          customStyle={{
            backgroundColor: '#1E2127', // Darker background for code blocks
            borderRadius: '8px',
            padding: '15px',
            marginBottom: '10px',
            overflowX: 'auto', // Allow horizontal scrolling for very long lines
            fontSize: '0.9em',
          }}
          lineProps={(lineNumber) => ({
            style: { display: 'block', padding: '0 5px' }, // Line padding
            onClick: () => { /* Optional: add line click handling */ }
          })}
        >
          {codeContent}
        </SyntaxHighlighter>
      );
      lastIndex = match.index + fullMatch.length;
    }

    const remainingText = text.substring(lastIndex);
    if (remainingText) {
      parts.push(<p key={`text-${lastIndex}`}>{remainingText}</p>);
    }
    return parts;
  };


  // --- FUNCTION TO SEND REQUEST TO BACKEND ---
  const sendCodeToBackend = async (type) => {
    setLoading(true);
    setError(null);
    setAiExplanation("Thinking...");

    let endpoint = '';
    let requestBody = {};
    let promptType = '';

    if (type === 'explain') {
      endpoint = '/api/explain-code';
      requestBody = { code, language };
      promptType = 'explain';
    } else if (type === 'analyzeError') {
      endpoint = '/api/analyze-error';
      requestBody = { code, language, error_message: errorMessage };
      promptType = 'analyze error';
    } else if (type === 'suggestions') {
      endpoint = '/api/get-suggestions';
      requestBody = { code, language, problem_description: "" };
      promptType = 'get suggestions';
    } else {
      setError("Invalid action type. Please try again.");
      setLoading(false);
      setAiExplanation("An internal error occurred.");
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      setAiExplanation(data.explanation || data.api_message || JSON.stringify(data, null, 2));
    } catch (err) {
      console.error(`Failed to ${promptType}:`, err);
      setError(`Failed to ${promptType}. Please check your backend connection. Error: ${err.message}`);
      setAiExplanation(`An error occurred. Please check the console for details.`);
    } finally {
      setLoading(false);
    }
  };


  // --- UI STRUCTURE (JSX) ---
  return (
    <div className="App">
      <header className="app-header">
        {/* <img src="/codeb.svg" alt="CodeBuddy AI Logo" className="app-logo" /> */}
        <h1>CodeBuddy AI</h1>
        <p>Your AI-powered assistant for understanding and debugging code.</p>
        <p className="disclaimer-message">CodeBuddy AI can make mistakes, please double-check responses.</p>
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
              disabled={loading || !code.trim()}
              className="action-button"
            >
              {loading && aiExplanation === "Thinking..." ? 'Explaining...' : 'Explain Code'}
            </button>
            <button
              onClick={() => sendCodeToBackend('analyzeError')}
              disabled={loading || !code.trim() || !errorMessage.trim()}
              className="action-button"
            >
              {loading && aiExplanation === "Thinking..." ? 'Analyzing...' : 'Analyze Error'}
            </button>
            <button
              onClick={() => sendCodeToBackend('suggestions')}
              disabled={loading || !code.trim()}
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
          {/* Display AI explanation with syntax highlighting */}
          {!loading && !error && (
            <div className="ai-output-container">
              {renderAiExplanation(aiExplanation)}
            </div>
          )}
        </section>
      </main>

      <footer className="app-footer">
        <p>&copy; 2025 CodeBuddy AI. Built with FastAPI and React.</p>
      </footer>
    </div>
  );
}

export default App;
