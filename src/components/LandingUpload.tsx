import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useDocument } from '../contexts/DocumentContext';
import { storageApi, documentsApi, quizzesApi } from '../lib/database.js';
import { geminiService } from '../lib/gemini';
import { useNavigate } from 'react-router-dom';

const LandingUpload: React.FC = () => {
  const { user } = useAuth();
  const { setCurrentDocument, setProcessingStatus, setDocumentContent } = useDocument();
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
      setProgress('');
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !user) {
      setError('Please select a file and ensure you are logged in');
      return;
    }

    setUploading(true);
    setError('');
    setProcessingStatus('processing');
    setProgress('Uploading file to storage...');

    try {
      // 1. Upload file to Supabase Storage
      const fileUrl = await storageApi.uploadDocument(file, user.id);
      setProgress('File uploaded! Processing with AI...');

      // 2. Read file content if it's a text file
      let content = '';
      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        content = await file.text();
      } else {
        // For non-text files, show message
        setProgress('File uploaded! (AI features work best with text files)');
      }

      // 3. Create initial document record
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

      // 4. Process with Gemini AI if we have text content
      let processedContent = content;
      if (content && content.length > 50) {
        try {
          processedContent = await geminiService.extractTextFromContent(content);
          await documentsApi.updateDocumentContent(document.id, processedContent);
          
          // 🎯 AUTO-GENERATE QUIZ
          setProgress('AI is generating quiz from your document...');
          const quiz = await geminiService.generateQuiz(processedContent);
          
          // Save quiz to database
          await quizzesApi.createQuiz({
            user_id: user.id,
            document_id: document.id,
            title: `Quiz: ${document.title}`,
            description: `AI-generated quiz from ${document.title}`,
            questions: quiz.questions,
            quiz_type: 'mixed',
            difficulty: 'medium'
          });
          
          setProgress('✅ Quiz generated successfully!');
          
          // 🎯 AUTO-GENERATE FLASHCARDS
          setProgress('AI is creating flashcards...');
          const flashcards = await geminiService.generateFlashcards(processedContent);
          
          // Save flashcards to database
          await quizzesApi.createFlashcardSet({
            user_id: user.id,
            document_id: document.id,
            title: `Flashcards: ${document.title}`,
            description: `AI-generated flashcards from ${document.title}`,
            flashcards: flashcards.flashcards
          });
          
          setProgress('✅ Flashcards created successfully!');
          
        } catch (aiError) {
          console.error('AI processing error:', aiError);
          setProgress('Document uploaded! (AI processing had some issues)');
        }
      } else if (content) {
        setProgress('Document uploaded! (Content too short for AI processing)');
      } else {
        setProgress('Document uploaded! (AI processing available for text files)');
      }

      // 5. Set document in context and redirect
      setCurrentDocument(document);
      setDocumentContent(processedContent);
      setProcessingStatus('success');

      // 6. Redirect to dashboard after short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);

    } catch (err: any) {
      setError(err.message);
      setProcessingStatus('error');
      setProgress('');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
      <h2 className="text-2xl font-bold text-white mb-4">Upload Your Study Material</h2>
      <p className="text-gray-300 mb-6">
        Upload documents and AI will automatically create quizzes and flashcards.
      </p>

      <form onSubmit={handleUpload} className="space-y-6">
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {progress && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
              {progress}
            </div>
            {uploading && (
              <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full animate-pulse"></div>
              </div>
            )}
          </div>
        )}

        <div className="border-2 border-dashed border-purple-400/50 rounded-xl p-8 text-center hover:border-purple-400/80 transition-colors">
          <input
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            id="landing-file-upload"
            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
            disabled={uploading}
          />
          <label htmlFor="landing-file-upload" className="cursor-pointer block">
            <div className="text-5xl mb-4">📚</div>
            <p className="text-lg font-medium text-white mb-2">
              {file ? file.name : 'Choose a file or drag and drop'}
            </p>
            <p className="text-sm text-gray-300">
              PDF, Word, Text, Images up to 10MB
            </p>
            <button
              type="button"
              className="mt-4 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-semibold"
            >
              Select File
            </button>
          </label>
        </div>

        {file && (
          <div className="bg-purple-500/20 p-4 rounded-lg border border-purple-400/30">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-white font-medium">{file.name}</p>
                <p className="text-purple-200 text-sm">
                  Size: {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFile(null)}
                className="text-purple-300 hover:text-white transition-colors"
                disabled={uploading}
              >
                Remove
              </button>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={!file || uploading}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 px-6 rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 disabled:scale-100"
        >
          {uploading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
              Processing with AI...
            </div>
          ) : (
            'Upload & Generate Learning Materials'
          )}
        </button>
      </form>
    </div>
  );
};

export default LandingUpload;