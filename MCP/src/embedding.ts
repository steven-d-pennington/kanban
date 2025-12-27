/**
 * OpenAI Embedding Service
 * Provides text embedding generation for semantic search using OpenAI's ada-002 model
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOG_FILE = path.resolve(__dirname, '../../debug.log');

function log(msg: string) {
    try {
        fs.appendFileSync(LOG_FILE, `[EMBEDDING] ${msg}\n`);
    } catch (e) {
        // ignore logging errors
    }
}

/**
 * Generate embedding for a text string using OpenAI's text-embedding-ada-002 model
 * @param text The text to embed
 * @returns Vector embedding (1536 dimensions)
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        log('ERROR: OPENAI_API_KEY not set in environment');
        throw new Error('OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.');
    }

    try {
        log(`Generating embedding for text (${text.length} chars)`);

        const response = await fetch('https://api.openai.com/v1/embeddings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'text-embedding-ada-002',
                input: text,
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            log(`OpenAI API error: ${response.status} - ${errorText}`);
            throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();

        if (!data.data || !data.data[0] || !data.data[0].embedding) {
            log('Invalid response from OpenAI API');
            throw new Error('Invalid response from OpenAI API');
        }

        const embedding = data.data[0].embedding;
        log(`Embedding generated successfully (${embedding.length} dimensions)`);

        return embedding;
    } catch (error: any) {
        log(`Error generating embedding: ${error.message}`);
        throw error;
    }
}

/**
 * Generate embeddings for multiple texts in a batch
 * @param texts Array of texts to embed
 * @returns Array of vector embeddings
 */
export async function generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        log('ERROR: OPENAI_API_KEY not set in environment');
        throw new Error('OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.');
    }

    try {
        log(`Generating embeddings for ${texts.length} texts in batch`);

        const response = await fetch('https://api.openai.com/v1/embeddings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'text-embedding-ada-002',
                input: texts,
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            log(`OpenAI API error: ${response.status} - ${errorText}`);
            throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();

        if (!data.data || !Array.isArray(data.data)) {
            log('Invalid response from OpenAI API');
            throw new Error('Invalid response from OpenAI API');
        }

        const embeddings = data.data.map((item: any) => item.embedding);
        log(`Batch embeddings generated successfully (${embeddings.length} embeddings)`);

        return embeddings;
    } catch (error: any) {
        log(`Error generating batch embeddings: ${error.message}`);
        throw error;
    }
}

/**
 * Prepare text for embedding by concatenating title and content
 * @param title The title of the memory
 * @param content The content of the memory
 * @returns Combined text suitable for embedding
 */
export function prepareTextForEmbedding(title: string, content: string): string {
    // Concatenate title and content with a separator
    // This gives more weight to the title while maintaining context from content
    return `${title}\n\n${content}`;
}
