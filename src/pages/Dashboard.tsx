import React, { useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useDocument } from '../contexts/DocumentContext';
import { storageApi, documentsApi, quizzesApi } from '../lib/database';
import { geminiService } from '../lib/gemini';
import { useNavigate } from 'react-router-dom';
import { DocumentProcessor } from '../utils/documentProcessor';

const Dashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const { currentDocument, processingStatus, clearDocument, setCurrentDocument, setProcessingStatus, setDocumentContent } = useDocument();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    // Directly trigger file input instead of redirecting
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file before processing
    const validation = DocumentProcessor.validateFile(file, 50);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    try {
      setProcessingStatus('processing');

      // 1. Upload file to Supabase Storage
      const fileUrl = await storageApi.uploadDocument(file, user.id);

      // 2. Extract text using DocumentProcessor (supports PDF, Word, Text)
      let content = '';
      let chunks: string[] = [];
      let canProcessWithAI = false;
      
      try {
        console.log(`Processing ${file.name} (${file.type})...`);
        
        // Use DocumentProcessor to extract text from PDF, Word, or Text files
        const processed = await DocumentProcessor.processDocument(file);
        content = processed.content;
        chunks = processed.chunks;
        canProcessWithAI = true;
        
        console.log(`✅ Extracted ${processed.metadata.wordCount} words from ${file.name}`);
        console.log(`📄 Created ${processed.metadata.chunkCount} semantic chunks`);
        
      } catch (extractionError) {
        console.error('Text extraction failed:', extractionError);
        // Fallback to filename-based processing
        content = `File uploaded: ${file.name} (${file.type}, ${(file.size / 1024).toFixed(1)} KB)`;
        content += `\n\nNote: Automatic text extraction failed. ${extractionError instanceof Error ? extractionError.message : ''}`;
        canProcessWithAI = false;
      }

      // 3. Create initial document record with semantic chunks
      const document = await documentsApi.createDocument({
        user_id: user.id,
        title: file.name,
        content: content,
        file_url: fileUrl,
        file_type: file.type,
        file_size: file.size,
        uploaded_at: new Date().toISOString(),
        processed: canProcessWithAI,
        // Store semantic chunks for better AI processing
        semantic_chunks: chunks.length > 0 ? chunks : undefined,
        processed_content: canProcessWithAI ? {
          word_count: content.split(/\s+/).filter(w => w.length > 0).length,
          character_count: content.length,
          chunk_count: chunks.length,
          extraction_method: file.name.toLowerCase().endsWith('.pdf') ? 'pdf-parse' : 
                            file.name.toLowerCase().endsWith('.docx') ? 'mammoth' : 'text'
        } : undefined
      });

      // 4. ALWAYS try to process with Gemini AI for ANY file type
      let processedContent = content;

      try {
        // If we have extractable text content, process it normally
        if (canProcessWithAI && content && content.length > 50) {
          processedContent = await geminiService.extractTextFromContent(content);
          await documentsApi.updateDocumentContent(document.id, processedContent);
          
          // Generate quiz from extracted content
          const quiz = await geminiService.generateQuiz(processedContent);
          await quizzesApi.createQuiz({
            user_id: user.id,
            document_id: document.id,
            title: `Quiz: ${document.title}`,
            description: `AI-generated quiz from ${document.title}`,
            questions: quiz.questions,
            quiz_type: 'mixed',
            difficulty: 'medium'
          });
          
          // Generate flashcards from extracted content
          const flashcards = await geminiService.generateFlashcards(processedContent);
          await quizzesApi.createFlashcardSet({
            user_id: user.id,
            document_id: document.id,
            title: `Flashcards: ${document.title}`,
            description: `AI-generated flashcards from ${document.title}`,
            flashcards: flashcards.flashcards
          });
        } 
        // For files without extractable text, try alternative approaches
        else {
          // Try to generate quiz using whatever content we have, even if it's limited
          const limitedContentPrompt = `Based on this file information, create an educational quiz:
          
          File name: "${file.name}"
          File type: ${file.type}
          File size: ${(file.size / 1024).toFixed(1)} KB
          Available content preview: "${content.substring(0, 500)}"
          
          Analyze the filename, file type, and any available content to create relevant educational questions.
          If the filename suggests a specific subject (like "biology_chapter1.pdf" or "math_homework.docx"), 
          create questions related to that subject.
          
          Create 5 multiple choice questions that would be appropriate for this type of educational material.`;
          
          const quiz = await geminiService.generateQuizFromPrompt(limitedContentPrompt);
          await quizzesApi.createQuiz({
            user_id: user.id,
            document_id: document.id,
            title: `Quiz: ${document.title}`,
            description: `AI-generated quiz based on file analysis`,
            questions: quiz.questions,
            quiz_type: 'mixed',
            difficulty: 'medium'
          });
          
          const flashcardsPrompt = `Based on this file information, create educational flashcards:
          
          File name: "${file.name}"
          File type: ${file.type}
          Available content preview: "${content.substring(0, 500)}"
          
          Create relevant study flashcards based on what this file likely contains.`;
          
          const flashcards = await geminiService.generateFlashcardsFromPrompt(flashcardsPrompt);
          await quizzesApi.createFlashcardSet({
            user_id: user.id,
            document_id: document.id,
            title: `Flashcards: ${document.title}`,
            description: `AI-generated flashcards based on file analysis`,
            flashcards: flashcards.flashcards
          });
        }
      } catch (aiError) {
        console.error('AI processing error:', aiError);
        // Even if AI processing fails, we still have the document uploaded
      }

      // 5. Set document in context
      setCurrentDocument(document);
      setDocumentContent(processedContent);
      setProcessingStatus('success');

    } catch (err: any) {
      console.error('Upload error:', err);
      setProcessingStatus('error');
      
      // Show user-friendly error message
      let errorMessage = 'Upload failed. Please try again.';
      if (err.message) {
        if (err.message.includes('maximum allowed size') || err.message.includes('File too large')) {
          errorMessage = 'File is too large. Please select a file smaller than 50MB.';
        } else if (err.message.includes('network') || err.message.includes('connection')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else {
          errorMessage = err.message;
        }
      }
      
      alert(errorMessage);
    }
  };

  const features = [
    {
      title: 'Take Quiz',
      description: 'Smart AI quizzes auto-scaled to your content',
      path: '/simple-quiz',
      color: 'bg-blue-500',
      icon: '🎯',
      requiresDocument: true
    },
    {
      title: 'Flashcards',
      description: 'Study with smart flashcards',
      path: '/flashcards',
      color: 'bg-green-500',
      icon: '📇',
      requiresDocument: true
    },
    {
      title: 'AI Tutor',
      description: 'Get personalized explanations',
      path: '/ai-tutor',
      color: 'bg-purple-500',
      icon: '🤖',
      requiresDocument: true
    },
    {
      title: 'Study Planner',
      description: 'Plan your study schedule',
      path: '/planner',
      color: 'bg-yellow-500',
      icon: '📅',
      requiresDocument: false
    },
    {
      title: 'Analytics',
      description: 'Track your learning progress',
      path: '/analytics',
      color: 'bg-red-500',
      icon: '📊',
      requiresDocument: false
    }
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Learning Dashboard</h1>
            <p className="text-gray-600">Welcome back, {user?.email}</p>
          </div>
          <button
            onClick={signOut}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
          >
            Sign Out
          </button>
        </div>

        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          accept="*/*"
        />

        {/* Current Document Section - SIMPLIFIED */}
        {currentDocument ? (
          <div className="bg-white rounded-lg shadow p-6 mb-8 border-l-4 border-green-500">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="text-3xl">📚</div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {currentDocument.title}
                  </h2>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                    <span className="flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      {currentDocument.file_type === 'text/plain' ? 'Ready for AI learning' : 'File uploaded'}
                    </span>
                    <span>•</span>
                    <span>{currentDocument.file_type}</span>
                    <span>•</span>
                    <span>{(currentDocument.file_size! / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                  {currentDocument.file_type !== 'text/plain' && (
                    <div className="mt-2 text-sm text-orange-600">
                      ⚠️ AI features work best with .txt files
                    </div>
                  )}
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleUploadClick}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm"
                >
                  Upload New
                </button>
                <button
                  onClick={clearDocument}
                  className="text-gray-400 hover:text-red-500 transition-colors text-lg"
                  title="Remove current document"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="text-yellow-600 text-2xl mr-4">💡</div>
                <div>
                  <h3 className="text-lg font-semibold text-yellow-800">
                    No study material uploaded
                  </h3>
                  <p className="text-yellow-700">
                    Upload a document to unlock AI-powered quizzes, flashcards, and study tools.
                  </p>
                  <p className="text-yellow-600 text-sm mt-1">
                    Supports all file types • Maximum size: 50MB
                  </p>
                </div>
              </div>
              <button
                onClick={handleUploadClick}
                className="bg-yellow-500 text-white px-6 py-3 rounded-lg hover:bg-yellow-600 transition-colors font-semibold"
              >
                Upload Document
              </button>
            </div>
          </div>
        )}

        {/* Processing Status */}
        {processingStatus === 'processing' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
              <span className="text-blue-700">AI is processing your document...</span>
            </div>
          </div>
        )}

        {/* Error Status */}
        {processingStatus === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="text-red-500 text-xl mr-3">⚠️</div>
                <div>
                  <span className="text-red-700 font-medium">Upload failed</span>
                  <p className="text-red-600 text-sm mt-1">
                    Please check file size (max 50MB) and try again.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setProcessingStatus('idle')}
                className="text-red-400 hover:text-red-600 transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* MAIN FEATURES GRID - ONLY THIS SECTION FOR FEATURES */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`bg-white rounded-lg shadow p-6 transition-transform hover:scale-105 ${
                feature.requiresDocument && !currentDocument 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'cursor-pointer hover:shadow-md'
              }`}
              onClick={() => {
                if (!feature.requiresDocument || currentDocument) {
                  navigate(feature.path);
                }
              }}
            >
              <div className={`${feature.color} w-12 h-12 rounded-lg flex items-center justify-center text-white text-2xl mb-4`}>
                {feature.icon}
              </div>
              <h2 className="text-xl font-semibold mb-2">{feature.title}</h2>
              <p className="text-gray-600">{feature.description}</p>
              
              {feature.requiresDocument && !currentDocument && (
                <div className="mt-2 text-xs text-orange-600 font-medium">
                  Requires uploaded document
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;