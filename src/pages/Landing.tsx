import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useDocument } from '../contexts/DocumentContext';
import { storageApi, documentsApi, quizzesApi } from '../lib/database';
import { geminiService } from '../lib/gemini';
import { useNavigate } from 'react-router-dom';

const Landing: React.FC = () => {
  const { user } = useAuth();
  const { setCurrentDocument, setProcessingStatus, setDocumentContent } = useDocument();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    setError('');

    try {
      // 1. Upload file to Supabase Storage
      const fileUrl = await storageApi.uploadDocument(file, user.id);

      // 2. Try to extract text from any file type
      let content = '';
      let canProcessWithAI = false;
      
      try {
        // For binary files (Word, PDF, etc.), don't try to read as text
        if (file.type.includes('application/') && 
            !file.type.includes('json') && 
            !file.type.includes('xml') &&
            !file.type.includes('javascript')) {
          // Handle binary files
          content = `Binary file uploaded: ${file.name} (${file.type}, ${(file.size / 1024).toFixed(1)} KB)`;
          canProcessWithAI = false; // We'll use filename-based processing
        } 
        // Only try to read as text for actual text files
        else if (file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
          content = await file.text();
          if (content && content.length > 20) {
            canProcessWithAI = true;
          } else {
            content = `Text file uploaded but empty: ${file.name}`;
          }
        }
        // For unknown types, try carefully
        else {
          try {
            const testContent = await file.text();
            // Check if content contains null bytes or excessive binary data
            if (testContent.includes('\u0000') || testContent.includes('\uFFFD')) {
              content = `File uploaded: ${file.name} (${file.type}, ${(file.size / 1024).toFixed(1)} KB) - binary content detected`;
            } else {
              // Check for readable text ratio
              const readableChars = testContent.match(/[a-zA-Z0-9\s.,!?;:-]/g) || [];
              const textRatio = readableChars.length / testContent.length;
              
              if (textRatio > 0.7) { // High text ratio
                content = testContent;
                canProcessWithAI = true;
              } else {
                content = `File uploaded: ${file.name} (${file.type}, ${(file.size / 1024).toFixed(1)} KB) - mixed content`;
              }
            }
          } catch {
            content = `File uploaded: ${file.name} (${file.type}, ${(file.size / 1024).toFixed(1)} KB)`;
          }
        }
      } catch (extractionError) {
        // Fallback for any extraction errors
        content = `File uploaded: ${file.name} (${file.type}, ${(file.size / 1024).toFixed(1)} KB)`;
      }

      // 3. Create document record
      const document = await documentsApi.createDocument({
        user_id: user.id,
        title: file.name,
        content: content,
        file_url: fileUrl,
        file_type: file.type,
        file_size: file.size,
        uploaded_at: new Date().toISOString(),
        processed: false
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
        console.log('AI processing error:', aiError);
        // Even if AI processing fails, we still have the document uploaded
      }

      // 5. Set document and redirect
      setCurrentDocument(document);
      setDocumentContent(processedContent);
      setProcessingStatus('success');
      navigate('/dashboard');

    } catch (err: any) {
      setError(err.message);
      setProcessingStatus('error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen text-white">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
        accept="*/*"
      />

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            StudyAI
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Upload any study material - AI will create quizzes and flashcards automatically
          </p>

          {user ? (
            <div className="max-w-2xl mx-auto">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                <h2 className="text-2xl font-bold text-white mb-4">Upload Study Material</h2>
                <p className="text-gray-300 mb-6">
                  Select any file - AI will automatically process it and create learning materials
                </p>
                
                {error && (
                  <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-4">
                    {error}
                  </div>
                )}
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 px-6 rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 transition-all transform hover:scale-105 disabled:scale-100"
                >
                  {uploading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Uploading...
                    </div>
                  ) : (
                    'Select File to Upload'
                  )}
                </button>
                <p className="text-sm text-gray-400 mt-4">
                  All file types supported • AI features work best with text content
                </p>
              </div>
            </div>
          ) : (
            <div className="space-x-4">
              <Link
                to="/auth"
                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
              >
                Get Started Free
              </Link>
              <Link
                to="/auth"
                className="border border-purple-600 text-purple-400 hover:bg-purple-600 hover:text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-slate-800 py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-purple-600 w-20 h-20 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                📚
              </div>
              <h3 className="text-xl font-semibold mb-2">Upload Any File</h3>
              <p className="text-gray-400">PDFs, Word docs, text files, images</p>
            </div>
            <div className="text-center">
              <div className="bg-pink-600 w-20 h-20 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                🤖
              </div>
              <h3 className="text-xl font-semibold mb-2">AI Processing</h3>
              <p className="text-gray-400">Automatically analyzes content</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-600 w-20 h-20 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                🎯
              </div>
              <h3 className="text-xl font-semibold mb-2">Learn & Practice</h3>
              <p className="text-gray-400">Quizzes, flashcards, AI tutor</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;