import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { Queue } from 'bullmq';
import { OpenAIEmbeddings } from '@langchain/openai';
import { ChatGroq } from '@langchain/groq';
import { QdrantVectorStore } from '@langchain/qdrant';

/**
 * PDF-RAG Server Initialization:
 * Sets up Express app, BullMQ for async tasks, and Multer for file storage.
 */
const queue = new Queue('file-upload-queue', {
    connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
    },
});

/**
 * Storage Configuration:
 * Ensures uploaded files are saved locally with unique randomized filenames.
 */
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniquePrefix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `${uniquePrefix}-${file.originalname}`);
    },
});

const upload = multer({ storage: storage });

const app = express();
app.use(express.json());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000'
}));

app.get('/', (req, res) => {
    return res.json({ status: 'All Good!' });
});

/**
 * Upload Route (/upload/pdf):
 * Accepts a PDF file and dispatches a background job for text chunking.
 */
app.post('/upload/pdf', upload.single('pdf'), async (req, res) => {
    await queue.add(
        'file-ready',
        JSON.stringify({
            filename: req.file.originalname,
            destination: req.file.destination,
            path: req.file.path,
        })
    );
    return res.json({ message: 'uploaded' });
});

/**
 * Chat Route (/chat):
 * Retrieves relevant context from Qdrant vector store using user query.
 */
app.get('/chat', async (req, res) => {
    const userQuery = req.query.message;

    const embeddings = new OpenAIEmbeddings({
        model: 'jina-embeddings-v3',
        apiKey: process.env.JINA_API_KEY,
        configuration: {
            baseURL: 'https://api.jina.ai/v1',
        },
    });
    const vectorStore = await QdrantVectorStore.fromExistingCollection(
        embeddings,
        {
            url: process.env.QDRANT_URL || 'http://localhost:6333',
            collectionName: 'langchainjs-testing',
        }
    );
    const ret = vectorStore.asRetriever({
        k: 2,
    });
    const result = await ret.invoke(userQuery);

    const SYSTEM_PROMPT = `
  You are helfull AI Assistant who answeres the user query based on the available context from PDF File.
  Context:
  ${JSON.stringify(result)}
  `;

    /**
     * LLM Generation:
     * Uses Groq (Qwen 3.6 27B) to answer the user query based on retrieved docs.
     */
    const chatModel = new ChatGroq({
        model: 'qwen/qwen3.6-27b',
        apiKey: process.env.GROQ_API_KEY,
    });

    const chatResult = await chatModel.invoke([
        ['system', SYSTEM_PROMPT],
        ['user', userQuery],
    ]);

    return res.json({
        message: chatResult.content,
        docs: result,
    });
});

app.listen(8000, () => console.log(`Server started on PORT:${8000}`));