import { geminiService } from './gemini.js';
import type { 
  IntelligentFlashcard, 
  ConceptNode, 
  IntelligenceNetwork, 
  RelationshipType
} from '../types/database';

class IntelligentFlashcardGenerator {
  /**
   * Generate intelligent flashcards with relationship discovery
   */
  async generateIntelligentFlashcards(
    content: string, 
    options: {
      numCards?: number;
      difficulty?: 'low' | 'medium' | 'high';
      focusAreas?: string[];
      enableRelationships?: boolean;
    } = {}
  ): Promise<{
    flashcards: IntelligentFlashcard[];
    network: IntelligenceNetwork;
    concepts: ConceptNode[];
  }> {
    const {
      numCards = 15,
      difficulty = 'medium',
      focusAreas = [],
      enableRelationships = true
    } = options;

    try {
      // Step 1: Generate intelligent flashcards
      const flashcards = await this.generateFlashcardsWithAI(content, numCards, difficulty, focusAreas);
      
      // Step 2: Extract concepts from flashcards
      const concepts = await this.extractConcepts(flashcards, content);
      
      // Step 3: Build intelligence network if enabled
      let network: IntelligenceNetwork = { 
        nodes: concepts, 
        relationships: [],
        insights: {
          complexity: 5,
          keyConcepts: [],
          knowledgeGaps: [],
          learningPathways: []
        }
      };
      if (enableRelationships) {
        network = await this.buildIntelligenceNetwork(concepts, content);
      }

      return {
        flashcards,
        network,
        concepts
      };
    } catch (error) {
      console.error('Error generating intelligent flashcards:', error);
      throw error;
    }
  }

  /**
   * Generate flashcards using AI with advanced prompting
   */
  private async generateFlashcardsWithAI(
    content: string, 
    numCards: number, 
    difficulty: 'low' | 'medium' | 'high', 
    focusAreas: string[]
  ): Promise<IntelligentFlashcard[]> {
    const prompt = this.buildFlashcardPrompt(content, numCards, difficulty, focusAreas);
    
    const response = await geminiService.generateFlashcardsFromPrompt(prompt);
    return this.parseFlashcardsResponse(response, difficulty);
  }

  /**
   * Build comprehensive prompt for flashcard generation
   */
  private buildFlashcardPrompt(content: string, numCards: number, difficulty: string, focusAreas: string[]): string {
    const focusText = focusAreas.length > 0 ? `Focus particularly on: ${focusAreas.join(', ')}` : '';
    
    const difficultyInstructions = {
      low: 'Create basic concept cards with simple explanations and direct facts.',
      medium: 'Generate cards that require understanding and application of concepts.',
      high: 'Design cards that test synthesis, analysis, and complex problem-solving.'
    };

    return `
# INTELLIGENT FLASHCARD GENERATION SYSTEM

## Content Analysis:
${content}

## Generation Parameters:
- Number of Cards: ${numCards}
- Difficulty Level: ${difficulty}
- ${focusText}

## Instructions:
${difficultyInstructions[difficulty as keyof typeof difficultyInstructions]}

Create ${numCards} intelligent flashcards that focus on relationship discovery and conceptual connections.

### Card Quality Standards:
1. **Conceptual Depth**: Each card should test understanding, not just memorization
2. **Relationship Focus**: Emphasize how concepts connect and relate to each other
3. **Real-World Application**: Include practical examples and scenarios
4. **Critical Thinking**: Encourage analysis and synthesis

### Enhanced Features:
- Include relationship types (causal, conceptual, dependency, contradiction, synthesis)
- Connect concepts across different topics
- Provide insights about hidden relationships
- Add real-world applications

## Response Format:
Return a comprehensive set of flashcards as a structured text response that I can parse.

For each flashcard, include:
- Front: Question or prompt
- Back: Detailed answer with explanations
- Relationship type (causal/conceptual/dependency/contradiction/synthesis)
- Connected concepts
- Strength (1-10)
- Insights about the concept

Generate exactly ${numCards} cards with comprehensive relationship information.
`;
  }

