import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useDocument } from './DocumentContext';
import { aiTutor } from '../services/aiTutorService';
import type { TutorResponse, LearningGap, ProblemStep } from '../services/aiTutorService';

// Type Definitions
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  messageType: 'question' | 'explanation' | 'example' | 'analogy' | 'problem_solution' | 'encouragement';
  relatedConcepts?: string[];
  followUpQuestions?: string[];
  problemSteps?: ProblemStep[];
}

export interface ConversationSession {
  id: string;
  title: string;
  messages: Message[];
  topic?: string;
  startTime: Date;
  lastActivity: Date;
  documentId?: string;
}

export interface StudentProgress {
  conceptsMastered: string[];
  conceptsInProgress: string[];
  learningGaps: LearningGap[];
  overallMastery: number;
  studyTimeMinutes: number;
  questionsAsked: number;
  lastUpdated: Date;
}

interface TutorContextType {
  // Conversation Management
  currentSession: ConversationSession | null;
  sessions: ConversationSession[];
  startNewSession: (topic?: string) => void;
  loadSession: (sessionId: string) => void;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  
  // AI Interaction
  askQuestion: (question: string, complexity?: 'like_im_10' | 'high_school' | 'college' | 'expert') => Promise<TutorResponse>;
  explainConcept: (concept: string, level: 'like_im_10' | 'high_school' | 'college' | 'expert') => Promise<string>;
  solveProblem: (problem: string, showSteps: boolean) => Promise<{ steps: ProblemStep[]; finalAnswer: string }>;
  getHints: (problem: string, attempt?: string) => Promise<{ hints: string[]; commonMistakes: string[] }>;
  getAnalogy: (concept: string, domain?: string) => Promise<string>;
  getRealWorldExamples: (concept: string) => Promise<string[]>;
  
  // Learning Management
  studentProgress: StudentProgress;
  identifyGaps: () => Promise<LearningGap[]>;
  getRemedialQuestions: (concept: string) => Promise<string[]>;
  updateMastery: (concept: string, level: number) => void;
  
  // UI State
  isProcessing: boolean;
  currentTopic: string | null;
  explanationLevel: 'like_im_10' | 'high_school' | 'college' | 'expert';
  setExplanationLevel: (level: 'like_im_10' | 'high_school' | 'college' | 'expert') => void;
  
  // Quick Actions
  simplifyLastAnswer: () => Promise<void>;
  giveExample: () => Promise<void>;
  showSteps: () => Promise<void>;
}

const TutorContext = createContext<TutorContextType | undefined>(undefined);

