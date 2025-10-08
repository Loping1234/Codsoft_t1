import { geminiService } from '../lib/gemini';
import type { Document } from '../types/database';

/**
 * Enhanced Content Processor using Gemini AI
 * Provides NLP capabilities similar to Python transformers but via API
 */

export interface ProcessedContent {
  documentId: string;
  rawText: string;
  cleanedText: string;
  entities: Entity[];
  concepts: Concept[];
  relationships: Relationship[];
  semanticChunks: SemanticChunk[];
  metadata: ContentMetadata;
}

export interface Entity {
  text: string;
  type: 'PERSON' | 'ORGANIZATION' | 'LOCATION' | 'DATE' | 'CONCEPT' | 'TERM';
  context: string;
  importance: number; // 1-10
}

export interface Concept {
  name: string;
  description: string;
  relatedTerms: string[];
  importance: number;
}

export interface Relationship {
  subject: string;
  predicate: string;
  object: string;
  sentence: string;
  type: 'causal' | 'hierarchical' | 'temporal' | 'definitional';
}

export interface SemanticChunk {
  id: string;
  content: string;
  topic: string;
  startIndex: number;
  endIndex: number;
  concepts: string[];
}

export interface ContentMetadata {
  wordCount: number;
  readingLevel: string;
  topics: string[];
  keyTerms: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

export class ContentProcessor {
  /**
   * Process a document through multiple stages
   */
  async processDocument(document: Document, content: string): Promise<ProcessedContent> {
    console.log('Starting content processing pipeline...');

    // Stage 1: Text Cleaning
    const cleanedText = this.cleanText(content);

    // Stage 2: Content Analysis via Gemini
    const analysis = await this.analyzeContentWithGemini(cleanedText);

    // Stage 3: Semantic Chunking
    const chunks = await this.semanticChunk(cleanedText, analysis.topics);

    // Stage 4: Build relationships
    const relationships = await this.extractRelationships(cleanedText, analysis.entities);

    const processed: ProcessedContent = {
      documentId: document.id,
      rawText: content,
      cleanedText,
      entities: analysis.entities,
      concepts: analysis.concepts,
      relationships,
      semanticChunks: chunks,
      metadata: {
        wordCount: cleanedText.split(/\s+/).length,
        readingLevel: analysis.readingLevel,
        topics: analysis.topics,
        keyTerms: analysis.keyTerms,
        difficulty: analysis.difficulty,
      },
    };

    console.log('Content processing complete:', {
      entities: processed.entities.length,
      concepts: processed.concepts.length,
      relationships: processed.relationships.length,
      chunks: processed.semanticChunks.length,
    });

    return processed;
  }

  /**
   * Clean and normalize text
   */
  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[^\w\s.,!?;:()\-'"]/g, '') // Remove special chars
      .trim();
  }

  /**
   * Use Gemini AI to analyze content and extract NLP features
   */
  private async analyzeContentWithGemini(text: string): Promise<{
    entities: Entity[];
    concepts: Concept[];
    topics: string[];
    keyTerms: string[];
    readingLevel: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  }> {
    const prompt = `
Analyze this educational content and extract key information:

CONTENT:
${text.substring(0, 20000)}

Provide a JSON response with:
1. **entities**: Named entities (people, organizations, locations, dates, key terms)
2. **concepts**: Main concepts with descriptions
3. **relationships**: Subject-predicate-object relationships
4. **topics**: High-level topics covered
5. **keyTerms**: Most important terms/vocabulary
6. **readingLevel**: Estimated reading level (elementary, high school, college, graduate)
7. **difficulty**: Overall difficulty (beginner, intermediate, advanced, expert)

Format:
{
  "entities": [
    {"text": "Entity Name", "type": "PERSON|ORGANIZATION|LOCATION|DATE|CONCEPT", "context": "surrounding text", "importance": 1-10}
  ],
  "concepts": [
    {"name": "Concept Name", "description": "Brief description", "relatedTerms": ["term1", "term2"], "importance": 1-10}
  ],
  "topics": ["Topic 1", "Topic 2"],
  "keyTerms": ["term1", "term2"],
  "readingLevel": "college",
  "difficulty": "intermediate"
}

Return ONLY valid JSON.
    `;

    try {
      const response = await geminiService.generateText(prompt);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      throw new Error('No valid JSON in response');
    } catch (error) {
      console.error('Content analysis error:', error);
      
      // Fallback: Basic analysis
      return {
        entities: [],
        concepts: [],
        topics: ['General'],
        keyTerms: [],
        readingLevel: 'college',
        difficulty: 'intermediate',
      };
    }
  }

  /**
   * Semantic chunking - group related content
   */
  private async semanticChunk(text: string, topics: string[]): Promise<SemanticChunk[]> {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    const chunks: SemanticChunk[] = [];
    
    let currentChunk: string[] = [];
    let startIndex = 0;

    for (let i = 0; i < sentences.length; i++) {
      currentChunk.push(sentences[i]);

      // Create chunk every 5-7 sentences or at topic boundary
      if (currentChunk.length >= 5 || i === sentences.length - 1) {
        const chunkText = currentChunk.join(' ');
        chunks.push({
          id: `chunk_${chunks.length + 1}`,
          content: chunkText,
          topic: topics[chunks.length % topics.length] || 'General',
          startIndex,
          endIndex: startIndex + chunkText.length,
          concepts: [], // Will be populated later
        });

        startIndex += chunkText.length;
        currentChunk = [];
      }
    }

    return chunks;
  }

  /**
   * Extract relationships using Gemini
   */
  private async extractRelationships(
    text: string,
    entities: Entity[]
  ): Promise<Relationship[]> {
    if (entities.length === 0) return [];

    const prompt = `
Extract key relationships from this text:

${text.substring(0, 10000)}

Focus on these entities: ${entities.map(e => e.text).join(', ')}

Return relationships in JSON format:
{
  "relationships": [
    {"subject": "X", "predicate": "causes", "object": "Y", "sentence": "...", "type": "causal"}
  ]
}

Types: causal, hierarchical, temporal, definitional
Return ONLY valid JSON.
    `;

    try {
      const response = await geminiService.generateText(prompt);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        return data.relationships || [];
      }
    } catch (error) {
      console.error('Relationship extraction error:', error);
    }

    return [];
  }

  /**
   * Store processed content in Supabase
   */
  async storeProcessedContent(content: ProcessedContent): Promise<void> {
    // This would use your database API to store the processed content
    console.log('Storing processed content:', content.documentId);
    
    // Example: Store in documents table
    // await databaseApi.updateDocument(content.documentId, {
    //   processed_content: content,
    //   content_metadata: content.metadata
    // });
  }
}

export const contentProcessor = new ContentProcessor();