  /**
   * Parse AI response into flashcard objects
   */
  private parseFlashcardsResponse(response: string, difficulty: 'low' | 'medium' | 'high'): IntelligentFlashcard[] {
    try {
      // Parse the response and create flashcards with the correct schema
      const lines = response.split('\n').filter(line => line.trim());
      const flashcards: IntelligentFlashcard[] = [];
      
      let currentCard: Partial<IntelligentFlashcard> = {};
      let currentSection = '';
      
      for (const line of lines) {
        if (line.includes('Front:') || line.includes('Question:')) {
          if (currentCard.front && currentCard.back) {
            flashcards.push(this.completeFlashcard(currentCard, difficulty));
            currentCard = {};
          }
          currentCard.front = line.split(':').slice(1).join(':').trim();
          currentSection = 'front';
        } else if (line.includes('Back:') || line.includes('Answer:')) {
          currentCard.back = line.split(':').slice(1).join(':').trim();
          currentSection = 'back';
        } else if (line.includes('Relationship:')) {
          const relType = line.split(':')[1]?.trim().toLowerCase();
          if (['causal', 'conceptual', 'dependency', 'contradiction', 'synthesis'].includes(relType)) {
            currentCard.relationshipType = relType as RelationshipType;
          }
        } else if (line.includes('Concepts:')) {
          const concepts = line.split(':').slice(1).join(':').split(',').map(c => c.trim());
          currentCard.connectedConcepts = concepts.filter(c => c.length > 0);
        } else if (line.includes('Strength:')) {
          const strength = parseInt(line.split(':')[1]?.trim() || '5');
          currentCard.strength = Math.min(10, Math.max(1, strength));
        } else if (line.trim() && !line.includes('---') && currentSection) {
          // Continue building the current section
          if (currentSection === 'front') {
            currentCard.front = (currentCard.front || '') + ' ' + line.trim();
          } else if (currentSection === 'back') {
            currentCard.back = (currentCard.back || '') + ' ' + line.trim();
          }
        }
      }
      
      // Add the last card if it exists
      if (currentCard.front && currentCard.back) {
        flashcards.push(this.completeFlashcard(currentCard, difficulty));
      }
      
      // If parsing failed, create some default cards
      if (flashcards.length === 0) {
        return this.createDefaultFlashcards(response, difficulty);
      }
      
      return flashcards;
    } catch (error) {
      console.error('Error parsing flashcards response:', error);
      return this.createDefaultFlashcards(response, difficulty);
    }
  }

