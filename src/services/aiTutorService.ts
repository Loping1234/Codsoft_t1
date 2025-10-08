import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

// Type Definitions
export interface TutorResponse {
  answer: string;
  confidence: number;
  followUpQuestions?: string[];
  relatedConcepts?: string[];
  sources?: string[];
}

export interface ExplanationLevel {
  level: 'like_im_10' | 'high_school' | 'college' | 'expert';
  description: string;
}

export interface ProblemStep {
  stepNumber: number;
  description: string;
  explanation?: string;
  formula?: string;
}

export interface LearningGap {
  concept: string;
  severity: 'low' | 'medium' | 'high';
  evidence: string[];
  remedialQuestions: string[];
}

export interface ConceptRelationship {
  conceptA: string;
  conceptB: string;
  relationshipType: string;
  connections: string[];
  evidence: string[];
}

/**
 * 1. CONTEXT-AWARE Q&A SYSTEM
 */
export class ContextAwareQA {
  private model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  /**
   * Answers questions specifically about uploaded document content
   */
  async answerDocumentQuestion(
    documentContent: string,
    question: string,
    conversationHistory: string[] = []
  ): Promise<TutorResponse> {
    const historyContext = conversationHistory.length > 0
      ? `\n\nPrevious conversation:\n${conversationHistory.join('\n')}`
      : '';

    const prompt = `You are an expert AI tutor. A student has uploaded study material and has a question about it.

Document Content:
${documentContent}
${historyContext}

Student Question: ${question}

Provide a clear, accurate answer based ONLY on the document content. If the answer isn't in the document, say so politely and suggest what information would be needed.

Format your response as:
ANSWER: [Your detailed answer]
CONFIDENCE: [0.0-1.0]
FOLLOW_UP: [2-3 related questions the student might ask]
RELATED: [Key concepts mentioned in your answer]`;

    const result = await this.model.generateContent(prompt);
    const response = result.response.text();

    return this.parseResponse(response);
  }

  /**
   * Finds and explains relationships between concepts
   */
  async findConceptRelationships(
    documentContent: string,
    conceptA: string,
    conceptB: string
  ): Promise<ConceptRelationship> {
    const prompt = `Analyze the relationship between these two concepts from the study material:

Document Content:
${documentContent}

Concept A: ${conceptA}
Concept B: ${conceptB}

Explain:
1. How these concepts relate to each other
2. What type of relationship they have (complementary, causal, hierarchical, etc.)
3. Specific connections between them
4. Evidence from the material

Format:
RELATIONSHIP_TYPE: [type]
CONNECTIONS: [connection1] | [connection2] | [connection3]
EVIDENCE: [evidence1] | [evidence2]`;

    const result = await this.model.generateContent(prompt);
    const response = result.response.text();

    return this.parseRelationship(response, conceptA, conceptB);
  }

  private parseResponse(response: string): TutorResponse {
    const answerMatch = response.match(/ANSWER:\s*([\s\S]*?)(?=CONFIDENCE:|$)/);
    const confidenceMatch = response.match(/CONFIDENCE:\s*([\d.]+)/);
    const followUpMatch = response.match(/FOLLOW_UP:\s*([\s\S]*?)(?=RELATED:|$)/);
    const relatedMatch = response.match(/RELATED:\s*([\s\S]*?)$/);

    return {
      answer: answerMatch ? answerMatch[1].trim() : response,
      confidence: confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.8,
      followUpQuestions: followUpMatch 
        ? followUpMatch[1].split('\n').filter(q => q.trim()).map(q => q.replace(/^[-*]\s*/, '').trim())
        : [],
      relatedConcepts: relatedMatch
        ? relatedMatch[1].split(',').map(c => c.trim())
        : []
    };
  }

  private parseRelationship(response: string, conceptA: string, conceptB: string): ConceptRelationship {
    const typeMatch = response.match(/RELATIONSHIP_TYPE:\s*([^\n]+)/);
    const connectionsMatch = response.match(/CONNECTIONS:\s*([^\n]+)/);
    const evidenceMatch = response.match(/EVIDENCE:\s*([\s\S]*?)$/);

    return {
      conceptA,
      conceptB,
      relationshipType: typeMatch ? typeMatch[1].trim() : 'related',
      connections: connectionsMatch 
        ? connectionsMatch[1].split('|').map(c => c.trim())
        : [],
      evidence: evidenceMatch
        ? evidenceMatch[1].split('|').map(e => e.trim())
        : []
    };
  }
}