export const TutorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { currentDocument, documentContent } = useDocument();
  
  // State Management
  const [currentSession, setCurrentSession] = useState<ConversationSession | null>(null);
  const [sessions, setSessions] = useState<ConversationSession[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTopic, setCurrentTopic] = useState<string | null>(null);
  const [explanationLevel, setExplanationLevel] = useState<'like_im_10' | 'high_school' | 'college' | 'expert'>('high_school');
  const [studentProgress, setStudentProgress] = useState<StudentProgress>({
    conceptsMastered: [],
    conceptsInProgress: [],
    learningGaps: [],
    overallMastery: 0,
    studyTimeMinutes: 0,
    questionsAsked: 0,
    lastUpdated: new Date()
  });

  // Load sessions from localStorage on mount
  useEffect(() => {
    if (user) {
      const savedSessions = localStorage.getItem(`tutor_sessions_${user.id}`);
      if (savedSessions) {
        const parsed = JSON.parse(savedSessions);
        setSessions(parsed.map((s: any) => ({
          ...s,
          startTime: new Date(s.startTime),
          lastActivity: new Date(s.lastActivity),
          messages: s.messages.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp)
          }))
        })));
      }

      const savedProgress = localStorage.getItem(`tutor_progress_${user.id}`);
      if (savedProgress) {
        const parsed = JSON.parse(savedProgress);
        setStudentProgress({
          ...parsed,
          lastUpdated: new Date(parsed.lastUpdated)
        });
      }
    }
  }, [user]);

  // Save sessions to localStorage when they change
  useEffect(() => {
    if (user && sessions.length > 0) {
      localStorage.setItem(`tutor_sessions_${user.id}`, JSON.stringify(sessions));
    }
  }, [sessions, user]);

  // Save progress to localStorage when it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem(`tutor_progress_${user.id}`, JSON.stringify(studentProgress));
    }
  }, [studentProgress, user]);

  // Start new conversation session
  const startNewSession = (topic?: string) => {
    const newSession: ConversationSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: topic || 'New Conversation',
      messages: [],
      topic,
      startTime: new Date(),
      lastActivity: new Date(),
      documentId: currentDocument?.id
    };
    
    setCurrentSession(newSession);
    setSessions(prev => [newSession, ...prev]);
    setCurrentTopic(topic || null);
  };

  // Load existing session
  const loadSession = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setCurrentSession(session);
      setCurrentTopic(session.topic || null);
    }
  };

  // Add message to current session
  const addMessage = (message: Omit<Message, 'id' | 'timestamp'>) => {
    if (!currentSession) {
      startNewSession();
      return;
    }

    const newMessage: Message = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };

    const updatedSession = {
      ...currentSession,
      messages: [...currentSession.messages, newMessage],
      lastActivity: new Date()
    };

    setCurrentSession(updatedSession);
    setSessions(prev => 
      prev.map(s => s.id === updatedSession.id ? updatedSession : s)
    );

    // Update progress
    if (message.role === 'user') {
      setStudentProgress(prev => ({
        ...prev,
        questionsAsked: prev.questionsAsked + 1,
        lastUpdated: new Date()
      }));
    }
  };

  // Ask a question
  const askQuestion = async (
    question: string,
    complexity?: 'like_im_10' | 'high_school' | 'college' | 'expert'
  ): Promise<TutorResponse> => {
    if (!currentSession) startNewSession();
    
    setIsProcessing(true);
    
    // Add user message
    addMessage({
      role: 'user',
      content: question,
      messageType: 'question'
    });

    try {
      const conversationHistory = currentSession?.messages.map(m => 
        `${m.role}: ${m.content}`
      ) || [];

      const response = await aiTutor.processQuery(
        question,
        documentContent || undefined,
        conversationHistory
      );

      // Add assistant response
      addMessage({
        role: 'assistant',
        content: response.answer,
        messageType: 'explanation',
        relatedConcepts: response.relatedConcepts,
        followUpQuestions: response.followUpQuestions
      });

      // Update concepts in progress
      if (response.relatedConcepts && response.relatedConcepts.length > 0) {
        setStudentProgress(prev => ({
          ...prev,
          conceptsInProgress: Array.from(new Set([
            ...prev.conceptsInProgress,
            ...response.relatedConcepts!
          ])),
          lastUpdated: new Date()
        }));
      }

      return response;
    } catch (error) {
      console.error('Error asking question:', error);
      addMessage({
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your question. Please try again.',
        messageType: 'explanation'
      });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  // Explain a concept at specified level
  const explainConcept = async (
    concept: string,
    level: 'like_im_10' | 'high_school' | 'college' | 'expert'
  ): Promise<string> => {
    setIsProcessing(true);
    
    addMessage({
      role: 'user',
      content: `Explain ${concept} at ${level} level`,
      messageType: 'question'
    });

    try {
      const explanation = await aiTutor.explanationEngine.explainConcept(
        concept,
        level,
        documentContent || undefined
      );

      addMessage({
        role: 'assistant',
        content: explanation,
        messageType: 'explanation',
        relatedConcepts: [concept]
      });

      return explanation;
    } catch (error) {
      console.error('Error explaining concept:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  // Solve a problem step by step
  const solveProblem = async (
    problem: string,
    showSteps: boolean = true
  ): Promise<{ steps: ProblemStep[]; finalAnswer: string }> => {
    setIsProcessing(true);
    
    addMessage({
      role: 'user',
      content: problem,
      messageType: 'question'
    });

    try {
      const solution = await aiTutor.problemSolver.solveProblemStepByStep(problem, showSteps);

      const solutionText = showSteps
        ? solution.steps.map(s => 
            `**Step ${s.stepNumber}:** ${s.description}\n${s.explanation ? `_${s.explanation}_` : ''}\n${s.formula || ''}`
          ).join('\n\n') + `\n\n**Final Answer:** ${solution.finalAnswer}`
        : solution.finalAnswer;

      addMessage({
        role: 'assistant',
        content: solutionText,
        messageType: 'problem_solution',
        problemSteps: solution.steps
      });

      return solution;
    } catch (error) {
      console.error('Error solving problem:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  // Get hints for homework help
  const getHints = async (
    problem: string,
    attempt?: string
  ): Promise<{ hints: string[]; commonMistakes: string[] }> => {
    setIsProcessing(true);

    try {
      const guidance = await aiTutor.problemSolver.provideGuidedHints(problem, attempt);

      const hintsText = `**Hints to guide you:**\n${guidance.hints.map((h, i) => `${i + 1}. ${h}`).join('\n')}\n\n**Watch out for these common mistakes:**\n${guidance.commonMistakes.map((m, i) => `${i + 1}. ${m}`).join('\n')}`;

      addMessage({
        role: 'assistant',
        content: hintsText,
        messageType: 'explanation'
      });

      return guidance;
    } catch (error) {
      console.error('Error getting hints:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  // Get analogy for a concept
  const getAnalogy = async (concept: string, domain?: string): Promise<string> => {
    setIsProcessing(true);

    try {
      const analogy = await aiTutor.explanationEngine.generateAnalogy(concept, domain);

      addMessage({
        role: 'assistant',
        content: `**Analogy for ${concept}:**\n\n${analogy}`,
        messageType: 'analogy',
        relatedConcepts: [concept]
      });

      return analogy;
    } catch (error) {
      console.error('Error generating analogy:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  // Get real-world examples
  const getRealWorldExamples = async (concept: string): Promise<string[]> => {
    setIsProcessing(true);

    try {
      const examples = await aiTutor.explanationEngine.provideRealWorldExamples(concept);

      const examplesText = `**Real-world applications of ${concept}:**\n\n${examples.map((ex, i) => `${i + 1}. ${ex}`).join('\n\n')}`;

      addMessage({
        role: 'assistant',
        content: examplesText,
        messageType: 'example',
        relatedConcepts: [concept]
      });

      return examples;
    } catch (error) {
      console.error('Error getting examples:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  // Identify learning gaps
  const identifyGaps = async (): Promise<LearningGap[]> => {
    if (!currentSession) return [];

    setIsProcessing(true);

    try {
      const conversationHistory = currentSession.messages.map(m => 
        `${m.role}: ${m.content}`
      );

      const gaps = await aiTutor.gapAnalyzer.identifyLearningGaps(conversationHistory);

      setStudentProgress(prev => ({
        ...prev,
        learningGaps: gaps,
        lastUpdated: new Date()
      }));

      return gaps;
    } catch (error) {
      console.error('Error identifying gaps:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  // Get remedial questions for a concept
  const getRemedialQuestions = async (concept: string): Promise<string[]> => {
    setIsProcessing(true);

    try {
      const questions = await aiTutor.gapAnalyzer.suggestRemedialQuestions(concept);
      return questions;
    } catch (error) {
      console.error('Error getting remedial questions:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  // Update concept mastery
  const updateMastery = (concept: string, level: number) => {
    setStudentProgress(prev => {
      const newProgress = { ...prev };
      
      if (level >= 0.8) {
        // Mastered
        newProgress.conceptsMastered = Array.from(new Set([...prev.conceptsMastered, concept]));
        newProgress.conceptsInProgress = prev.conceptsInProgress.filter(c => c !== concept);
      } else if (level >= 0.5) {
        // In progress
        if (!prev.conceptsInProgress.includes(concept) && !prev.conceptsMastered.includes(concept)) {
          newProgress.conceptsInProgress = [...prev.conceptsInProgress, concept];
        }
      }

      // Update overall mastery
      const totalConcepts = newProgress.conceptsMastered.length + newProgress.conceptsInProgress.length;
      newProgress.overallMastery = totalConcepts > 0
        ? newProgress.conceptsMastered.length / totalConcepts
        : 0;

      newProgress.lastUpdated = new Date();
      return newProgress;
    });
  };

  // Quick Actions
  const simplifyLastAnswer = async () => {
    if (!currentSession || currentSession.messages.length === 0) return;

    const lastAssistantMessage = [...currentSession.messages]
      .reverse()
      .find(m => m.role === 'assistant');

    if (!lastAssistantMessage) return;

    const simplifiedExplanation = await explainConcept(
      lastAssistantMessage.relatedConcepts?.[0] || 'the previous topic',
      'like_im_10'
    );
  };

  const giveExample = async () => {
    if (!currentSession || currentSession.messages.length === 0) return;

    const lastAssistantMessage = [...currentSession.messages]
      .reverse()
      .find(m => m.role === 'assistant');

    if (!lastAssistantMessage || !lastAssistantMessage.relatedConcepts?.[0]) return;

    await getRealWorldExamples(lastAssistantMessage.relatedConcepts[0]);
  };

  const showSteps = async () => {
    if (!currentSession || currentSession.messages.length === 0) return;

    const lastUserMessage = [...currentSession.messages]
      .reverse()
      .find(m => m.role === 'user');

    if (!lastUserMessage) return;

    await solveProblem(lastUserMessage.content, true);
  };

  const value: TutorContextType = {
    // Conversation Management
    currentSession,
    sessions,
    startNewSession,
    loadSession,
    addMessage,
    
    // AI Interaction
    askQuestion,
    explainConcept,
    solveProblem,
    getHints,
    getAnalogy,
    getRealWorldExamples,
    
    // Learning Management
    studentProgress,
    identifyGaps,
    getRemedialQuestions,
    updateMastery,
    
    // UI State
    isProcessing,
    currentTopic,
    explanationLevel,
    setExplanationLevel,
    
    // Quick Actions
    simplifyLastAnswer,
    giveExample,
    showSteps
  };

  return <TutorContext.Provider value={value}>{children}</TutorContext.Provider>;
};

export const useTutor = () => {
  const context = useContext(TutorContext);
  if (context === undefined) {
    throw new Error('useTutor must be used within a TutorProvider');
  }
  return context;
};
