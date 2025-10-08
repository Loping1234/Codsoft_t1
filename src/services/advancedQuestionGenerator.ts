import { geminiService } from '../lib/gemini';
import type { QuizConfig, AdvancedQuizQuestion, QuestionType } from '../types/database';
import type { ProcessedContent } from './contentProcessor';

/**
 * Advanced Question Generator with NLP-powered techniques
 * Uses Gemini AI to simulate transformer-based question generation
 */

export interface QuestionGenerationStrategy {
  type: QuestionType;
  technique: 'entity_based' | 'relationship_based' | 'scenario_based' | 'application_based';
  weight: number;
}

export interface QuestionQuality {
  score: number; // 0-100
  clarity: number;
  difficulty: number;
  relevance: number;
  uniqueness: number;
}

export class AdvancedQuestionGenerator {
  /**
   * Generate questions using multiple NLP techniques
   */
  async generateQuestionsAdvanced(
    processedContent: ProcessedContent,
    config: QuizConfig
  ): Promise<AdvancedQuizQuestion[]> {
    console.log('Starting advanced question generation...');

    const allQuestions: AdvancedQuizQuestion[] = [];

    // Generate questions for each type
    for (const questionType of config.questionTypes) {
      const questions = await this.generateByType(
        questionType,
        processedContent,
        config
      );
      allQuestions.push(...questions);
    }

    // Filter and balance questions
    const filtered = this.filterByQuality(allQuestions, config);
    const balanced = this.balanceQuestions(filtered, config);

    console.log('Question generation complete:', {
      generated: allQuestions.length,
      filtered: filtered.length,
      final: balanced.length,
    });

    return balanced.slice(0, config.questionCount);
  }

  /**
   * Generate questions based on type
   */
  private async generateByType(
    type: QuestionType,
    content: ProcessedContent,
    config: QuizConfig
  ): Promise<AdvancedQuizQuestion[]> {
    switch (type) {
      case 'mcq':
        return this.generateMCQQuestions(content, config);
      case 'true_false':
        return this.generateTrueFalseQuestions(content, config);
      case 'fill_blank':
        return this.generateFillBlankQuestions(content, config);
      case 'matching':
        return this.generateMatchingQuestions(content, config);
      case 'short_answer':
        return this.generateShortAnswerQuestions(content, config);
      default:
        return [];
    }
  }

  /**
   * Entity-based MCQ generation
   */
  private async generateMCQQuestions(
    content: ProcessedContent,
    config: QuizConfig
  ): Promise<AdvancedQuizQuestion[]> {
    const entitiesText = content.entities
      .filter(e => e.importance >= 5)
      .map(e => `${e.text} (${e.type}): ${e.context}`)
      .join('\n');

    const conceptsText = content.concepts
      .filter(c => c.importance >= 5)
      .map(c => `${c.name}: ${c.description}`)
      .join('\n');

    const prompt = `
Generate ${Math.ceil(config.questionCount / config.questionTypes.length)} professional MCQ questions.

CONTENT ANALYSIS:
Key Entities: ${entitiesText}

Key Concepts: ${conceptsText}

Relationships: ${JSON.stringify(content.relationships.slice(0, 10))}

CONFIGURATION:
- Difficulty: ${config.difficulty}
- Professional Scenarios: ${config.professionalScenarios}
- Certification Level: ${config.certificationLevel}
- Cross-Topic Integration: ${config.crossTopicIntegration}

GENERATION TECHNIQUES:
1. **Entity-Based**: Create questions testing knowledge of key entities
2. **Relationship-Based**: Test understanding of how concepts relate
3. **Application-Based**: Real-world scenario questions
4. **Analysis-Based**: Require critical thinking

STRICT REQUIREMENTS:
- NEVER mention "the document" or "according to the text"
- Create self-contained questions with full context
- Ensure balanced answer distribution (25% each option)
- Professional context for advanced/expert levels
- Plausible distractors for incorrect options

Return JSON format:
{
  "questions": [
    {
      "id": "1",
      "type": "mcq",
      "question": "Professional scenario question...",
      "options": ["A", "B", "C", "D"],
      "correct_answer": "A",
      "explanation": "Detailed explanation...",
      "difficulty": "medium",
      "topic": "Related concept",
      "professionalScenario": "Context if applicable",
      "metadata": {
        "crossTopic": true,
        "requiresAnalysis": true,
        "answerDistribution": "balanced"
      }
    }
  ]
}

Return ONLY valid JSON.
    `;

    try {
      const response = await geminiService.generateText(prompt);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        return data.questions || [];
      }
    } catch (error) {
      console.error('MCQ generation error:', error);
    }

