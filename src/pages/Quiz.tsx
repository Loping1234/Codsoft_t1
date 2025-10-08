import React, { useState, useEffect, useRef } from 'react';
import { useDocument } from '../contexts/DocumentContext';
import { useAuth } from '../contexts/AuthContext';
import { quizzesApi } from '../lib/database.js';
import { enhancedQuizGenerator } from '../lib/enhancedQuizGenerator';
import { useNavigate } from 'react-router-dom';
import QuizConfigurator from '../components/QuizConfigurator';
import type { EnhancedQuizConfig } from '../types/database';

const Quiz: React.FC = () => {
  const { currentDocument, documentContent } = useDocument();
  const { user } = useAuth();
  const navigate = useNavigate();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const [quiz, setQuiz] = useState<any>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [showConfig, setShowConfig] = useState(true);
  const [userAnswers, setUserAnswers] = useState<Array<{
    questionIndex: number;
    question: string;
    selectedAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    timeSpent: number;
    explanation: string;
  }>>([]);

  // Timer effect
  useEffect(() => {
    if (timeLeft > 0 && !showResults) {
      timerRef.current = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (timeLeft === 0 && quiz && !showResults) {
      handleAnswer(''); // Auto-submit empty answer when time runs out
    }
    
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [timeLeft, showResults, quiz]);

  useEffect(() => {
    if (!currentDocument) {
      navigate('/dashboard');
      return;
    }
  }, [currentDocument, navigate]);

  const handleConfigSubmit = async (config: EnhancedQuizConfig) => {
    if (!currentDocument || !user || !documentContent) return;

    setLoading(true);
    setError('');
    setShowConfig(false);

    try {
      const { questions } = await enhancedQuizGenerator.generateCertificationQuiz(
        documentContent,
        config
      );

      const enhancedQuiz = await quizzesApi.createQuiz({
        user_id: user.id,
        document_id: currentDocument.id,
        title: `Advanced Quiz: ${currentDocument.title}`,
        description: `${config.difficulty} level quiz with ${config.numQuestions} certification questions`,
        questions: questions,
        quiz_type: 'enhanced',
        difficulty: config.difficulty
      });

      // Store config in the quiz object for runtime use
      enhancedQuiz.config = config;

      setQuiz(enhancedQuiz);
      
      // Start timer for first question if time limit is set
      if (config.timePerQuestion && config.timePerQuestion > 0) {
        setTimeLeft(config.timePerQuestion);
      }

    } catch (err: any) {
      setError('Failed to generate quiz: ' + err.message);
      setShowConfig(true);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (answer: string) => {
    const currentQuestion = quiz?.questions[currentQuestionIndex];
    if (!currentQuestion) return;

    const isCorrect = answer === currentQuestion.correct_answer;
    
    if (isCorrect) {
      setScore(score + 1);
    }

    // Calculate time spent on this question
    const config = quiz?.config as EnhancedQuizConfig | undefined;
    const totalTime = config?.timePerQuestion || 60;
    const timeSpent = totalTime - timeLeft;

    // Record detailed answer info for results
    const answerRecord = {
      questionIndex: currentQuestionIndex,
      question: currentQuestion.question,
      selectedAnswer: answer,
      correctAnswer: currentQuestion.correct_answer,
      isCorrect,
      timeSpent,
      explanation: currentQuestion.explanation || ''
    };

    setUserAnswers([...userAnswers, answerRecord]);

    // Move to next question or show results
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      // Reset timer for next question
      if (config?.timePerQuestion && config.timePerQuestion > 0) {
        setTimeLeft(config.timePerQuestion);
      }
    } else {
      setShowResults(true);
    }
  };

  const restartQuiz = () => {
    setCurrentQuestionIndex(0);
    setScore(0);
    setShowResults(false);
    setUserAnswers([]);
    setShowConfig(true);
  };

  if (!currentDocument) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">No Document Found</h2>
          <p>Please upload a document first to access quizzes.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl text-white">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Enhanced AI Quiz
              </h1>
              <p className="text-gray-600">
                Certification-level questions from: <span className="font-medium">{currentDocument.title}</span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {quiz && !showResults && !showConfig && (
              <div className="flex items-center space-x-4 bg-white rounded-lg px-4 py-2 shadow-sm border">
                <div className="text-sm text-gray-600">
                  Question {currentQuestionIndex + 1} of {quiz.questions.length}
                </div>
                {timeLeft > 0 && (
                  <div className={`flex items-center space-x-2 ${timeLeft <= 10 ? 'text-red-600' : 'text-indigo-600'}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-mono font-medium">{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
                  </div>
                )}
              </div>
            )}
            
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-all duration-200 shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Dashboard</span>
            </button>
          </div>
        </div>

        {/* Generate Quiz Button */}
        {!quiz && !loading && !showConfig && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Ready to Generate Your Quiz?</h2>
              <p className="text-gray-600 mb-6">
                Create certification-level questions with advanced AI analysis from: <br/>
                <span className="font-medium text-indigo-600">{currentDocument.title}</span>
              </p>
            </div>
            <button
              onClick={() => setShowConfig(true)}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-8 py-3 rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Generate Enhanced Quiz
            </button>
          </div>
        )}

        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
            <div className="flex items-center">
              <div className="text-yellow-600 text-xl mr-3">💡</div>
              <div>
                <h3 className="font-semibold text-yellow-800">File Uploaded Successfully!</h3>
                <p className="text-yellow-700 mt-1">{error}</p>
                <div className="flex space-x-3 mt-3">
                  <button
                    onClick={() => setShowConfig(true)}
                    className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition-colors"
                  >
                    Generate Quiz Anyway
                  </button>
                  <button
                    onClick={() => navigate('/')}
                    className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors"
                  >
                    Upload Different File
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold mb-2">Generating Enhanced Quiz...</h2>
            <p className="text-gray-600">Creating certification-level questions with AI analysis.</p>
          </div>
        )}

        {/* Quiz Configuration */}
        {showConfig && !loading && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Configure Your Quiz</h2>
              <p className="text-gray-600">Customize your learning experience with advanced options</p>
            </div>
            <QuizConfigurator 
              onConfigSubmit={handleConfigSubmit}
              onCancel={() => setShowConfig(false)}
              documentContent={documentContent || ''}
            />
          </div>
        )}

        {quiz && !showResults && !loading && !showConfig && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">{quiz.title}</h2>
              <div className="text-sm text-gray-500">
                Question {currentQuestionIndex + 1} of {quiz.questions.length}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-medium mb-4">
                {quiz.questions[currentQuestionIndex].question}
              </h3>

              {quiz.questions[currentQuestionIndex].type === 'mcq' && (
                <div className="space-y-3">
                  {quiz.questions[currentQuestionIndex].options?.map((option: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => handleAnswer(option)}
                      className="w-full text-left p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}

              {quiz.questions[currentQuestionIndex].type === 'fill_blank' && (
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Type your answer..."
                    className="w-full p-4 border border-gray-300 rounded-lg"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAnswer((e.target as HTMLInputElement).value);
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      const input = document.querySelector('input');
                      if (input) handleAnswer(input.value);
                    }}
                    className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Submit Answer
                  </button>
                </div>
              )}

              {quiz.questions[currentQuestionIndex].type === 'short_answer' && (
                <div className="space-y-4">
                  <textarea
                    placeholder="Type your answer..."
                    className="w-full p-4 border border-gray-300 rounded-lg h-32"
                  />
                  <button
                    onClick={() => {
                      const textarea = document.querySelector('textarea');
                      if (textarea) handleAnswer(textarea.value);
                    }}
                    className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Submit Answer
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {showResults && quiz && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🏆</div>
              <h2 className="text-2xl font-bold mb-2">Quiz Complete!</h2>
              <p className="text-lg text-gray-600">
                You scored {score} out of {quiz.questions.length} questions correctly.
              </p>
              <div className="text-3xl font-bold text-blue-600 my-4">
                {Math.round((score / quiz.questions.length) * 100)}%
              </div>
            </div>

            <div className="space-y-6">
              {userAnswers.map((answer, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-sm ${
                      answer.isCorrect ? 'bg-green-500' : 'bg-red-500'
                    }`}>
                      {answer.isCorrect ? '✓' : '✗'}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium mb-2">{answer.question}</h4>
                      <div className="text-sm space-y-1">
                        <p><strong>Your answer:</strong> {answer.selectedAnswer || 'No answer'}</p>
                        <p><strong>Correct answer:</strong> {answer.correctAnswer}</p>
                        <p><strong>Time spent:</strong> {answer.timeSpent}s</p>
                        {answer.explanation && (
                          <p className="text-gray-600"><strong>Explanation:</strong> {answer.explanation}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex space-x-4 mt-6">
              <button
                onClick={restartQuiz}
                className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors flex-1"
              >
                Retake Quiz
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors flex-1"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        )}

        {!quiz && !loading && !error && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-6xl mb-6">📝</div>
            <h2 className="text-2xl font-bold mb-4">No Quiz Available</h2>
            <p className="text-gray-600 mb-6">
              Upload a text document to automatically generate quizzes.
            </p>
            <button
              onClick={() => navigate('/')}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Upload Document
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Quiz;