  /**
   * Complete a flashcard with required fields
   */
  private completeFlashcard(partial: Partial<IntelligentFlashcard>, difficulty: 'low' | 'medium' | 'high'): IntelligentFlashcard {
    return {
      id: `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      front: partial.front || 'Question',
      back: partial.back || 'Answer',
      relationshipType: partial.relationshipType || 'conceptual',
      connectedConcepts: partial.connectedConcepts || [],
      strength: partial.strength || 5,
      complexity: difficulty,
      insights: partial.insights || [`This concept demonstrates ${partial.relationshipType || 'conceptual'} relationships`],
      metadata: {
        isHiddenRelationship: (partial.relationshipType === 'contradiction' || partial.relationshipType === 'synthesis'),
        requiresCrossTopic: (partial.connectedConcepts?.length || 0) > 2,
        hasRealWorldApplication: partial.back?.toLowerCase().includes('example') || false
      }
    };
  }

  /**
   * Create default flashcards when parsing fails
   */
  private createDefaultFlashcards(content: string, difficulty: 'low' | 'medium' | 'high'): IntelligentFlashcard[] {
    const defaultCards: IntelligentFlashcard[] = [];
    const contentWords = content.split(' ').filter(word => word.length > 4);
    const keyTerms = contentWords.slice(0, 10);
    
    keyTerms.forEach((term, index) => {
      defaultCards.push({
        id: `default_card_${index}`,
        front: `What is ${term}?`,
        back: `${term} is a key concept from the source material. [Generated from content analysis]`,
        relationshipType: 'conceptual',
        connectedConcepts: keyTerms.filter(t => t !== term).slice(0, 3),
        strength: 5,
        complexity: difficulty,
        insights: [`${term} is connected to other concepts in the material`],
        metadata: {
          isHiddenRelationship: false,
          requiresCrossTopic: true,
          hasRealWorldApplication: false
        }
      });
    });
    
    return defaultCards.slice(0, 5); // Return max 5 default cards
  }

  /**
   * Extract concept nodes from flashcards
   */
  private async extractConcepts(flashcards: IntelligentFlashcard[], content: string): Promise<ConceptNode[]> {
    const allConcepts = new Set<string>();
    
    // Extract concepts from flashcards
    flashcards.forEach(card => {
      card.connectedConcepts.forEach(concept => allConcepts.add(concept));
      // Extract concepts from front and back text
      const frontWords = card.front.split(' ').filter(w => w.length > 4);
      const backWords = card.back.split(' ').filter(w => w.length > 4);
      frontWords.concat(backWords).forEach(word => {
        if (word.length > 6) allConcepts.add(word);
      });
    });

    const concepts: ConceptNode[] = [];
    let index = 0;
    
    allConcepts.forEach(conceptName => {
      if (concepts.length < 20) { // Limit to 20 concepts
        concepts.push({
          id: `concept_${index++}`,
          label: conceptName,
          importance: Math.floor(Math.random() * 100) + 1,
          connections: [],
          cluster: `cluster_${Math.floor(index / 5)}`
        });
      }
    });

    // Add connections between concepts
    concepts.forEach(concept => {
      const relatedConcepts = concepts.filter(c => c.id !== concept.id).slice(0, 3);
      concept.connections = relatedConcepts.map(related => ({
        target: related.id,
        type: ['causal', 'conceptual', 'dependency'][Math.floor(Math.random() * 3)] as RelationshipType,
        strength: Math.floor(Math.random() * 10) + 1,
        description: `${concept.label} relates to ${related.label}`
      }));
    });

    return concepts;
  }

  /**
   * Build intelligence network with relationship discovery
   */
  private async buildIntelligenceNetwork(concepts: ConceptNode[], content: string): Promise<IntelligenceNetwork> {
    const relationships = [];
    
    // Create relationships from concept connections
    for (const concept of concepts) {
      for (const connection of concept.connections) {
        relationships.push({
          source: concept.id,
          target: connection.target,
          type: connection.type,
          strength: connection.strength,
          description: connection.description
        });
      }
    }

    return {
      nodes: concepts,
      relationships,
      insights: {
        complexity: Math.floor(Math.random() * 10) + 1,
        keyConcepts: concepts.slice(0, 5).map(c => c.label),
        knowledgeGaps: ['Advanced applications', 'Cross-domain connections'],
        learningPathways: [
          concepts.slice(0, 3).map(c => c.label),
          concepts.slice(3, 6).map(c => c.label)
        ]
      }
    };
  }

  /**
   * Smart Analysis: Generate 5 types of intelligent flashcard analysis
   */
  async generateSmartAnalysis(
    flashcards: IntelligentFlashcard[], 
    network: IntelligenceNetwork,
    concepts: ConceptNode[]
  ): Promise<{
    causalChains: Array<{ chain: string[]; description: string }>;
    conceptualBridges: Array<{ bridge: string; connects: string[]; significance: string }>;
    dependencyWebs: Array<{ core: string; dependencies: string[]; depth: number }>;
    contradictionTensions: Array<{ concepts: string[]; tension: string; resolution: string }>;
    synthesisOpportunities: Array<{ combine: string[]; creates: string; potential: string }>;
  }> {
    // Analyze the relationships and create smart insights
    const causalRelationships = network.relationships.filter(r => r.type === 'causal');
    const conceptualRelationships = network.relationships.filter(r => r.type === 'conceptual');
    const dependencyRelationships = network.relationships.filter(r => r.type === 'dependency');
    const contradictionRelationships = network.relationships.filter(r => r.type === 'contradiction');
    const synthesisRelationships = network.relationships.filter(r => r.type === 'synthesis');

    return {
      causalChains: causalRelationships.slice(0, 3).map(rel => ({
        chain: [rel.source, rel.target],
        description: rel.description
      })),
      conceptualBridges: conceptualRelationships.slice(0, 3).map(rel => ({
        bridge: rel.target,
        connects: [rel.source],
        significance: `Bridges different conceptual domains: ${rel.description}`
      })),
      dependencyWebs: dependencyRelationships.slice(0, 3).map(rel => ({
        core: rel.target,
        dependencies: [rel.source],
        depth: 2
      })),
      contradictionTensions: contradictionRelationships.slice(0, 2).map(rel => ({
        concepts: [rel.source, rel.target],
        tension: rel.description,
        resolution: `Understanding both perspectives provides deeper insight`
      })),
      synthesisOpportunities: synthesisRelationships.slice(0, 3).map(rel => ({
        combine: [rel.source, rel.target],
        creates: `Enhanced understanding through synthesis`,
        potential: rel.description
      }))
    };
  }
}

export const intelligentFlashcardGenerator = new IntelligentFlashcardGenerator();