import { GoogleGenerativeAI } from '@google/generative-ai';
import type { QuizConfig, AdvancedQuizQuestion } from '../types/database';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export const geminiService = {
  // Generic text generation method
  generateText: async (prompt: string): Promise<string> => {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error('Failed to generate text with AI');
    }
  },

  // Extract and clean text from document content
  extractTextFromContent: async (content: string): Promise<string> => {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      
      const prompt = `Extract and clean the main educational content from this text. Remove any formatting, headers, footers, or non-content elements. Return only the clean educational content:\n\n${content.substring(0, 30000)}`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error('Failed to process document with AI');
    }
  },

  // Generate quiz from document content
  generateQuiz: async (content: string): Promise<any> => {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      
      const prompt = `
        Based on this educational content, create a quiz with 8 questions. Include:
        - 5 multiple-choice questions with 4 options each
        - 2 fill-in-the-blank questions  
        - 1 short answer question
        
        Content: ${content.substring(0, 20000)}
        
        Return ONLY valid JSON in this exact format:
        {
          "title": "AI Generated Quiz",
          "questions": [
            {
              "id": "1",
              "type": "mcq",
              "question": "Question text?",
              "options": ["A", "B", "C", "D"],
              "correct_answer": "A",
              "explanation": "Brief explanation"
            },
            {
              "id": "2",
              "type": "fill_blank", 
              "question": "The ______ is the powerhouse of the cell.",
              "correct_answer": "mitochondria"
            },
            {
              "id": "3",
              "type": "short_answer",
              "question": "Explain the main concept.",
              "correct_answer": "Expected answer"
            }
          ]
        }
      `;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('No valid JSON found in AI response');
    } catch (error: any) {
      console.error('Quiz generation error:', error);
      if (error.message?.includes('quota')) {
        throw new Error('API quota exceeded. Please wait a moment and try again.');
      } else if (error.message?.includes('429')) {
        throw new Error('Rate limit reached. Please wait 20 seconds and try again.');
      } else if (error.message?.includes('404')) {
        throw new Error('Model not found. The API model may have changed.');
      }
      throw new Error(`Failed to generate quiz: ${error.message || 'Unknown error'}`);
    }
  },

  // Generate flashcards from content
  generateFlashcards: async (content: string): Promise<any> => {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      
      const prompt = `
        Create 10-12 educational flashcards from this content. Focus on key concepts, definitions, and important facts.
        
        Content: ${content.substring(0, 20000)}
        
        Return ONLY valid JSON in this format:
        {
          "title": "Key Concepts Flashcards",
          "flashcards": [
            {
              "id": "1",
              "front": "Concept or question",
              "back": "Definition or answer"
            }
          ]
        }
      `;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('No valid JSON found in AI response');
    } catch (error: any) {
      console.error('Flashcard generation error:', error);
      if (error.message?.includes('quota')) {
        throw new Error('API quota exceeded. Please wait a moment and try again.');
      } else if (error.message?.includes('429')) {
        throw new Error('Rate limit reached. Please wait 20 seconds and try again.');
      } else if (error.message?.includes('404')) {
        throw new Error('Model not found. The API model may have changed.');
      }
      throw new Error(`Failed to generate flashcards: ${error.message || 'Unknown error'}`);
    }
  },

  // Generate quiz from custom prompt (for files without extractable text)
  generateQuizFromPrompt: async (prompt: string): Promise<any> => {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      
      const fullPrompt = `${prompt}
      
      Return ONLY valid JSON in this exact format:
      {
        "title": "AI Generated Quiz",
        "questions": [
          {
            "id": "1",
            "type": "mcq",
            "question": "Question text?",
            "options": ["A", "B", "C", "D"],
            "correct_answer": "A",
            "explanation": "Brief explanation"
          }
        ]
      }`;
      
      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('No valid JSON found in AI response');
    } catch (error: any) {
      console.error('Quiz generation from prompt error:', error);
      throw error; // Don't provide generic fallback - let the calling code handle the error
    }
  },

  // Generate flashcards from custom prompt (for files without extractable text)
  generateFlashcardsFromPrompt: async (prompt: string): Promise<any> => {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      
      const fullPrompt = `${prompt}
      
      Return ONLY valid JSON in this exact format:
      {
        "title": "AI Generated Flashcards",
        "flashcards": [
          {
            "id": "1",
            "front": "Concept or question",
            "back": "Definition or answer"
          }
        ]
      }`;
      
      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('No valid JSON found in AI response');
    } catch (error: any) {
      console.error('Flashcards generation from prompt error:', error);
      throw error; // Don't provide generic fallback - let the calling code handle the error
    }
  },

  // AI Tutor Methods
  answerQuestionWithContext: async (question: string, context: string, conversationHistory: Array<{role: string, content: string}> = []): Promise<string> => {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      
      // Build conversation context
      const historyContext = conversationHistory
        .slice(-6) // Last 6 messages for context
        .map(msg => `${msg.role === 'user' ? 'Student' : 'Tutor'}: ${msg.content}`)
        .join('\n');
      
      const prompt = `
        You are an AI Tutor helping a student understand their study material.
        
        ${context && context.length > 100 ? `STUDY MATERIAL CONTEXT:\n${context.substring(0, 20000)}\n\n` : 'No specific study material context provided.\n\n'}
        
        ${historyContext ? `RECENT CONVERSATION:\n${historyContext}\n\n` : ''}
        
        STUDENT'S QUESTION: ${question}
        
        Please provide a helpful, educational response that:
        1. Directly answers the question
        2. ${context && context.length > 100 ? 'References the study material when relevant' : 'Provides general educational insights'}
        3. Gives clear explanations and examples
        4. Is conversational and encouraging
        5. If unsure, admit it and suggest ways to find the answer
        
        Keep your response to 2-4 paragraphs maximum.
      `;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('AI Tutor error:', error);
      return "I apologize, but I'm having trouble processing your question right now. This might be due to network issues or the question complexity. Please try again with a simpler question or check your internet connection.";
    }
  },

  // Quick answer without full context (for simple questions)
  quickAnswer: async (question: string): Promise<string> => {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      
      const prompt = `
        As an AI tutor, provide a helpful and educational answer to this student question:
        
        "${question}"
        
        Please give a clear, concise explanation that would help a student understand the concept.
        If you need more context or the question is unclear, politely ask for clarification.
      `;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error: any) {
      console.error('Quick answer error:', error);
      throw new Error('Unable to process your question at the moment.');
    }
  },

  // Simple answer question with document context (alias for better usability)
  answerQuestion: async (question: string, context: string): Promise<string> => {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      
      const prompt = `
        You are an AI tutor. Answer the student's question based on the provided learning material.
        
        LEARNING MATERIAL CONTEXT:
        ${context.substring(0, 30000)}
        
        STUDENT'S QUESTION: ${question}
        
        Please provide a helpful, educational response that:
        1. Directly answers the question based on the learning material
        2. References specific parts of the material when relevant
        3. Provides examples or analogies if helpful
        4. Is clear and easy to understand
        5. If the question isn't covered in the material, honestly say so but try to help generally
        
        Keep your response focused and educational.
      `;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error: any) {
      console.error('AI Tutor error:', error);
      throw new Error('Failed to get response from AI Tutor');
    }
  },

  // Generate advanced professional quiz with comprehensive configuration
  generateAdvancedQuiz: async (content: string, config: any): Promise<any> => {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      
      const prompt = `
        Generate a ${config.certificationLevel ? 'PhD-level certification' : 'professional'} quiz with ${config.questionCount} questions.
        
        DOCUMENT CONTENT:
        ${content.substring(0, 30000)}
        
        QUIZ CONFIGURATION:
        - Difficulty Level: ${config.difficulty}
        - Question Types: ${config.questionTypes.join(', ')}
        - Professional Scenarios: ${config.professionalScenarios}
        - Certification Level: ${config.certificationLevel}
        - Cross-Topic Integration: ${config.crossTopicIntegration}
        ${config.enableTiming ? `- Time per Question: ${config.timePerQuestion} seconds` : ''}
        
        STRICT REQUIREMENTS:
        1. NEVER mention "the document", "according to the text", or reference the source material directly
        2. Create real-world application scenarios, not just memorization questions
        3. For MCQ questions, ensure balanced answer distribution (25% A, 25% B, 25% C, 25% D)
        4. Include cross-topic integration - combine multiple concepts intelligently
        5. ${config.certificationLevel ? 'PhD-level critical thinking and analysis required' : 'Professional context and practical applications'}
        6. Questions should test understanding and application, not just recall
        7. Provide detailed explanations for why answers are correct/incorrect
        8. Ensure questions are self-contained and don't require external knowledge
        
        QUESTION TYPE SPECIFICS:
        ${config.questionTypes.includes('mcq') ? '- Multiple Choice: 4 options, clear correct answer, plausible distractors' : ''}
        ${config.questionTypes.includes('true_false') ? '- True/False: Statements that require analysis, not obvious facts' : ''}
        ${config.questionTypes.includes('fill_blank') ? '- Fill in Blank: Context-rich sentences with meaningful gaps' : ''}
        ${config.questionTypes.includes('matching') ? '- Matching: Logical pairs that test conceptual relationships' : ''}
        ${config.questionTypes.includes('short_answer') ? '- Short Answer: Brief but substantive responses required' : ''}
        
        Return EXACT JSON format:
        {
          "title": "Professional Assessment Quiz",
          "questions": [
            {
              "id": "1",
              "type": "mcq",
              "question": "In a professional scenario where [real-world context], what would be the most appropriate approach to [apply concept]?",
              "options": ["Option A", "Option B", "Option C", "Option D"],
              "correct_answer": "Option A",
              "explanation": "Detailed professional explanation of why this is correct and others are not...",
              "difficulty": "hard",
              "topic": "Integrated Concepts",
              "professionalScenario": "Brief professional context description",
              "metadata": {
                "crossTopic": true,
                "requiresAnalysis": true,
                "answerDistribution": "balanced"
              }
            }
          ]
        }
        
        Generate exactly ${config.questionCount} questions with varied types and difficulties.
      `;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const quizData = JSON.parse(jsonMatch[0]);
        
        // Validate and add time limits if enabled
        if (config.enableTiming && config.timePerQuestion) {
          quizData.questions = quizData.questions.map((q: any) => ({
            ...q,
            timeLimit: config.timePerQuestion
          }));
        }
        
        return quizData;
      }
      throw new Error('No valid JSON found in AI response');
    } catch (error: any) {
      console.error('Advanced quiz generation error:', error);
      if (error.message?.includes('quota')) {
        throw new Error('API quota exceeded. Please wait a moment and try again.');
      } else if (error.message?.includes('429')) {
        throw new Error('Rate limit reached. Please wait 20 seconds and try again.');
      }
      throw new Error('Failed to generate professional quiz');
    }
  },

  /**
   * Generate enhanced quiz using NLP-processed content
   * This is the main entry point for the advanced pipeline
   */
  generateEnhancedQuiz: async (
    documentId: string,
    content: string,
    config: QuizConfig
  ): Promise<{ questions: AdvancedQuizQuestion[] }> => {
    try {
      // Import dynamically to avoid circular dependencies
      const { contentProcessor } = await import('../services/contentProcessor');
      const { advancedQuestionGenerator } = await import('../services/advancedQuestionGenerator');

      console.log('🚀 Starting enhanced quiz generation pipeline...');

      // Create minimal document object for processing
      const document = {
        id: documentId,
        user_id: '', // Not needed for processing
        title: 'Document',
        content: content,
        file_url: '',
        file_type: 'text/plain',
        file_size: content.length,
        uploaded_at: new Date().toISOString(),
        processed: false,
        created_at: new Date().toISOString(),
      };

      // Step 1: Process content with NLP techniques
      console.log('📊 Processing content with NLP...');
      const processedContent = await contentProcessor.processDocument(document, content);

      // Step 2: Generate questions using advanced techniques
      console.log('❓ Generating high-quality questions...');
      const questions = await advancedQuestionGenerator.generateQuestionsAdvanced(
        processedContent,
        config
      );

      console.log('✅ Enhanced quiz generation complete:', {
        entities: processedContent.entities.length,
        concepts: processedContent.concepts.length,
        relationships: processedContent.relationships.length,
        questions: questions.length,
      });

      return { questions };
    } catch (error: any) {
      console.error('Enhanced quiz generation error:', error);
      
      // Fallback to regular advanced quiz if pipeline fails
      console.warn('⚠️ Falling back to standard advanced quiz...');
      return await geminiService.generateAdvancedQuiz(content, config);
    }
  }

};