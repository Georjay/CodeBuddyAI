# CodeBuddyAI

AI-powered coding assistant for beginner developers, offering code explanation, debugging, and optimization. Built with React and FastAPI for seamless AI integration.

## Features

- **Code Explanation**: Get clear, beginner-friendly explanations of complex code
- **Smart Debugging**: Receive AI-powered suggestions for fixing code errors
- **Code Optimization**: Improve code performance and readability
- **Multi-Language Support**: Works with Python, JavaScript, Java, and more
- **Interactive Interface**: Clean, user-friendly React-based frontend
- **Real-time Processing**: Fast API responses for instant coding assistance

## Technologies Used

- **Frontend**: React
- **Backend**: FastAPI, Python
- **AI Integration**: OpenAI API / Custom AI models
- **HTTP Client**: Axios for API communication
- **Styling**: CSS modules / Styled Components

## Installation

### Backend Setup (FastAPI)

1. Clone the repository
```bash
git clone https://github.com/Georjay/CodeBuddyAI.git
cd codebuddy-ai
```

2. Set up the backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. Set up environment variables
```bash
cp .env.example .env
# Add your API keys and configuration
```

4. Start the FastAPI server
```bash
uvicorn main:app --reload
```

### Frontend Setup (React)

1. Set up the frontend
```bash
cd frontend
npm install
```

2. Configure API endpoints
```bash
cp .env.example .env.local
# Update API base URL
```

3. Start the React development server
```bash
npm start
```

The application will be available at `http://localhost:3000`

## Usage

1. **Code Explanation**: Paste your code to get detailed, beginner-friendly explanations
2. **Debugging**: Submit code and error messages for AI analysis and solutions
3. **Optimization**: Get suggestions for improving code performance and readability
4. **Learning**: Understand how code works with step-by-step breakdowns

## API Endpoints

- `POST /api/explain` - Explain code functionality and structure
- `POST /api/debug` - Debug and fix code errors
- `POST /api/optimize` - Optimize existing code
- `GET /api/languages` - Get supported programming languages

## Environment Variables

```
OPENAI_API_KEY=your_openai_api_key
DATABASE_URL=your_database_url
FRONTEND_URL=http://localhost:3000
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Future Enhancements

- [ ] Code collaboration features
- [ ] Integration with popular IDEs
- [ ] Code snippet sharing and saving
- [ ] Advanced error pattern recognition

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- OpenAI for AI capabilities
- FastAPI for the robust backend framework
- React community for frontend resources