/**
 * 2. MULTI-LEVEL EXPLANATION ENGINE
 */
export class ExplanationEngine {
  private model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  /**
   * Generates explanations at different complexity levels
   */
  async explainConcept(
    concept: string,
    complexityLevel: 'like_im_10' | 'high_school' | 'college' | 'expert',
    context?: string
  ): Promise<string> {
    const levelInstructions = {
      like_im_10: 'Explain using simple words, fun analogies, and everyday examples a 10-year-old would understand.',
      high_school: 'Explain at a high school level with clear definitions and standard educational examples.',
      college: 'Provide a detailed, technical explanation appropriate for college students with proper terminology.',
      expert: 'Give an advanced, research-level explanation with technical depth and nuanced understanding.'
    };

    const contextSection = context ? `\n\nContext from study material:\n${context}` : '';

    const prompt = `You are an expert educator. Explain the following concept.

Concept: ${concept}
Complexity Level: ${complexityLevel}${contextSection}

Instructions: ${levelInstructions[complexityLevel]}

Provide a clear, engaging explanation:`;

    const result = await this.model.generateContent(prompt);
    return result.response.text();
  }

  /**
   * Creates relatable analogies for difficult concepts
   */
  async generateAnalogy(
    complexConcept: string,
    familiarDomain?: string
  ): Promise<string> {
    const domainHint = familiarDomain 
      ? `Use analogies related to: ${familiarDomain}`
      : 'Use everyday, relatable analogies';

    const prompt = `Create a clear, memorable analogy to explain this concept:

Concept: ${complexConcept}

${domainHint}

Make the analogy:
1. Easy to understand
2. Accurate to the core concept
3. Memorable and engaging
4. Helpful for learning

Analogy:`;

    const result = await this.model.generateContent(prompt);
    return result.response.text();
  }

  /**
   * Provides real-world applications of abstract concepts
   */
  async provideRealWorldExamples(
    abstractConcept: string,
    numberOfExamples: number = 3
  ): Promise<string[]> {
    const prompt = `Provide ${numberOfExamples} real-world, practical applications or examples of this concept:

Concept: ${abstractConcept}

Give concrete, specific examples that show how this concept is used in everyday life, technology, business, or nature.

Format each example on a new line starting with a number.`;

    const result = await this.model.generateContent(prompt);
    const response = result.response.text();

    return response
      .split('\n')
      .filter(line => line.trim())
      .map(line => line.replace(/^\d+[\.)]\s*/, '').trim())
      .filter(line => line.length > 0);
  }
}

/**
 * 3. LEARNING GAP IDENTIFICATION
 */
export class LearningGapAnalyzer {
  private model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  /**
   * Identifies knowledge gaps from conversation and quiz performance
   */
  async identifyLearningGaps(
    conversationHistory: string[],
    quizPerformance?: {
      questions: any[];
      answers: any[];
      scores: number[];
    }
  ): Promise<LearningGap[]> {
    const quizSection = quizPerformance
      ? `\n\nQuiz Performance:
Questions answered incorrectly or with low confidence:
${quizPerformance.questions
  .map((q, i) => quizPerformance.scores[i] < 0.7 ? `- ${q.question}` : '')
  .filter(Boolean)
  .join('\n')}`
      : '';

    const prompt = `Analyze this student's learning to identify knowledge gaps:

Conversation History:
${conversationHistory.join('\n')}${quizSection}

Identify specific concepts the student:
1. Misunderstood or confused
2. Struggled with
3. Needs more practice on

For each gap, provide:
GAP: [concept name]
SEVERITY: [low/medium/high]
EVIDENCE: [specific evidence from interactions]
REMEDIAL: [3 targeted questions to address this gap]

Format each gap clearly separated by "---"`;

    const result = await this.model.generateContent(prompt);
    const response = result.response.text();

    return this.parseGaps(response);
  }

