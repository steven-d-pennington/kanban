import OpenAI from 'openai';
import crypto from 'crypto';

// Constants
const EMBEDDING_MODEL = 'text-embedding-ada-002';
const EMBEDDING_DIMENSION = 1536;
const MAX_BATCH_SIZE = 100;
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000;

// Cache structure: content hash -> embedding vector
const embeddingCache = new Map<string, number[]>();

/**
 * Generate a hash of text content for caching
 */
function hashContent(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex');
}

/**
 * Exponential backoff with jitter
 */
function calculateBackoff(attempt: number): number {
    const backoff = INITIAL_BACKOFF_MS * Math.pow(2, attempt);
    const jitter = Math.random() * backoff * 0.1; // Add 10% jitter
    return backoff + jitter;
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export class EmbeddingService {
    private client: OpenAI;

    constructor(apiKey?: string) {
        const key = apiKey || process.env.OPENAI_API_KEY;
        if (!key) {
            throw new Error('OPENAI_API_KEY environment variable is required');
        }
        this.client = new OpenAI({ apiKey: key });
    }

    /**
     * Generate embedding for a single text
     */
    async generateEmbedding(text: string): Promise<number[]> {
        const hash = hashContent(text);

        // Check cache first
        if (embeddingCache.has(hash)) {
            return embeddingCache.get(hash)!;
        }

        // Generate new embedding with retry logic
        const embedding = await this.generateEmbeddingWithRetry(text);

        // Cache the result
        embeddingCache.set(hash, embedding);

        return embedding;
    }

    /**
     * Generate embeddings for multiple texts (batch processing)
     * Supports up to 100 texts per batch
     */
    async generateEmbeddings(texts: string[]): Promise<number[][]> {
        if (texts.length === 0) {
            return [];
        }

        if (texts.length > MAX_BATCH_SIZE) {
            throw new Error(`Batch size exceeds maximum of ${MAX_BATCH_SIZE} texts`);
        }

        // Check cache and separate cached vs uncached texts
        const results: (number[] | null)[] = new Array(texts.length).fill(null);
        const uncachedIndices: number[] = [];
        const uncachedTexts: string[] = [];

        texts.forEach((text, index) => {
            const hash = hashContent(text);
            if (embeddingCache.has(hash)) {
                results[index] = embeddingCache.get(hash)!;
            } else {
                uncachedIndices.push(index);
                uncachedTexts.push(text);
            }
        });

        // If all are cached, return immediately
        if (uncachedTexts.length === 0) {
            return results as number[][];
        }

        // Generate embeddings for uncached texts
        const newEmbeddings = await this.generateEmbeddingsWithRetry(uncachedTexts);

        // Store in cache and results
        newEmbeddings.forEach((embedding, i) => {
            const originalIndex = uncachedIndices[i];
            const text = uncachedTexts[i];
            const hash = hashContent(text);

            embeddingCache.set(hash, embedding);
            results[originalIndex] = embedding;
        });

        return results as number[][];
    }

    /**
     * Generate embedding with retry logic and exponential backoff
     */
    private async generateEmbeddingWithRetry(text: string): Promise<number[]> {
        let lastError: Error | null = null;

        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            try {
                const response = await this.client.embeddings.create({
                    model: EMBEDDING_MODEL,
                    input: text,
                });

                if (!response.data || response.data.length === 0) {
                    throw new Error('No embedding data returned from API');
                }

                const embedding = response.data[0].embedding;

                // Validate embedding dimension
                if (embedding.length !== EMBEDDING_DIMENSION) {
                    throw new Error(
                        `Expected ${EMBEDDING_DIMENSION} dimensions, got ${embedding.length}`
                    );
                }

                return embedding;
            } catch (error: any) {
                lastError = error;

                // Check if it's a rate limit error
                const isRateLimit = error.status === 429 ||
                                   error.code === 'rate_limit_exceeded' ||
                                   error.message?.toLowerCase().includes('rate limit');

                // If it's the last attempt or not a rate limit error, don't retry
                if (attempt === MAX_RETRIES - 1 || !isRateLimit) {
                    break;
                }

                // Wait before retrying
                const backoffMs = calculateBackoff(attempt);
                await sleep(backoffMs);
            }
        }

        throw new Error(
            `Failed to generate embedding after ${MAX_RETRIES} attempts: ${lastError?.message || 'Unknown error'}`
        );
    }

    /**
     * Generate embeddings for batch with retry logic
     */
    private async generateEmbeddingsWithRetry(texts: string[]): Promise<number[][]> {
        let lastError: Error | null = null;

        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            try {
                const response = await this.client.embeddings.create({
                    model: EMBEDDING_MODEL,
                    input: texts,
                });

                if (!response.data || response.data.length === 0) {
                    throw new Error('No embedding data returned from API');
                }

                // Sort by index to ensure correct order
                const sortedData = response.data.sort((a, b) => a.index - b.index);

                const embeddings = sortedData.map(item => {
                    const embedding = item.embedding;

                    // Validate embedding dimension
                    if (embedding.length !== EMBEDDING_DIMENSION) {
                        throw new Error(
                            `Expected ${EMBEDDING_DIMENSION} dimensions, got ${embedding.length}`
                        );
                    }

                    return embedding;
                });

                if (embeddings.length !== texts.length) {
                    throw new Error(
                        `Expected ${texts.length} embeddings, got ${embeddings.length}`
                    );
                }

                return embeddings;
            } catch (error: any) {
                lastError = error;

                // Check if it's a rate limit error
                const isRateLimit = error.status === 429 ||
                                   error.code === 'rate_limit_exceeded' ||
                                   error.message?.toLowerCase().includes('rate limit');

                // If it's the last attempt or not a rate limit error, don't retry
                if (attempt === MAX_RETRIES - 1 || !isRateLimit) {
                    break;
                }

                // Wait before retrying
                const backoffMs = calculateBackoff(attempt);
                await sleep(backoffMs);
            }
        }

        throw new Error(
            `Failed to generate embeddings after ${MAX_RETRIES} attempts: ${lastError?.message || 'Unknown error'}`
        );
    }

    /**
     * Clear the embedding cache
     */
    clearCache(): void {
        embeddingCache.clear();
    }

    /**
     * Get cache size
     */
    getCacheSize(): number {
        return embeddingCache.size;
    }

    /**
     * Get embedding model information
     */
    getModelInfo(): { model: string; dimension: number; maxBatchSize: number } {
        return {
            model: EMBEDDING_MODEL,
            dimension: EMBEDDING_DIMENSION,
            maxBatchSize: MAX_BATCH_SIZE,
        };
    }
}

// Export a singleton instance
let embeddingService: EmbeddingService | null = null;

export function getEmbeddingService(): EmbeddingService {
    if (!embeddingService) {
        embeddingService = new EmbeddingService();
    }
    return embeddingService;
}
