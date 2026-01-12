"use server";

import { db } from "@/db";
import { entries } from "@/db/schema";
import { eq, sql, ilike, or, desc } from "drizzle-orm";
import { OpenAIIntelligenceService } from "./openai-intelligence";
import { StructuredData } from "./types";

export interface SearchResult {
    id: string;
    transcript: string;
    structuredData: StructuredData;
    createdAt: Date;
    score: number;
    matchType: "semantic" | "lexical" | "hybrid";
}

const intelligenceService = new OpenAIIntelligenceService();

export async function searchEntries(
    userId: string,
    query: string
): Promise<SearchResult[]> {
    if (!query.trim()) {
        return [];
    }

    console.log(`[Search] Searching for "${query}" for user ${userId}`);

    // Generate embedding for the query
    let queryEmbedding: number[] | null = null;
    try {
        queryEmbedding = await intelligenceService.createEmbedding(query);
    } catch (error) {
        console.warn("[Search] Failed to create embedding, falling back to lexical only:", error);
    }

    const results: SearchResult[] = [];
    const seenIds = new Set<string>();

    // 1. Semantic search (if embedding available)
    if (queryEmbedding) {
        try {
            const vectorQuery = `[${queryEmbedding.join(",")}]`;

            const semanticResults = await db.execute(sql`
                SELECT 
                    id,
                    transcript,
                    structured_data,
                    created_at,
                    1 - (embedding <=> ${vectorQuery}::vector) as similarity
                FROM entries
                WHERE user_id = ${userId}
                    AND embedding IS NOT NULL
                ORDER BY embedding <=> ${vectorQuery}::vector
                LIMIT 10
            `);

            for (const row of semanticResults.rows as any[]) {
                if (row.similarity > 0.3) { // Threshold for relevance
                    seenIds.add(row.id);
                    results.push({
                        id: row.id,
                        transcript: row.transcript,
                        structuredData: row.structured_data as StructuredData,
                        createdAt: new Date(row.created_at),
                        score: row.similarity,
                        matchType: "semantic",
                    });
                }
            }
        } catch (error) {
            console.warn("[Search] Tensor search failed (likely pgvector not enabled), skipping:", error);
            // Continue to lexical search
        }
    }

    // 2. Lexical search (always run)
    const lexicalResults = await db
        .select({
            id: entries.id,
            transcript: entries.transcript,
            structuredData: entries.structuredData,
            createdAt: entries.createdAt,
        })
        .from(entries)
        .where(
            sql`${entries.userId} = ${userId} AND (
                ${entries.transcript} ILIKE ${`%${query}%`} OR
                ${entries.structuredData}->>'content' ILIKE ${`%${query}%`} OR
                ${entries.structuredData}->>'tags' ILIKE ${`%${query}%`}
            )`
        )
        .orderBy(desc(entries.createdAt))
        .limit(10);

    for (const row of lexicalResults) {
        if (!seenIds.has(row.id)) {
            seenIds.add(row.id);
            const existingIndex = results.findIndex(r => r.id === row.id);

            if (existingIndex >= 0) {
                // Boost score for hybrid match
                results[existingIndex].score += 0.2;
                results[existingIndex].matchType = "hybrid";
            } else {
                results.push({
                    id: row.id,
                    transcript: row.transcript,
                    structuredData: row.structuredData as StructuredData,
                    createdAt: row.createdAt,
                    score: 0.5, // Base score for lexical
                    matchType: "lexical",
                });
            }
        }
    }

    // Sort by score descending
    results.sort((a, b) => b.score - a.score);

    console.log(`[Search] Found ${results.length} results`);
    return results.slice(0, 15);
}

// Generate and store embedding for an entry
export async function generateEntryEmbedding(entryId: string): Promise<void> {
    const entry = await db
        .select({
            id: entries.id,
            structuredData: entries.structuredData,
        })
        .from(entries)
        .where(eq(entries.id, entryId))
        .limit(1);

    if (!entry[0]) {
        throw new Error("Entry not found");
    }

    const structured = entry[0].structuredData as StructuredData;
    const textToEmbed = `${structured.content} ${structured.tags?.join(" ") || ""}`;

    try {
        const embedding = await intelligenceService.createEmbedding(textToEmbed);

        await db.execute(sql`
            UPDATE entries
            SET embedding = ${`[${embedding.join(",")}]`}::vector
            WHERE id = ${entryId}
        `);

        console.log(`[Search] Generated embedding for entry ${entryId}`);
    } catch (error) {
        console.warn("[Search] Failed to generate/save embedding (likely pgvector missing):", error);
    }
}
