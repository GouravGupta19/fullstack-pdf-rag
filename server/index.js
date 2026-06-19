import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { Queue } from 'bullmq';
import { GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { QdrantVectorStore } from '@langchain/qdrant';

/**
 * PDF-RAG Server Initialization:
 * Sets up Express app, BullMQ for async tasks, and Multer for file storage.
 */
const queue = new Queue('file-upload-queue', {
    connection: {
        host: 'localhost',
        port: '6379',
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
app.use(cors());

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

    const embeddings = new GoogleGenerativeAIEmbeddings({
        model: 'text-embedding-004',
        apiKey: process.env.GEMINI_API_KEY,
    });
    const vectorStore = await QdrantVectorStore.fromExistingCollection(
        embeddings,
        {
            url: 'http://localhost:6333',
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
     * Uses Gemini 1.5 Flash to answer the user query based on retrieved docs.
     */
    const chatModel = new ChatGoogleGenerativeAI({
        model: 'gemini-1.5-flash',
        apiKey: process.env.GEMINI_API_KEY,
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