  /**
   * Generates targeted questions to address specific misunderstandings
   */
  async suggestRemedialQuestions(
    misunderstoodConcept: string,
    numberOfQuestions: number = 3
  ): Promise<string[]> {
    const prompt = `Generate ${numberOfQuestions} targeted questions to help a student better understand this concept:

Concept: ${misunderstoodConcept}

Create questions that:
1. Start with fundamentals
2. Build understanding progressively
3. Clarify common misconceptions
4. Are specific and actionable

List each question on a new line:`;

    const result = await this.model.generateContent(prompt);
    const response = result.response.text();

    return response
      .split('\n')
      .filter(line => line.trim())
      .map(line => line.replace(/^\d+[\.)]\s*/, '').trim())
      .filter(line => line.length > 0);
  }

  private parseGaps(response: string): LearningGap[] {
    const gaps: LearningGap[] = [];
    const gapSections = response.split('---').filter(s => s.trim());

    for (const section of gapSections) {
      const conceptMatch = section.match(/GAP:\s*([^\n]+)/);
      const severityMatch = section.match(/SEVERITY:\s*(low|medium|high)/i);
      const evidenceMatch = section.match(/EVIDENCE:\s*([^\n]+(?:\n(?!REMEDIAL:)[^\n]+)*)/);
      const remedialMatch = section.match(/REMEDIAL:\s*([\s\S]*?)(?=---|\s*$)/);

      if (conceptMatch) {
        gaps.push({
          concept: conceptMatch[1].trim(),
          severity: (severityMatch?.[1].toLowerCase() as any) || 'medium',
          evidence: evidenceMatch 
            ? evidenceMatch[1].split('\n').map(e => e.trim()).filter(Boolean)
            : [],
          remedialQuestions: remedialMatch
            ? remedialMatch[1]
                .split('\n')
                .map(q => q.replace(/^[-*\d+.)\s]+/, '').trim())
                .filter(Boolean)
            : []
        });
      }
    }

    return gaps;
  }
}

/**
 * 4. STEP-BY-STEP PROBLEM SOLVING
 */
export class ProblemSolver {
  private model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  /**
   * Breaks down complex problems into manageable steps
   */
  async solveProblemStepByStep(
    problem: string,
    showWork: boolean = true
  ): Promise<{ steps: ProblemStep[]; finalAnswer: string }> {
    const prompt = `Solve this problem step by step:

Problem: ${problem}

${showWork ? 'Show all work and explain each step clearly.' : 'Provide steps concisely.'}

Format each step as:
STEP [number]: [what you're doing]
EXPLANATION: [why you're doing it]
WORK: [the actual calculation or reasoning]

End with:
FINAL_ANSWER: [the complete answer]`;

    const result = await this.model.generateContent(prompt);
    const response = result.response.text();

    return this.parseSteps(response);
  }

  /**
   * Provides guidance without giving direct answers (homework help)
   */
  async provideGuidedHints(
    problem: string,
    studentAttempt?: string
  ): Promise<{ hints: string[]; commonMistakes: string[] }> {
    const attemptSection = studentAttempt
      ? `\n\nStudent's Attempt:\n${studentAttempt}`
      : '';

    const prompt = `Help guide a student through this problem WITHOUT giving the direct answer:

Problem: ${problem}${attemptSection}

Provide:
1. HINTS: 3-4 guiding hints that lead toward the solution
2. COMMON_MISTAKES: Typical errors students make with this type of problem

Format:
HINTS:
- [hint 1]
- [hint 2]
- [hint 3]

COMMON_MISTAKES:
- [mistake 1]
- [mistake 2]`;

    const result = await this.model.generateContent(prompt);
    const response = result.response.text();

    const hintsMatch = response.match(/HINTS:\s*([\s\S]*?)(?=COMMON_MISTAKES:|$)/);
    const mistakesMatch = response.match(/COMMON_MISTAKES:\s*([\s\S]*?)$/);

    return {
      hints: hintsMatch
        ? hintsMatch[1].split('\n').map(h => h.replace(/^[-*]\s*/, '').trim()).filter(Boolean)
        : [],
      commonMistakes: mistakesMatch
        ? mistakesMatch[1].split('\n').map(m => m.replace(/^[-*]\s*/, '').trim()).filter(Boolean)
        : []
    };
  }

  private parseSteps(response: string): { steps: ProblemStep[]; finalAnswer: string } {
    const steps: ProblemStep[] = [];
    const stepRegex = /STEP\s+(\d+):\s*([^\n]+)(?:\nEXPLANATION:\s*([^\n]+))?(?:\nWORK:\s*([^\n]+))?/gi;
    
    let match;
    while ((match = stepRegex.exec(response)) !== null) {
      steps.push({
        stepNumber: parseInt(match[1]),
        description: match[2].trim(),
        explanation: match[3]?.trim(),
        formula: match[4]?.trim()
      });
    }

    const answerMatch = response.match(/FINAL_ANSWER:\s*([^\n]+)/i);
    const finalAnswer = answerMatch ? answerMatch[1].trim() : 'See steps above';

    return { steps, finalAnswer };
  }
}

/**
 * 5. INTERACTIVE DIALOGUE MANAGEMENT
 */
