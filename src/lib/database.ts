import { supabase } from './supabase';
import type { Document, Quiz, FlashcardSet, AITutorConversation, AITutorMessage } from '../types/database';

// File Upload function
export const storageApi = {
  uploadDocument: async (file: File, userId: string): Promise<string> => {
    // Additional file size check
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      throw new Error(`File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds maximum allowed size of 50MB`);
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    console.log('Uploading file:', { fileName, filePath, size: file.size, sizeMB: (file.size / 1024 / 1024).toFixed(1) });

    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Storage upload error:', error);
        
        // Handle specific error types
        if (error.message.includes('maximum allowed size')) {
          throw new Error('File too large. Please select a file smaller than 50MB.');
        }
        if (error.message.includes('certificate') || error.message.includes('SSL') || error.message.includes('ERR_CERT')) {
          throw new Error('Connection Error: Invalid SSL certificate. Please check your Supabase project configuration or contact support.');
        }
        if (error.message.includes('Failed to fetch') || error.message.includes('network')) {
          throw new Error('Network Error: Unable to connect to storage server. Please check your internet connection and Supabase project status.');
        }
        
        throw new Error(`Upload failed: ${error.message}`);
      }
      
      console.log('File uploaded successfully:', data);
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (error: any) {
      console.error('Upload error:', error);
      
      // Provide user-friendly error messages
      if (error.message?.includes('certificate') || error.message?.includes('SSL') || error.message?.includes('ERR_CERT')) {
        throw new Error('⚠️ SSL Certificate Error: Your Supabase instance has an invalid SSL certificate. Please verify your Supabase project URL or create a new project.');
      }
      if (error.message?.includes('Failed to fetch')) {
        throw new Error('⚠️ Connection Failed: Unable to reach Supabase storage. Please check your internet connection and Supabase project settings.');
      }
      
      throw error;
    }
  },
};

// Documents API functions
export const documentsApi = {
  // Get all documents for a user
  getDocuments: async (userId: string): Promise<Document[]> => {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Create a new document record
  createDocument: async (document: Omit<Document, 'id' | 'created_at'>): Promise<Document> => {
    console.log('Creating document record:', document);

    const { data, error } = await supabase
      .from('documents')
      .insert([document])
      .select()
      .single();
    
    if (error) {
      console.error('Database insert error:', error);
      throw error;
    }

    console.log('Document record created:', data);
    return data;
  },

  // Get a single document by ID
  getDocument: async (id: string): Promise<Document | null> => {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    
    return data;
  },

  // Update document content after processing
  updateDocument: async (id: string, updates: Partial<Document>): Promise<Document> => {
    const { data, error } = await supabase
      .from('documents')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update document content after AI processing
  updateDocumentContent: async (id: string, content: string): Promise<void> => {
    const { error } = await supabase
      .from('documents')
      .update({ 
        content: content, 
        processed: true 
      })
      .eq('id', id);
    
    if (error) throw error;
  },

  // Delete a document
  deleteDocument: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Quiz API functions
export const quizzesApi = {
  // Create a new quiz
  createQuiz: async (quiz: {
    user_id: string;
    document_id: string | null;
    title: string;
    description: string;
    questions: any[];
    quiz_type: string;
    difficulty: string;
  }): Promise<any> => {
    const { data, error } = await supabase
      .from('quizzes')
      .insert([quiz])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get all quizzes for a user
  getQuizzes: async (userId: string): Promise<any[]> => {
    const { data, error } = await supabase
      .from('quizzes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Get a single quiz by ID
  getQuiz: async (id: string): Promise<any | null> => {
    const { data, error } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    
    return data;
  },

  // Delete a quiz
  deleteQuiz: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('quizzes')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Get quizzes by document ID
  getQuizzesByDocument: async (documentId: string): Promise<Quiz[]> => {
    const { data, error } = await supabase
      .from('quizzes')
      .select('*')
      .eq('document_id', documentId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Create flashcard set
  createFlashcardSet: async (set: Omit<FlashcardSet, 'id' | 'created_at'>): Promise<FlashcardSet> => {
    const { data, error } = await supabase
      .from('flashcard_sets')
      .insert([set])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get flashcard sets by document ID
  getFlashcardSetsByDocument: async (documentId: string): Promise<FlashcardSet[]> => {
    const { data, error } = await supabase
      .from('flashcard_sets')
      .select('*')
      .eq('document_id', documentId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }
};

// AI Tutor Database Functions
export const aiTutorApi = {
  // Conversations
  getConversations: async (documentId: string): Promise<AITutorConversation[]> => {
    const { data, error } = await supabase
      .from('ai_tutor_conversations')
      .select('*')
      .eq('document_id', documentId)
      .order('updated_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  createConversation: async (conversation: Omit<AITutorConversation, 'id' | 'created_at' | 'updated_at'>): Promise<AITutorConversation> => {
    const { data, error } = await supabase
      .from('ai_tutor_conversations')
      .insert([conversation])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  updateConversation: async (id: string, updates: Partial<AITutorConversation>): Promise<void> => {
    const { error } = await supabase
      .from('ai_tutor_conversations')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);
    
    if (error) throw error;
  },

  deleteConversation: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('ai_tutor_conversations')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Messages
  getMessages: async (conversationId: string): Promise<AITutorMessage[]> => {
    const { data, error } = await supabase
      .from('ai_tutor_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  createMessage: async (message: Omit<AITutorMessage, 'id' | 'created_at'>): Promise<AITutorMessage> => {
    const { data, error } = await supabase
      .from('ai_tutor_messages')
      .insert([message])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get conversation with messages
  getConversationWithMessages: async (conversationId: string): Promise<{ conversation: AITutorConversation; messages: AITutorMessage[] }> => {
    const [conversationData, messagesData] = await Promise.all([
      supabase
        .from('ai_tutor_conversations')
        .select('*')
        .eq('id', conversationId)
        .single(),
      supabase
        .from('ai_tutor_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
    ]);

    if (conversationData.error) throw conversationData.error;
    if (messagesData.error) throw messagesData.error;

    return {
      conversation: conversationData.data,
      messages: messagesData.data || []
    };
  }
};