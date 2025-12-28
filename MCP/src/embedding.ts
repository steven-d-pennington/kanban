/**
 * OpenAI Embedding Service
 * Generates vector embeddings for text using OpenAI's text-embedding-ada-002 model
 */

import OpenAI from 'openai';
import crypto from 'crypto';

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Simple in-memory cache for embeddings (keyed by content hash)
const embeddingCache = new Map<string, number[]>();
const MAX_CACHE_SIZE = 1000;

/**
 * Generate a hash for text content (for caching)
 */
function hashText(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex').slice(0, 16);
}

/**
 * Clean and prepare text for embedding
 * - Removes excessive whitespace
 * - Truncates to max token limit (8191 tokens for ada-002)
 */
export function prepareTextForEmbedding(text: string): string {
    // Remove excessive whitespace
    let cleaned = text.replace(/\s+/g, ' ').trim();

    // Approximate token count (4 chars ≈ 1 token)
    const maxChars = 8191 * 4;
    if (cleaned.length > maxChars) {
        cleaned = cleaned.slice(0, maxChars);
    }

    return cleaned;
}

/**
 * Generate embedding for a single text
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    const prepared = prepareTextForEmbedding(text);
    const hash = hashText(prepared);

    // Check cache
    if (embeddingCache.has(hash)) {
        return embeddingCache.get(hash)!;
    }

    const response = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: prepared,
    });

    const embedding = response.data[0].embedding;

    // Add to cache (with size limit)
    if (embeddingCache.size >= MAX_CACHE_SIZE) {
        // Remove oldest entry
        const firstKey = embeddingCache.keys().next().value;
        if (firstKey) {
            embeddingCache.delete(firstKey);
        }
    }
    embeddingCache.set(hash, embedding);

    return embedding;
}

/**
 * Generate embeddings for multiple texts (batch processing)
 * OpenAI supports up to 2048 inputs per request
 */
export async function generateEmbeddingsBatch(
    texts: string[],
    options: { maxRetries?: number; retryDelay?: number } = {}
): Promise<number[][]> {
    const { maxRetries = 3, retryDelay = 1000 } = options;

    if (texts.length === 0) {
        return [];
    }

    // Prepare all texts and check cache
    const prepared = texts.map(prepareTextForEmbedding);
    const hashes = prepared.map(hashText);
    const results: (number[] | null)[] = new Array(texts.length).fill(null);
    const uncachedIndices: number[] = [];

    // Check cache for each text
    for (let i = 0; i < texts.length; i++) {
        const cached = embeddingCache.get(hashes[i]);
        if (cached) {
            results[i] = cached;
        } else {
            uncachedIndices.push(i);
        }
    }

    // If all cached, return early
    if (uncachedIndices.length === 0) {
        return results as number[][];
    }

    // Batch process uncached texts (max 100 at a time to be safe)
    const BATCH_SIZE = 100;
    for (let batchStart = 0; batchStart < uncachedIndices.length; batchStart += BATCH_SIZE) {
        const batchIndices = uncachedIndices.slice(batchStart, batchStart + BATCH_SIZE);
        const batchTexts = batchIndices.map(i => prepared[i]);

        let attempt = 0;
        while (attempt < maxRetries) {
            try {
                const response = await openai.embeddings.create({
                    model: 'text-embedding-ada-002',
                    input: batchTexts,
                });

                // Store results and update cache
                for (let j = 0; j < batchIndices.length; j++) {
                    const originalIndex = batchIndices[j];
                    const embedding = response.data[j].embedding;
                    results[originalIndex] = embedding;

                    // Add to cache
                    if (embeddingCache.size >= MAX_CACHE_SIZE) {
                        const firstKey = embeddingCache.keys().next().value;
                        if (firstKey) {
                            embeddingCache.delete(firstKey);
                        }
                    }
                    embeddingCache.set(hashes[originalIndex], embedding);
                }
                break; // Success, exit retry loop
            } catch (error: any) {
                attempt++;
                if (error?.status === 429 || error?.code === 'rate_limit_exceeded') {
                    // Rate limited - exponential backoff
                    const delay = retryDelay * Math.pow(2, attempt);
                    console.error(`Rate limited, retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                } else if (attempt >= maxRetries) {
                    throw error;
                } else {
                    // Other error - retry with delay
                    await new Promise(resolve => setTimeout(resolve, retryDelay));
                }
            }
        }
    }

    return results as number[][];
}

/**
 * Clear the embedding cache
 */
export function clearEmbeddingCache(): void {
    embeddingCache.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { size: number; maxSize: number } {
    return {
        size: embeddingCache.size,
        maxSize: MAX_CACHE_SIZE,
    };
}
