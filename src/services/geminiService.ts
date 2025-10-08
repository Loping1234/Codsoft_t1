// Gemini AI Service for document analysis and content generation
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI with your API key
const API_KEY = 'AIzaSyDZ62MQs_oeZ_ZPfzH0AUx8mUrfONpHCxM';
const genAI = new GoogleGenerativeAI(API_KEY);

// Recommended models based on your available options (October 2025)
const MODELS = {
  FAST: 'gemini-2.5-flash',    // Best for quick responses and general tasks
  PRO: 'gemini-2.5-pro',       // Best for complex analysis and reasoning
  LATEST: 'gemini-flash-latest' // Always uses the latest Flash version
};

export class GeminiService {
  
  /**
   * Analyze uploaded document content and extract key information
   */
  static async analyzeDocument(documentText: string, documentType: string = 'text') {
    try {
      const model = genAI.getGenerativeModel({ model: MODELS.FAST });
      
      const prompt = `
        Analyze the following ${documentType} document and provide:
        1. A brief summary (2-3 sentences)
        2. Key topics and concepts
        3. Important facts or data points
        4. Suggested study questions (5-7 questions)
        5. Difficulty level (Beginner/Intermediate/Advanced)
        
        Document content:
        ${documentText}
        
        Please format your response as JSON with the following structure:
        {
          "summary": "...",
          "keyTopics": ["topic1", "topic2", ...],
          "importantFacts": ["fact1", "fact2", ...],
          "studyQuestions": ["question1", "question2", ...],
          "difficultyLevel": "..."
        }
      `;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Try to parse as JSON, fallback to raw text if parsing fails
      try {
        return JSON.parse(text.replace(/```json\n?|\n?```/g, ''));
      } catch {
        return { rawAnalysis: text };
      }
      
    } catch (error) {
      console.error('Error analyzing document:', error);
      throw new Error('Failed to analyze document. Please try again.');
    }
  }
  
  /**
   * Generate quiz questions from document content
   */
  static async generateQuiz(documentText: string, numberOfQuestions: number = 10) {
    try {
      const model = genAI.getGenerativeModel({ model: MODELS.FAST });
      
      const prompt = `
        Create ${numberOfQuestions} multiple choice quiz questions based on this document.
        Each question should have 4 options with only one correct answer.
        Include a mix of difficulty levels.
        
        Document content:
        ${documentText}
        
        Format as JSON:
        {
          "questions": [
            {
              "question": "Question text?",
              "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
              "correctAnswer": 0,
              "explanation": "Why this answer is correct",
              "difficulty": "easy|medium|hard"
            }
          ]
        }
      `;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      try {
        return JSON.parse(text.replace(/```json\n?|\n?```/g, ''));
      } catch {
        return { error: 'Failed to parse quiz questions', rawResponse: text };
      }
      
    } catch (error) {
      console.error('Error generating quiz:', error);
      throw new Error('Failed to generate quiz questions. Please try again.');
    }
  }
  
  /**
   * Create flashcards from document content
   */
  static async generateFlashcards(documentText: string, numberOfCards: number = 15) {
    try {
      const model = genAI.getGenerativeModel({ model: MODELS.FAST });
      
      const prompt = `
        Create ${numberOfCards} flashcards from this document content.
        Focus on key terms, concepts, definitions, and important facts.
        
        Document content:
        ${documentText}
        
        Format as JSON:
        {
          "flashcards": [
            {
              "front": "Question or term",
              "back": "Answer or definition",
              "category": "topic category",
              "difficulty": "easy|medium|hard"
            }
          ]
        }
      `;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      try {
        return JSON.parse(text.replace(/```json\n?|\n?```/g, ''));
      } catch {
        return { error: 'Failed to parse flashcards', rawResponse: text };
      }
      
    } catch (error) {
      console.error('Error generating flashcards:', error);
      throw new Error('Failed to generate flashcards. Please try again.');
    }
  }
  
  /**
   * Create a personalized study plan
   */
  static async createStudyPlan(documentAnalysis: any, timeAvailable: string, learningGoals: string[]) {
    try {
      const model = genAI.getGenerativeModel({ model: MODELS.PRO });
      
      const prompt = `
        Create a personalized study plan based on:
        - Document analysis: ${JSON.stringify(documentAnalysis)}
        - Time available: ${timeAvailable}
        - Learning goals: ${learningGoals.join(', ')}
        
        Create a structured study plan with daily tasks, milestones, and recommended study methods.
        
        Format as JSON:
        {
          "studyPlan": {
            "totalDuration": "X weeks/days",
            "weeklySchedule": [
              {
                "week": 1,
                "focus": "topic area",
                "dailyTasks": ["task1", "task2", ...],
                "milestone": "what to achieve this week"
              }
            ],
            "studyMethods": ["method1", "method2", ...],
            "assessmentSchedule": ["when to take quizzes/tests"],
            "tips": ["study tip1", "study tip2", ...]
          }
        }
      `;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      try {
        return JSON.parse(text.replace(/```json\n?|\n?```/g, ''));
      } catch {
        return { error: 'Failed to parse study plan', rawResponse: text };
      }
      
    } catch (error) {
      console.error('Error creating study plan:', error);
      throw new Error('Failed to create study plan. Please try again.');
    }
  }
  
  /**
   * AI Tutor - Answer questions about the document
   */
  static async askTutor(question: string, documentContext: string) {
    try {
      const model = genAI.getGenerativeModel({ model: MODELS.PRO });
      
      const prompt = `
        You are an AI tutor. Answer the student's question based on the provided document context.
        Be helpful, clear, and educational. If the question can't be answered from the context,
        say so and provide general guidance.
        
        Document context:
        ${documentContext}
        
        Student question: ${question}
        
        Provide a helpful, educational response:
      `;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
      
    } catch (error) {
      console.error('Error in AI tutor:', error);
      throw new Error('Failed to get response from AI tutor. Please try again.');
    }
  }
  
  /**
   * Check if API is working and handle rate limits gracefully
   */
  static async checkApiStatus() {
    try {
      const model = genAI.getGenerativeModel({ model: MODELS.FAST });
      const result = await model.generateContent('Say "API is working" if you can read this.');
      const response = await result.response;
      return { status: 'working', message: response.text() };
    } catch (error: any) {
      if (error.message?.includes('429') || error.message?.includes('quota')) {
        return { 
          status: 'rate_limited', 
          message: 'API quota exceeded. Please try again later.' 
        };
      }
      return { 
        status: 'error', 
        message: error.message || 'Unknown API error' 
      };
    }
  }
}

export default GeminiService;