import React, { useRef } from 'react';
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

  const features = [
    {
      icon: '🎯',
      title: 'AI Quiz Generation',
      description: 'Automatically create quizzes from your study materials'
    },
    {
      icon: '📇',
      title: 'Smart Flashcards',
      description: 'Generate flashcards with key concepts from your content'
    },
    {
      icon: '🤖',
      title: 'AI Tutor',
      description: 'Get personalized explanations based on your materials'
    }
  ];

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      setProcessingStatus('processing');

      // 1. Upload file to Supabase Storage
      const fileUrl = await storageApi.uploadDocument(file, user.id);

      // 2. Handle different file types
      let content = '';
      let canProcessWithAI = false;
      
      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        content = await file.text();
        canProcessWithAI = true;
      } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        // For PDFs, we'll store the file but can't extract text in frontend
        content = 'PDF file - text extraction requires backend processing';
        canProcessWithAI = false;
      } else {
        content = `File type: ${file.type} - AI processing requires text content`;
        canProcessWithAI = false;
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

      // 4. Process with Gemini AI only if we have text content
      let processedContent = content;
      if (canProcessWithAI && content && content.length > 50) {
        try {
          processedContent = await geminiService.extractTextFromContent(content);
          await documentsApi.updateDocumentContent(document.id, processedContent);
          
          // Auto-generate quiz
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
          
          // Auto-generate flashcards
          const flashcards = await geminiService.generateFlashcards(processedContent);
          await quizzesApi.createFlashcardSet({
            user_id: user.id,
            document_id: document.id,
            title: `Flashcards: ${document.title}`,
            description: `AI-generated flashcards from ${document.title}`,
            flashcards: flashcards.flashcards
          });
          
        } catch (aiError) {
          console.error('AI processing error:', aiError);
        }
      }

      // 5. Set document in context and redirect to dashboard
      setCurrentDocument(document);
      setDocumentContent(processedContent);
      setProcessingStatus('success');
      
      // Redirect to dashboard
      navigate('/dashboard');

    } catch (err: any) {
      console.error('Upload error:', err);
      setProcessingStatus('error');
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
        accept=".txt,.pdf,.doc,.docx"
      />

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            StudyAI
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Revolutionize your learning with AI-powered assessments
          </p>
          
          {user ? (
            <div className="max-w-2xl mx-auto">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                <h2 className="text-2xl font-bold text-white mb-4">Ready to Learn?</h2>
                <p className="text-gray-300 mb-6">
                  Select a text file to automatically generate quizzes and flashcards.
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 px-6 rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105"
                >
                  Select Study Material
                </button>
                <p className="text-sm text-gray-400 mt-4">
                  <strong>Supported:</strong> .txt files (PDF support coming soon)
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  Or <Link to="/dashboard" className="text-purple-400 hover:text-purple-300">go to dashboard</Link>
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

      {/* Features Section - Only show for non-authenticated users */}
      {!user && (
        <div className="bg-slate-800 py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-12">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div key={index} className="text-center">
                  <div className="bg-purple-600 w-20 h-20 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-400">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Landing;