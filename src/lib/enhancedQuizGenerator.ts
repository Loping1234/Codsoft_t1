import { geminiService } from './gemini';
import type { EnhancedQuizConfig, EnhancedQuizQuestion } from '../types/database';

export const enhancedQuizGenerator = {
  generateCertificationQuiz: async (
    content: string, 
    config: EnhancedQuizConfig
  ): Promise<{ questions: EnhancedQuizQuestion[], topics: string[] }> => {
    
    const prompt = enhancedQuizGenerator.buildCertificationPrompt(content, config);
    
    try {
      // Use existing geminiService methods
      const response = await geminiService.generateQuiz(content + '\n\nCustom prompt: ' + prompt);
      const parsed = enhancedQuizGenerator.parseQuizResponse(JSON.stringify(response));
      return enhancedQuizGenerator.enhanceQuestionsWithMetadata(parsed, config);
    } catch (error) {
      console.error('Quiz generation error:', error);
      throw new Error('Failed to generate certification-level quiz');
    }
  },

  buildCertificationPrompt: (content: string, config: EnhancedQuizConfig): string => {
    const { numQuestions, difficulty, includeScenarios, certificationLevel, crossTopicIntegration, topicFocus } = config;

    return `
      Generate a ${difficulty}-level quiz with ${numQuestions} certification-standard questions.

      DOCUMENT CONTENT:
      ${content.substring(0, 30000)}

      REQUIREMENTS:
      - Certification Level: ${certificationLevel ? 'PhD Qualifier & Board Exam Standard' : 'Advanced Academic'}
      - Question Types: Multiple Choice (40%), True/False (20%), Fill-in-Blank (20%), Matching Pairs (10%), Short Answer (10%)
      - Professional Scenarios: ${includeScenarios ? 'Include real-world application scenarios' : 'Standard academic questions'}
      - Cross-Topic Integration: ${crossTopicIntegration ? 'Combine multiple concepts in single questions' : 'Single concept per question'}
      - Topic Focus: ${topicFocus?.join(', ') || 'Cover all major topics'}
      - Answer Distribution: Balanced A/B/C/D options, no obvious patterns
      - Zero Document References: Never mention "the document" or "according to the text"
      - Real-World Application: Focus on professional implementation, not just memorization

      QUESTION FORMAT:
      For each question, provide:
      {
        "type": "mcq|true_false|fill_blank|matching|short_answer",
        "question": "Professional scenario-based question that tests application",
        "options": ["Option A", "Option B", "Option C", "Option D"], // for MCQ
        "matchingPairs": [["Term1", "Definition1"], ...], // for matching
        "correct_answer": "Correct answer or array for matching",
        "explanation": "Detailed professional rationale",
        "scenario": "Real-world context if applicable",
        "difficulty": "easy|medium|hard|expert",
        "topics": ["Topic1", "Topic2"]
      }

      DIFFICULTY GUIDELINES:
      - Beginner: Basic recall and comprehension
      - Intermediate: Application and analysis  
      - Advanced: Synthesis and evaluation
      - Expert: Innovation and creation in professional contexts

      Ensure questions:
      1. Test deep understanding, not just memorization
      2. Include professional decision-making scenarios
      3. Require cross-disciplinary thinking
      4. Have plausible distractors based on common misconceptions
      5. Balance conceptual and applied knowledge

      Return valid JSON with "questions" array and "topics" array.
    `;
  },

  parseQuizResponse: (response: string): any => {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('No JSON found in response');
    } catch (error) {
      console.error('Parsing error:', error, 'Response:', response);
      throw error;
    }
  },

  enhanceQuestionsWithMetadata: (parsed: any, config: EnhancedQuizConfig) => {
    const questions: EnhancedQuizQuestion[] = parsed.questions.map((q: any, index: number) => ({
      ...q,
      id: (index + 1).toString(),
      metadata: {
        isCertificationLevel: config.certificationLevel,
        requiresApplication: q.scenario != null,
        hasRealWorldContext: q.scenario != null
      }
    }));

    // Balance answer distribution for MCQs
    const mcqQuestions = questions.filter(q => q.type === 'mcq');
    enhancedQuizGenerator.balanceAnswerDistribution(mcqQuestions);

    return {
      questions,
      topics: parsed.topics || enhancedQuizGenerator.extractTopics(questions)
    };
  },

  balanceAnswerDistribution: (questions: EnhancedQuizQuestion[]) => {
    const answers = ['A', 'B', 'C', 'D'];
    questions.forEach((question, index) => {
      if (question.options && question.correct_answer) {
        // Ensure balanced distribution by rotating correct answers
        const targetIndex = index % answers.length;
        // This is a placeholder for actual implementation
        console.log(`Question ${index} should have answer ${answers[targetIndex]}`);
      }
    });
  },

  extractTopics: (questions: EnhancedQuizQuestion[]): string[] => {
    const allTopics = questions.flatMap(q => q.topics || []);
    return [...new Set(allTopics)].slice(0, 10);
  },

  // Alternative method for generating from prompts when content extraction fails
  generateQuizFromPrompt: async (prompt: string, config: EnhancedQuizConfig): Promise<{ questions: EnhancedQuizQuestion[], topics: string[] }> => {
    const enhancedPrompt = `
      ${prompt}
      
      Generate ${config.numQuestions} ${config.difficulty}-level questions based on the file type and name provided.
      
      ${enhancedQuizGenerator.buildCertificationPrompt('', config)}
    `;
    
    try {
      const response = await geminiService.generateQuizFromPrompt(enhancedPrompt);
      const parsed = enhancedQuizGenerator.parseQuizResponse(JSON.stringify(response));
      return enhancedQuizGenerator.enhanceQuestionsWithMetadata(parsed, config);
    } catch (error) {
      console.error('Quiz generation from prompt error:', error);
      throw error;
    }
  }
};