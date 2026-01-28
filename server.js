import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import OpenAI from 'openai';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname));

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const { messages, sources } = req.body;

        if (!messages || messages.length === 0) {
            return res.status(400).json({ error: 'Messages are required' });
        }

        // Build context from sources
        let systemMessage = {
            role: 'system',
            content: 'You are a helpful AI study assistant for Quizlet. You help students understand and learn from their study materials. Be concise, clear, and educational.'
        };

        // Add source context if available
        if (sources && sources.length > 0) {
            const sourceContext = sources.map((source, idx) => {
                return `Source ${idx + 1} (${source.name}):\n${source.content || source.contentPreview || 'No content available'}`;
            }).join('\n\n---\n\n');

            systemMessage.content += `\n\nHere are the student's study materials:\n\n${sourceContext}\n\nAnswer questions based on these materials when relevant.`;
        }

        // Prepare messages for OpenAI
        const openAIMessages = [
            systemMessage,
            ...messages.map(msg => ({
                role: msg.role,
                content: msg.content
            }))
        ];

        // Call OpenAI API
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: openAIMessages,
            temperature: 0.7,
            max_tokens: 1000
        });

        const assistantMessage = completion.choices[0].message;

        res.json({
            message: assistantMessage,
            usage: completion.usage
        });

    } catch (error) {
        console.error('Chat API Error:', error);
        res.status(500).json({ 
            error: 'Failed to process chat request',
            details: error.message 
        });
    }
});

// Generate study materials endpoint
app.post('/api/generate-study-material', async (req, res) => {
    try {
        const { type, sources } = req.body;

        if (!type || !sources || sources.length === 0) {
            return res.status(400).json({ error: 'Type and sources are required' });
        }

        // Build context from sources
        const sourceContext = sources.map((source, idx) => {
            return `Source ${idx + 1} (${source.name}):\n${source.content || source.contentPreview || 'No content available'}`;
        }).join('\n\n---\n\n');

        let prompt = '';
        
        switch(type) {
            case 'flashcards':
                prompt = `Based on the following study materials, generate 10-15 flashcards with terms and definitions. Format as JSON array with objects containing "term" and "definition" fields.\n\nMaterials:\n${sourceContext}`;
                break;
            case 'quiz':
                prompt = `Based on the following study materials, generate 5 multiple choice quiz questions. Format as JSON array with objects containing "question", "options" (array of 4 choices), and "correctAnswer" (index 0-3).\n\nMaterials:\n${sourceContext}`;
                break;
            case 'summary':
                prompt = `Provide a comprehensive summary of the following study materials. Include key concepts, main ideas, and important details.\n\nMaterials:\n${sourceContext}`;
                break;
            case 'mind-map':
                prompt = `Based on the following study materials, create a mind map structure. Format as JSON with a central topic and branches with subtopics and key points.\n\nMaterials:\n${sourceContext}`;
                break;
            default:
                return res.status(400).json({ error: 'Invalid material type' });
        }

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert educational content creator. Generate high-quality study materials that help students learn effectively.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 2000
        });

        const content = completion.choices[0].message.content;

        res.json({
            type,
            content,
            usage: completion.usage
        });

    } catch (error) {
        console.error('Study Material Generation Error:', error);
        res.status(500).json({ 
            error: 'Failed to generate study material',
            details: error.message 
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`💬 Q-Chat with OpenAI ready!`);
    console.log(`🔑 OpenAI API Key: ${process.env.OPENAI_API_KEY ? '✓ Loaded' : '✗ Missing'}`);
});
