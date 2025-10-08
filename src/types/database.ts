export type Document = {
  id: string;
  user_id: string;
  title: string;
  content: string | null;
  file_url: string;
  file_type: string;
  file_size: number | null;
  uploaded_at: string;
  processed: boolean;
  created_at: string;
  // Enhanced document processing fields
  semantic_chunks?: string[];  // Content split into semantic chunks for AI processing
  processed_content?: {
    word_count: number;
    character_count: number;
    chunk_count: number;
    extraction_method: string;
  };
  knowledge_graph?: any;  // For future enhancement
};

export type Quiz = {
  id: string;
  document_id: string;
  title: string;
  questions: QuizQuestion[];
  created_at: string;
};

export type QuizQuestion = {
  id: string;
  type: 'mcq' | 'fill_blank' | 'short_answer';
  question: string;
  options?: string[];
  correct_answer: string;
  explanation?: string;
};

export type Flashcard = {
  id: string;
  document_id: string;
  front: string;
  back: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  created_at: string;
};

export type FlashcardSet = {
  id: string;
  user_id: string;
  document_id: string;
  title: string;
  description: string;
  flashcards: Flashcard[];
  created_at: string;
};

export type StudySession = {
  id: string;
  user_id: string;
  document_id: string;
  session_type: 'quiz' | 'flashcards' | 'review';
  score?: number;
  completed_at: string;
  duration_minutes?: number;
};

export type AITutorConversation = {
  id: string;
  user_id: string;
  document_id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

export type AITutorMessage = {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
};

// Enhanced Quiz System Types
export type QuizDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'mixed';
export type QuestionType = 'mcq' | 'true_false' | 'fill_blank' | 'matching' | 'short_answer';

export type EnhancedQuizConfig = {
  numQuestions: number;
  difficulty: QuizDifficulty;
  timePerQuestion?: number;
  topicFocus?: string[];
  includeScenarios: boolean;
  certificationLevel: boolean;
  crossTopicIntegration: boolean;
};

export type EnhancedQuizQuestion = {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[];
  correct_answer: string | string[];
  explanation: string;
  scenario?: string; // For professional scenarios
  timeLimit?: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  topics: string[];
  metadata: {
    isCertificationLevel: boolean;
    requiresApplication: boolean;
    hasRealWorldContext: boolean;
  };
};

export type EnhancedQuiz = {
  id: string;
  user_id: string;
  document_id: string;
  title: string;
  description: string;
  questions: EnhancedQuizQuestion[];
  config: EnhancedQuizConfig;
  created_at: string;
  stats: {
    totalAttempts: number;
    averageScore: number;
    bestScore: number;
  };
};

// Intelligent Flashcard System Types
export type RelationshipType = 'causal' | 'conceptual' | 'dependency' | 'contradiction' | 'synthesis';

export type IntelligentFlashcard = {
  id: string;
  front: string;
  back: string;
  relationshipType: RelationshipType;
  connectedConcepts: string[];
  strength: number; // 1-10
  complexity: 'low' | 'medium' | 'high';
  insights: string[];
  metadata: {
    isHiddenRelationship: boolean;
    requiresCrossTopic: boolean;
    hasRealWorldApplication: boolean;
  };
};

export type ConceptNode = {
  id: string;
  label: string;
  importance: number; // 1-100
  connections: {
    target: string;
    type: RelationshipType;
    strength: number;
    description: string;
  }[];
  cluster: string;
};

export type IntelligenceNetwork = {
  nodes: ConceptNode[];
  relationships: {
    source: string;
    target: string;
    type: RelationshipType;
    strength: number;
    description: string;
  }[];
  insights: {
    complexity: number;
    keyConcepts: string[];
    knowledgeGaps: string[];
    learningPathways: string[][];
  };
};

// Advanced Quiz Configuration System Types
export type QuizConfig = {
  questionCount: number;
  difficulty: QuizDifficulty;
  questionTypes: QuestionType[];
  timePerQuestion?: number;
  enableTiming: boolean;
  professionalScenarios: boolean;
  certificationLevel: boolean;
  crossTopicIntegration: boolean;
  focusTopics?: string[];
};

export type AdvancedQuizQuestion = {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[];
  correct_answer: string | string[];
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
  professionalScenario?: string;
  timeLimit?: number;
  metadata: {
    crossTopic: boolean;
    requiresAnalysis: boolean;
    answerDistribution: 'balanced' | 'random';
  };
};

export type QuizSession = {
  id: string;
  user_id: string;
  document_id: string;
  config: QuizConfig;
  questions: AdvancedQuizQuestion[];
  currentQuestion: number;
  score: number;
  timeSpent: number;
  completed: boolean;
  startedAt: string;
  completedAt?: string;
  answers: { [questionId: string]: string };
};