export class DialogueManager {
  private model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  /**
   * Generates clarifying questions for ambiguous queries
   */
  async generateClarifyingQuestions(
    studentQuery: string,
    confidence: number
  ): Promise<string[]> {
    const prompt = `A student asked: "${studentQuery}"

The query seems ambiguous or unclear (confidence: ${confidence}).

Generate 2-3 specific clarifying questions to better understand what the student needs help with.

Questions:`;

    const result = await this.model.generateContent(prompt);
    const response = result.response.text();

    return response
      .split('\n')
      .filter(line => line.trim())
      .map(line => line.replace(/^[-*\d+.)\s]+/, '').trim())
      .filter(line => line.length > 0);
  }

  /**
   * Uses Socratic method to guide students to discover answers
   */
  async socraticDialogue(
    topic: string,
    numberOfQuestions: number = 3
  ): Promise<string[]> {
    const prompt = `Use the Socratic method to help a student understand: ${topic}

Generate ${numberOfQuestions} thought-provoking questions that:
1. Guide the student to think deeply
2. Lead them toward discovering the answer themselves
3. Build on each other progressively
4. Encourage critical thinking

Questions:`;

    const result = await this.model.generateContent(prompt);
    const response = result.response.text();

    return response
      .split('\n')
      .filter(line => line.trim())
      .map(line => line.replace(/^[-*\d+.)\s]+/, '').trim())
      .filter(line => line.length > 0);
  }

  /**
   * Provides encouragement based on performance trends
   */
  async provideEncouragement(
    performanceTrend: 'improving' | 'declining' | 'stable',
    effortLevel: number
  ): Promise<string> {
    const prompt = `Provide encouraging, motivational feedback for a student:

Performance Trend: ${performanceTrend}
Effort Level: ${effortLevel}/1.0

Give a brief, genuine message that:
1. Acknowledges their effort
2. ${performanceTrend === 'improving' ? 'Celebrates progress' : performanceTrend === 'declining' ? 'Encourages resilience' : 'Motivates continued practice'}
3. Reinforces growth mindset
4. Is warm and supportive

Message:`;

    const result = await this.model.generateContent(prompt);
    return result.response.text().trim();
  }
}

/**
 * MAIN AI TUTOR CLASS - Orchestrates all components
 */
export class AITutor {
  public qaSystem: ContextAwareQA;
  public explanationEngine: ExplanationEngine;
  public gapAnalyzer: LearningGapAnalyzer;
  public problemSolver: ProblemSolver;
  public dialogueManager: DialogueManager;

  constructor() {
    this.qaSystem = new ContextAwareQA();
    this.explanationEngine = new ExplanationEngine();
    this.gapAnalyzer = new LearningGapAnalyzer();
    this.problemSolver = new ProblemSolver();
    this.dialogueManager = new DialogueManager();
  }

  /**
   * Main entry point for processing student queries
   */
  async processQuery(
    userQuery: string,
    documentContext?: string,
    conversationHistory: string[] = []
  ): Promise<TutorResponse> {
    // If we have document context, use context-aware Q&A
    if (documentContext && documentContext.length > 100) {
      return await this.qaSystem.answerDocumentQuestion(
        documentContext,
        userQuery,
        conversationHistory
      );
    }

    // Otherwise, provide general tutoring
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const historyContext = conversationHistory.length > 0
      ? `\n\nConversation history:\n${conversationHistory.slice(-5).join('\n')}`
      : '';

    const prompt = `You are an expert AI tutor. Help the student with their question.${historyContext}

Student Question: ${userQuery}

Provide a clear, helpful answer. If it's a problem, consider showing steps. If it's a concept, explain clearly.

ANSWER: [your response]
CONFIDENCE: [0.0-1.0]
FOLLOW_UP: [related questions]`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    const answerMatch = response.match(/ANSWER:\s*([\s\S]*?)(?=CONFIDENCE:|$)/);
    const confidenceMatch = response.match(/CONFIDENCE:\s*([\d.]+)/);
    const followUpMatch = response.match(/FOLLOW_UP:\s*([\s\S]*?)$/);

    return {
      answer: answerMatch ? answerMatch[1].trim() : response,
      confidence: confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.8,
      followUpQuestions: followUpMatch
        ? followUpMatch[1].split('\n').filter(q => q.trim()).map(q => q.replace(/^[-*]\s*/, '').trim())
        : []
    };
  }
}

// Export singleton instance
export const aiTutor = new AITutor();
