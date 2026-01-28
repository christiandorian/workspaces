# Q-Chat - Quizlet AI Study Assistant

A NotebookLM-inspired AI-powered study assistant built with OpenAI integration.

## Features

- 📚 **Upload Study Materials** - PDF, TXT, DOC, DOCX, MD files
- 💬 **AI Chat** - Ask questions about your study materials
- 📖 **Study Material Generation** - Flashcards, quizzes, summaries, mind maps
- 🎯 **Source Selection** - Choose which materials to focus on
- 💾 **Local Storage** - All data persists in your browser

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure OpenAI API Key

1. Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Open the `.env` file in the project root
3. Replace `your-openai-api-key-here` with your actual API key:

```env
OPENAI_API_KEY=sk-...your-actual-key-here
```

### 3. Start the Server

```bash
npm start
```

The app will be available at **http://localhost:3000**

## Usage

### Upload Sources
1. Click "Add sources" in the left sidebar
2. Select PDF, text, or document files
3. Files will appear in the Sources section
4. Click sources to select/deselect them for the AI

### Chat with AI
1. Select one or more sources
2. Type your question in the chat input
3. Press Enter or click the send button
4. The AI will respond based on your selected materials

### Generate Study Materials
1. Select sources you want to use
2. Click on any study mode card (Flashcards, Quiz, etc.)
3. The AI will generate the material based on your sources
4. Generated materials are saved automatically

## API Endpoints

### POST `/api/chat`
Send chat messages and get AI responses.

**Request:**
```json
{
  "messages": [
    { "role": "user", "content": "What is photosynthesis?" }
  ],
  "sources": [
    { "name": "bio-notes.txt", "content": "..." }
  ]
}
```

**Response:**
```json
{
  "message": {
    "role": "assistant",
    "content": "Photosynthesis is..."
  },
  "usage": { ... }
}
```

### POST `/api/generate-study-material`
Generate study materials from sources.

**Request:**
```json
{
  "type": "flashcards",
  "sources": [
    { "name": "notes.txt", "content": "..." }
  ]
}
```

**Supported types:**
- `flashcards` - Generate flashcard sets
- `quiz` - Generate multiple choice quizzes
- `summary` - Create comprehensive summaries
- `mind-map` - Generate mind map structures

## Tech Stack

- **Frontend:** Vanilla JavaScript, Quizlet Design System
- **Backend:** Express.js, Node.js
- **AI:** OpenAI GPT-4o-mini
- **Icons:** Material Icons Outlined
- **Storage:** Browser LocalStorage

## Development

The project uses ES modules and includes:
- Hot reload on file changes
- Environment variable management
- CORS enabled for API calls
- JSON body parsing (10MB limit)

## License

MIT
