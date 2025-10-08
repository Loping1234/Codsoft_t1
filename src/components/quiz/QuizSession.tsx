import React, { useState, useEffect } from 'react';
import type { QuizConfig, AdvancedQuizQuestion, QuizSession } from '../../types/database';

// Old interface for backward compatibility
interface OldQuizSessionProps {
  quiz: {
    title: string;
    estimatedLevel: string;
    questionCount: number;
    questions: any[];
  };
  onBack: () => void;
}

// New advanced interface
interface NewQuizSessionProps {
  config: QuizConfig;
  questions: AdvancedQuizQuestion[];
  onComplete: (session: QuizSession) => void;
  onBack: () => void;
}

type QuizSessionProps = OldQuizSessionProps | NewQuizSessionProps;

// Type guard to check if it's the new interface
function isNewInterface(props: QuizSessionProps): props is NewQuizSessionProps {
  return 'config' in props && 'questions' in props;
}

const QuizSessionComponent: React.FC<QuizSessionProps> = (props) => {
  // Extract props based on interface type
  const isNew = isNewInterface(props);
  
  const config: QuizConfig | undefined = isNew ? props.config : undefined;
  const questions = isNew ? props.questions : props.quiz.questions;
  const onComplete = isNew ? props.onComplete : undefined;
  const onBack = props.onBack;

  const [currentQuestion, setCurrentQuestion] = useState<number>(0);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [timeRemaining, setTimeRemaining] = useState<number>(config?.timePerQuestion || 0);
  const [totalTime, setTotalTime] = useState<number>(0);
  const [quizCompleted, setQuizCompleted] = useState<boolean>(false);
  const [startTime] = useState<Date>(new Date());

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (config?.enableTiming && timeRemaining > 0 && !quizCompleted) {
      timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    const totalTimer = setInterval(() => {
      setTotalTime(prev => prev + 1);
    }, 1000);

    return () => {
      if (timer) clearInterval(timer);
      clearInterval(totalTimer);
    };
  }, [currentQuestion, timeRemaining, quizCompleted, config]);

  const handleTimeUp = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setTimeRemaining(config?.timePerQuestion || 0);
    } else {
      completeQuiz();
    }
  };

  const handleAnswer = (answer: string) => {
    const question = questions[currentQuestion];
    setAnswers(prev => ({
      ...prev,
      [question.id]: answer
    }));

    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(prev => prev + 1);
        setTimeRemaining(config?.timePerQuestion || 0);
      } else {
        completeQuiz();
      }
    }, 300);
  };

  const completeQuiz = () => {
    setQuizCompleted(true);
    
    if (isNew && onComplete && config) {
      const session: QuizSession = {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: 'current-user',
        document_id: 'current-doc',
        config,
        questions: questions as AdvancedQuizQuestion[],
        currentQuestion: questions.length - 1,
        score: calculateScore(),
        timeSpent: totalTime,
        completed: true,
        startedAt: startTime.toISOString(),
        completedAt: new Date().toISOString(),
        answers
      };

      setTimeout(() => {
        onComplete(session);
      }, 1000);
    } else {
      // Old interface - just go back after a delay
      setTimeout(() => {
        onBack();
      }, 2000);
    }
  };

  const calculateScore = (): number => {
    let correct = 0;
    questions.forEach(question => {
      const userAnswer = answers[question.id];
      if (!userAnswer) return;
      
      if (Array.isArray(question.correct_answer)) {
        if (question.correct_answer.includes(userAnswer)) correct++;
      } else {
        const normalizedUser = userAnswer.toString().toLowerCase().trim();
        const normalizedCorrect = question.correct_answer.toString().toLowerCase().trim();
        if (normalizedUser === normalizedCorrect) correct++;
      }
    });
    return Math.round((correct / questions.length) * 100);
  };

  const currentQ = questions[currentQuestion];

  if (quizCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Calculating your results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-slate-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-yellow-400"> Professional Quiz</h1>
            <p className="text-gray-400">Question {currentQuestion + 1} of {questions.length}</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="w-32 bg-slate-700 rounded-full h-2">
              <div 
                className="bg-yellow-500 h-2 rounded-full transition-all"
                style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
              ></div>
            </div>
            
            {config?.enableTiming && (
              <div className={`px-3 py-1 rounded-full border ${
                timeRemaining < 10 ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse' : 'bg-yellow-500/20 border-yellow-500 text-yellow-400'
              }`}>
                 {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-8 border border-yellow-500/30 mb-6">
          {currentQ.professionalScenario && (
            <div className="bg-blue-500/20 border border-blue-500 text-blue-400 px-3 py-1 rounded-full text-sm inline-flex items-center space-x-1 mb-4">
              <span></span>
              <span>Professional Scenario</span>
            </div>
          )}
          
          <div className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm border ml-2 ${
            currentQ.difficulty === 'easy' ? 'bg-green-500/20 border-green-500 text-green-400' :
            currentQ.difficulty === 'medium' ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400' :
            'bg-red-500/20 border-red-500 text-red-400'
          }`}>
            <span></span>
            <span>{currentQ.difficulty.charAt(0).toUpperCase() + currentQ.difficulty.slice(1)}</span>
          </div>

          <h2 className="text-2xl font-semibold mt-4 mb-6 leading-relaxed">
            {currentQ.question}
          </h2>

          <div className="space-y-4">
            {currentQ.type === 'mcq' && currentQ.options && (
              currentQ.options.map((option: string, index: number) => (
                <button
                  key={index}
                  onClick={() => handleAnswer(option)}
                  className="w-full text-left p-4 bg-slate-700/50 border border-slate-600 rounded-xl hover:bg-slate-600/50 hover:border-yellow-400/50 transition-all group"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center group-hover:bg-yellow-500 group-hover:text-black transition-colors font-semibold">
                      {String.fromCharCode(65 + index)}
                    </div>
                    <span className="flex-1">{option}</span>
                  </div>
                </button>
              ))
            )}

            {currentQ.type === 'true_false' && (
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleAnswer('True')}
                  className="p-6 bg-green-500/20 border border-green-500 rounded-xl hover:bg-green-500/30 transition-all text-center"
                >
                  <div className="text-2xl mb-2"></div>
                  <div className="font-semibold">True</div>
                </button>
                <button
                  onClick={() => handleAnswer('False')}
                  className="p-6 bg-red-500/20 border border-red-500 rounded-xl hover:bg-red-500/30 transition-all text-center"
                >
                  <div className="text-2xl mb-2"></div>
                  <div className="font-semibold">False</div>
                </button>
              </div>
            )}

            {currentQ.type === 'fill_blank' && (
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Type your answer here..."
                  className="w-full p-4 bg-slate-700/50 border border-slate-600 rounded-xl focus:outline-none focus:border-yellow-500 text-white placeholder-gray-400"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const value = (e.target as HTMLInputElement).value;
                      if (value.trim()) {
                        handleAnswer(value);
                      }
                    }
                  }}
                  id={`fill-blank-${currentQuestion}`}
                />
                <button
                  onClick={() => {
                    const input = document.getElementById(`fill-blank-${currentQuestion}`) as HTMLInputElement;
                    if (input && input.value.trim()) {
                      handleAnswer(input.value);
                    }
                  }}
                  className="bg-yellow-500 text-black px-6 py-3 rounded-xl font-semibold hover:bg-yellow-400 transition-colors"
                >
                  Submit Answer
                </button>
              </div>
            )}

            {currentQ.type === 'matching' && (
              <div className="space-y-4">
                <p className="text-gray-400 text-sm mb-4">Select matching pairs from the options below:</p>
                {currentQ.options && currentQ.options.map((option: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => handleAnswer(option)}
                    className="w-full text-left p-4 bg-slate-700/50 border border-slate-600 rounded-xl hover:bg-slate-600/50 hover:border-yellow-400/50 transition-all"
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}

            {currentQ.type === 'short_answer' && (
              <div className="space-y-4">
                <textarea
                  placeholder="Type your detailed answer here..."
                  className="w-full p-4 bg-slate-700/50 border border-slate-600 rounded-xl focus:outline-none focus:border-yellow-500 text-white placeholder-gray-400 h-32 resize-none"
                  id={`short-answer-${currentQuestion}`}
                />
                <button
                  onClick={() => {
                    const textarea = document.getElementById(`short-answer-${currentQuestion}`) as HTMLTextAreaElement;
                    if (textarea && textarea.value.trim()) {
                      handleAnswer(textarea.value);
                    }
                  }}
                  className="bg-yellow-500 text-black px-6 py-3 rounded-xl font-semibold hover:bg-yellow-400 transition-colors"
                >
                  Submit Answer
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center">
          <button
            onClick={onBack}
            className="text-gray-400 hover:text-white transition-colors flex items-center space-x-2"
          >
            <span></span>
            <span>Exit Quiz</span>
          </button>
          
          <div className="text-gray-400 text-sm">
            <span className="text-yellow-400 font-semibold">{currentQuestion + 1}</span> of {questions.length} questions
          </div>

          <div className="text-gray-400 text-sm">
            Total Time: {Math.floor(totalTime / 60)}:{(totalTime % 60).toString().padStart(2, '0')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizSessionComponent;
