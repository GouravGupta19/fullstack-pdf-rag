import 'dotenv/config';
import { Worker } from 'bullmq';
import { OpenAIEmbeddings } from '@langchain/openai';
import { QdrantVectorStore } from '@langchain/qdrant';
import { Document } from '@langchain/core/documents';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { CharacterTextSplitter } from '@langchain/textsplitters';


const worker = new Worker('file-upload-queue', async job => {
    console.log(`Job:`, job.data);
    const data = JSON.parse(job.data);
    /**
     * WORKER PIPELINE:
     * 1. PDF Loader: Reads the uploaded PDF file from the local file system. 
     * 2. Text Splitter: Chunks the PDF into smaller, manageable text segments (1000 chars).
     *    This ensures we don't exceed embedding model token limits.
     * 3. Embeddings: Converts text chunks into vector representations using Jina AI API.
     * 4. Qdrant Vector Store: Saves the vectors locally for semantic similarity search.
     * 
     * This BullMQ worker processes jobs asynchronously to keep the main server responsive.
     */

    // Load the PDF
    const loader = new PDFLoader(data.path);
    const docs = await loader.load();

    const textSplitter = new CharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
    });
    const splitDocs = await textSplitter.splitDocuments(docs);

    const embeddings = new OpenAIEmbeddings({
        model: 'jina-embeddings-v3',
        apiKey: process.env.JINA_API_KEY,
        configuration: {
            baseURL: 'https://api.jina.ai/v1',
        },
    });

    try {
        const vectorStore = await QdrantVectorStore.fromDocuments(
            splitDocs,
            embeddings,
            {
                url: process.env.QDRANT_URL || 'http://localhost:6333',
                collectionName: 'langchainjs-testing',
            }
        );
        console.log(`All split docs are added to vector store`);
    } catch (error) {
        console.error("Error processing job:", error);
        throw error; // Re-throw so BullMQ knows the job failed
    }

}, {
    concurrency: 5,
    connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
    },
});

worker.on('failed', (job, err) => {
    console.log(`Job ${job.id} failed with error: ${err.message}`);
});