    return [];
  }

  /**
   * Relationship-based True/False generation
   */
  private async generateTrueFalseQuestions(
    content: ProcessedContent,
    config: QuizConfig
  ): Promise<AdvancedQuizQuestion[]> {
    const relationships = content.relationships.slice(0, 15);

    const prompt = `
Generate ${Math.ceil(config.questionCount / config.questionTypes.length)} professional True/False questions.

RELATIONSHIPS:
${relationships.map(r => `${r.subject} ${r.predicate} ${r.object} (${r.type})`).join('\n')}

CONCEPTS:
${content.concepts.map(c => c.name).join(', ')}

CONFIGURATION:
- Difficulty: ${config.difficulty}
- Certification Level: ${config.certificationLevel}

REQUIREMENTS:
- Test understanding of relationships and concepts
- Create nuanced statements that require analysis
- Avoid obvious true/false statements
- Mix true and false statements evenly
- Provide detailed explanations

Return JSON format:
{
  "questions": [
    {
      "id": "1",
      "type": "true_false",
      "question": "Statement requiring analysis...",
      "options": ["True", "False"],
      "correct_answer": "True",
      "explanation": "Why this is true/false...",
      "difficulty": "medium",
      "topic": "Concept",
      "metadata": {
        "crossTopic": false,
        "requiresAnalysis": true,
        "answerDistribution": "balanced"
      }
    }
  ]
}

Return ONLY valid JSON.
    `;

    try {
      const response = await geminiService.generateText(prompt);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        return data.questions || [];
      }
    } catch (error) {
      console.error('True/False generation error:', error);
    }

    return [];
  }

  /**
   * Entity-based Fill-in-Blank generation
   */
  private async generateFillBlankQuestions(
    content: ProcessedContent,
    config: QuizConfig
  ): Promise<AdvancedQuizQuestion[]> {
    const keyTerms = content.metadata.keyTerms.slice(0, 20);
    const entities = content.entities.filter(e => e.importance >= 6);

    const prompt = `
Generate ${Math.ceil(config.questionCount / config.questionTypes.length)} Fill-in-the-Blank questions.

KEY TERMS: ${keyTerms.join(', ')}

ENTITIES: ${entities.map(e => e.text).join(', ')}

REQUIREMENTS:
- Create context-rich sentences
- Remove key terms to create meaningful gaps
- Ensure only one correct answer
- Test understanding, not just memorization

Return JSON format:
{
  "questions": [
    {
      "id": "1",
      "type": "fill_blank",
      "question": "Sentence with _____ gap.",
      "correct_answer": "answer",
      "explanation": "Why this is correct...",
      "difficulty": "easy",
      "topic": "Concept",
      "metadata": {
        "crossTopic": false,
        "requiresAnalysis": false,
        "answerDistribution": "balanced"
      }
    }
  ]
}

Return ONLY valid JSON.
    `;

    try {
      const response = await geminiService.generateText(prompt);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        return data.questions || [];
      }
    } catch (error) {
      console.error('Fill-blank generation error:', error);
    }

    return [];
  }

  /**
   * Relationship-based Matching generation
   */
  private async generateMatchingQuestions(
    content: ProcessedContent,
    config: QuizConfig
  ): Promise<AdvancedQuizQuestion[]> {
    const concepts = content.concepts.slice(0, 10);
    const relationships = content.relationships.slice(0, 10);

    const prompt = `
Generate ${Math.ceil(config.questionCount / config.questionTypes.length)} Matching questions.

CONCEPTS:
${concepts.map(c => `${c.name}: ${c.description}`).join('\n')}

RELATIONSHIPS:
${relationships.map(r => `${r.subject} ${r.predicate} ${r.object}`).join('\n')}

REQUIREMENTS:
- Create logical pairs (terms-definitions, causes-effects, concepts-examples)
- 4-6 pairs per question
- Test conceptual understanding

Return JSON format:
{
  "questions": [
    {
      "id": "1",
      "type": "matching",
      "question": "Match the following concepts:",
      "options": ["Term 1 - Definition A", "Term 2 - Definition B", ...],
      "correct_answer": "Term 1 - Definition A",
      "explanation": "Matching explanations...",
      "difficulty": "medium",
      "topic": "Concept",
      "metadata": {
        "crossTopic": true,
        "requiresAnalysis": true,
        "answerDistribution": "balanced"
      }
    }
  ]
}

Return ONLY valid JSON.
    `;

    try {
      const response = await geminiService.generateText(prompt);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        return data.questions || [];
      }
    } catch (error) {
      console.error('Matching generation error:', error);
    }

    return [];
  }

  /**
   * Application-based Short Answer generation
   */
  private async generateShortAnswerQuestions(
    content: ProcessedContent,
    config: QuizConfig
  ): Promise<AdvancedQuizQuestion[]> {
    const concepts = content.concepts.filter(c => c.importance >= 7);

    const prompt = `
Generate ${Math.ceil(config.questionCount / config.questionTypes.length)} Short Answer questions.

KEY CONCEPTS:
${concepts.map(c => `${c.name}: ${c.description}`).join('\n')}

REQUIREMENTS:
- Test application and analysis
- Require 2-3 sentence responses
- Professional scenarios for advanced levels

Return JSON format:
{
  "questions": [
    {
      "id": "1",
      "type": "short_answer",
      "question": "Explain how...",
      "correct_answer": "Expected answer points",
      "explanation": "Model answer...",
      "difficulty": "hard",
      "topic": "Concept",
      "professionalScenario": "Real-world context",
      "metadata": {
        "crossTopic": true,
        "requiresAnalysis": true,
        "answerDistribution": "balanced"
      }
    }
  ]
}

Return ONLY valid JSON.
    `;

    try {
      const response = await geminiService.generateText(prompt);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        return data.questions || [];
      }
    } catch (error) {
      console.error('Short answer generation error:', error);
    }

    return [];
  }

  /**
   * Filter questions by quality score
   */
  private filterByQuality(
    questions: AdvancedQuizQuestion[],
    config: QuizConfig
  ): AdvancedQuizQuestion[] {
    return questions.filter(q => {
      const quality = this.assessQuality(q);
      
      // Minimum quality threshold based on difficulty
      const threshold = config.certificationLevel ? 70 : 60;
      
      return quality.score >= threshold;
    });
  }

  /**
   * Assess question quality
   */
  private assessQuality(question: AdvancedQuizQuestion): QuestionQuality {
    let clarity = 100;
    let relevance = 100;
    let uniqueness = 100;

    // Penalize unclear questions
    if (question.question.length < 20) clarity -= 20;
    if (question.question.includes('the document')) clarity -= 50;

    // Check explanation quality
    if (!question.explanation || question.explanation.length < 30) relevance -= 20;

    // Check for professional context
    if (question.professionalScenario) relevance += 10;

    const difficulty = question.difficulty === 'easy' ? 30 : 
                      question.difficulty === 'medium' ? 60 : 90;

    const score = (clarity + relevance + uniqueness) / 3;

    return { score, clarity, difficulty, relevance, uniqueness };
  }

  /**
   * Balance questions across types and difficulties
   */
  private balanceQuestions(
    questions: AdvancedQuizQuestion[],
    config: QuizConfig
  ): AdvancedQuizQuestion[] {
    const balanced: AdvancedQuizQuestion[] = [];
    const perType = Math.ceil(config.questionCount / config.questionTypes.length);

    for (const type of config.questionTypes) {
      const typeQuestions = questions.filter(q => q.type === type);
      balanced.push(...typeQuestions.slice(0, perType));
    }

    // Shuffle for variety
    return this.shuffleArray(balanced);
  }

  /**
   * Shuffle array
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

export const advancedQuestionGenerator = new AdvancedQuestionGenerator();
