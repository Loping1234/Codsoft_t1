import React, { useState, useEffect } from 'react';
import { useDocument } from '../contexts/DocumentContext';
import { generateAutoScaledQuiz, generateAutoScaledQuizDirect, calculateQuestionCount } from '../lib/quizGenerator';
import { useNavigate } from 'react-router-dom';
import QuizSession from '../components/quiz/QuizSession';

const SimpleQuiz: React.FC = () => {
  const { currentDocument, documentContent } = useDocument();
  const navigate = useNavigate();
  
  const [difficulty, setDifficulty] = useState('intermediate');
  const [customTopics, setCustomTopics] = useState('');
  const [generating, setGenerating] = useState(false);
  const [quiz, setQuiz] = useState<any>(null);
  const [estimatedInfo, setEstimatedInfo] = useState<any>(null);
  const [hideDocumentSection, setHideDocumentSection] = useState(false);

  useEffect(() => {
    if (!currentDocument) {
      navigate('/dashboard');
      return;
    }

    // Auto-calculate estimated questions when document/content changes
    if (documentContent) {
      const wordCount = documentContent.trim().split(/\s+/).length;
      const questionCount = calculateQuestionCount(documentContent, difficulty);
      const estimatedTime = Math.ceil(questionCount * (difficulty === 'expert' ? 2.5 : difficulty === 'advanced' ? 1.5 : 1));
      
      setEstimatedInfo({
        questionCount,
        wordCount,
        estimatedTime
      });
    }
  }, [currentDocument, documentContent, difficulty, navigate]);

  const handleGenerateQuiz = async () => {
    if (!documentContent) return;

    setGenerating(true);
    try {
      // Try the SDK approach first
      let generatedQuiz;
      try {
        generatedQuiz = await generateAutoScaledQuiz(
          documentContent, 
          difficulty, 
          customTopics
        );
      } catch (sdkError) {
        console.log('SDK approach failed, trying direct API:', sdkError);
        // Fallback to direct API call
        generatedQuiz = await generateAutoScaledQuizDirect(
          documentContent, 
          difficulty, 
          customTopics
        );
      }
      setQuiz(generatedQuiz);
    } catch (error) {
      console.error('Failed to generate quiz:', error);
      alert('Failed to generate quiz. Please check your API key and try again.');
    } finally {
      setGenerating(false);
    }
  };

  if (!currentDocument) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">No Document Found</h2>
          <p>Please upload a document first to generate quizzes.</p>
        </div>
      </div>
    );
  }

  if (quiz) {
    return <QuizSession quiz={quiz} onBack={() => setQuiz(null)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-purple-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">🎯 Smart Quiz Generator</h1>
          <p className="text-xl text-gray-300">
            AI-powered assessments automatically scaled to your content
          </p>
        </div>

        {/* Document Info */}
        {!hideDocumentSection && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold mb-2">Current Document</h2>
                <p className="text-gray-300">{currentDocument.title}</p>
                {estimatedInfo && (
                  <p className="text-sm text-gray-400 mt-1">
                    {estimatedInfo.wordCount.toLocaleString()} words • Auto-scaled to {estimatedInfo.questionCount} questions
                  </p>
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Change Document
                </button>
                <button
                  onClick={() => setHideDocumentSection(true)}
                  className="text-gray-400 hover:text-white transition-colors text-lg px-3"
                  title="Hide document section"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Configuration Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Difficulty */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4 text-yellow-400">🎯 Difficulty Level</h3>
                <div className="space-y-3">
                  {[
                    { id: 'beginner', name: '🌱 Beginner', desc: 'More questions, basic recall' },
                    { id: 'intermediate', name: '📈 Intermediate', desc: 'Balanced coverage' },
                    { id: 'advanced', name: '🎓 Advanced', desc: 'Fewer, deeper questions' },
                    { id: 'expert', name: '🏆 Expert', desc: 'Minimal, highly complex' },
                    { id: 'mixed', name: '🎯 Mixed', desc: 'All difficulty levels' }
                  ].map((level) => (
                    <button
                      key={level.id}
                      onClick={() => setDifficulty(level.id)}
                      className={`w-full text-left p-4 rounded-xl border transition-all ${
                        difficulty === level.id
                          ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400'
                          : 'bg-white/5 border-white/10 text-gray-300 hover:border-yellow-400/30'
                      }`}
                    >
                      <div className="font-semibold">{level.name}</div>
                      <div className="text-sm opacity-80">{level.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Estimated Info */}
              {estimatedInfo && (
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <h4 className="font-semibold mb-2 text-green-400">📊 Quiz Estimate</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Questions:</span>
                      <span className="font-semibold">{estimatedInfo.questionCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Estimated Time:</span>
                      <span className="font-semibold">~{estimatedInfo.estimatedTime} min</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Content Size:</span>
                      <span className="font-semibold">{estimatedInfo.wordCount.toLocaleString()} words</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Custom Topics */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4 text-purple-400">🎯 Custom Topics (Optional)</h3>
                <div className="space-y-4">
                  <textarea
                    value={customTopics}
                    onChange={(e) => setCustomTopics(e.target.value)}
                    placeholder="e.g., neural networks, optimization algorithms, regularization techniques"
                    className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none transition-colors"
                  />
                  <div className="text-sm text-gray-400">
                    💡 Leave blank for comprehensive coverage of all content
                  </div>
                </div>
              </div>

              {/* Advanced Features */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <h4 className="font-semibold mb-3 text-blue-400">🧠 AI Features</h4>
                <div className="space-y-2 text-sm text-gray-300">
                  <div className="flex items-center space-x-2">
                    <span>✅</span>
                    <span>Professional real-world scenarios</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>✅</span>
                    <span>Balanced answer distribution</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>✅</span>
                    <span>Cross-topic integration</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>✅</span>
                    <span>Certification-level quality</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <div className="mt-8 text-center">
            <button
              onClick={handleGenerateQuiz}
              disabled={generating}
              className="bg-gradient-to-r from-yellow-600 to-yellow-700 text-white py-4 px-12 rounded-xl font-bold text-lg hover:from-yellow-500 hover:to-yellow-600 transition-all transform hover:scale-105 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
            >
              {generating ? (
                <div className="flex items-center justify-center space-x-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Generating Smart Quiz...</span>
                </div>
              ) : (
                '🚀 Generate Professional Quiz'
              )}
            </button>
          </div>
        </div>

        {/* Auto-scaling Explanation */}
        <div className="mt-8 bg-white/5 rounded-xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold mb-3 text-green-400">🤖 How Auto-Scaling Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
            <div>
              <h4 className="font-semibold mb-2">Content Size → Question Count</h4>
              <ul className="space-y-1">
                <li>• Short notes (200 words) → 5-6 questions</li>
                <li>• Article (1,000 words) → 12-15 questions</li>
                <li>• Chapter (3,500 words) → 25-30 questions</li>
                <li>• Document (10,000 words) → 50-65 questions</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Difficulty Adjustment</h4>
              <ul className="space-y-1">
                <li>• Beginner: 20% more questions, simpler</li>
                <li>• Intermediate: Balanced coverage</li>
                <li>• Advanced: 15% fewer, deeper questions</li>
                <li>• Expert: 30% fewer, highly complex</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleQuiz;