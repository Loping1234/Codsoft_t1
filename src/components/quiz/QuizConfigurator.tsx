import React, { useState } from 'react';
import { QuizConfig, QuizDifficulty, QuestionType } from '../../types/database';

interface QuizConfiguratorProps {
  onConfigSubmit: (config: QuizConfig) => void;
  onBack: () => void;
}

const QuizConfigurator: React.FC<QuizConfiguratorProps> = ({ onConfigSubmit, onBack }) => {
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [difficulty, setDifficulty] = useState<QuizDifficulty>('mixed');
  const [selectedQuestionTypes, setSelectedQuestionTypes] = useState<QuestionType[]>(['mcq', 'fill_blank']);
  const [enableTiming, setEnableTiming] = useState<boolean>(false);
  const [timePerQuestion, setTimePerQuestion] = useState<number>(60);
  const [professionalScenarios, setProfessionalScenarios] = useState<boolean>(true);
  const [certificationLevel, setCertificationLevel] = useState<boolean>(false);
  const [crossTopicIntegration, setCrossTopicIntegration] = useState<boolean>(true);

  const questionTypesConfig = [
    { id: 'mcq', name: 'Multiple Choice', icon: '🔘', description: 'Choose from 4 options' },
    { id: 'true_false', name: 'True/False', icon: '⚖️', description: 'Determine if statement is true or false' },
    { id: 'fill_blank', name: 'Fill in Blank', icon: '📝', description: 'Complete the missing words' },
    { id: 'matching', name: 'Matching Pairs', icon: '🔄', description: 'Match related concepts' },
    { id: 'short_answer', name: 'Short Answer', icon: '💬', description: 'Brief written responses' },
  ];

  const difficultyConfig = [
    { id: 'beginner', name: 'Beginner', color: 'bg-green-500', description: 'Basic concepts and definitions' },
    { id: 'intermediate', name: 'Intermediate', color: 'bg-blue-500', description: 'Application and analysis' },
    { id: 'advanced', name: 'Advanced', color: 'bg-purple-500', description: 'Complex problem solving' },
    { id: 'expert', name: 'Expert', color: 'bg-red-500', description: 'PhD-level critical thinking' },
    { id: 'mixed', name: 'Mixed', color: 'bg-yellow-500', description: 'All difficulty levels' },
  ];

  const toggleQuestionType = (type: QuestionType) => {
    setSelectedQuestionTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const handleGenerateQuiz = () => {
    const config: QuizConfig = {
      questionCount,
      difficulty,
      questionTypes: selectedQuestionTypes,
      enableTiming,
      timePerQuestion: enableTiming ? timePerQuestion : undefined,
      professionalScenarios,
      certificationLevel,
      crossTopicIntegration,
    };

    onConfigSubmit(config);
  };

  const allQuestionTypesSelected = selectedQuestionTypes.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-slate-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={onBack}
              className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors mb-4"
            >
              <span>←</span>
              <span>Back to Dashboard</span>
            </button>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
              🎯 Advanced Quiz Configurator
            </h1>
            <p className="text-gray-400 mt-2">
              Customize your quiz with professional settings and certification-level questions
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Basic Settings */}
          <div className="space-y-6">
            {/* Question Count */}
            <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-6 border border-yellow-500/30">
              <h3 className="text-lg font-semibold mb-4 text-yellow-400">📊 Quiz Length</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Questions: <span className="text-yellow-400 font-bold text-lg">{questionCount}</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={questionCount}
                  onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                  className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-2">
                  <span>Quick (1)</span>
                  <span>Comprehensive (50)</span>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-2 mt-4">
                {[5, 10, 15, 25, 50].map((count) => (
                  <button
                    key={count}
                    onClick={() => setQuestionCount(count)}
                    className={`p-2 rounded-lg border transition-all ${
                      questionCount === count
                        ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400'
                        : 'bg-slate-700/50 border-slate-600 text-gray-300 hover:border-yellow-400/50'
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty Selection */}
            <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-6 border border-yellow-500/30">
              <h3 className="text-lg font-semibold mb-4 text-yellow-400">🎯 Difficulty Level</h3>
              
              <div className="grid grid-cols-1 gap-3">
                {difficultyConfig.map((level) => (
                  <button
                    key={level.id}
                    onClick={() => setDifficulty(level.id as QuizDifficulty)}
                    className={`p-4 rounded-xl border transition-all text-left ${
                      difficulty === level.id
                        ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400'
                        : 'bg-slate-700/50 border-slate-600 text-gray-300 hover:border-yellow-400/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">{level.name}</div>
                        <div className="text-sm text-gray-400 mt-1">{level.description}</div>
                      </div>
                      <div className={`w-4 h-4 rounded-full ${level.color}`}></div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Time Management */}
            <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-6 border border-yellow-500/30">
              <h3 className="text-lg font-semibold mb-4 text-yellow-400">⏱️ Time Settings</h3>
              
              <div className="space-y-4">
                <label className="flex items-center space-x-3 p-3 bg-slate-700/30 rounded-lg cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={enableTiming} 
                    onChange={() => setEnableTiming(!enableTiming)}
                    className="w-4 h-4 text-yellow-500 bg-slate-600 border-slate-500 rounded focus:ring-yellow-500"
                  />
                  <div>
                    <div className="font-medium">Enable Time Limits</div>
                    <div className="text-sm text-gray-400">Add pressure with question timers</div>
                  </div>
                </label>
                
                {enableTiming && (
                  <div className="pl-4 border-l-2 border-yellow-500/50">
                    <label className="block text-sm font-medium mb-2">
                      Seconds per question: <span className="text-yellow-400">{timePerQuestion}s</span>
                    </label>
                    <input
                      type="range"
                      min="30"
                      max="300"
                      step="30"
                      value={timePerQuestion}
                      onChange={(e) => setTimePerQuestion(parseInt(e.target.value))}
                      className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-2">
                      <span>Fast (30s)</span>
                      <span>Standard (60s)</span>
                      <span>Detailed (5m)</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Advanced Settings */}
          <div className="space-y-6">
            {/* Question Types */}
            <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-6 border border-yellow-500/30">
              <h3 className="text-lg font-semibold mb-4 text-yellow-400">🎯 Question Types</h3>
              <p className="text-gray-400 text-sm mb-4">Select the types of questions you want to include</p>
              
              <div className="grid grid-cols-1 gap-3">
                {questionTypesConfig.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => toggleQuestionType(type.id as QuestionType)}
                    className={`p-4 rounded-xl border transition-all text-left ${
                      selectedQuestionTypes.includes(type.id as QuestionType)
                        ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400'
                        : 'bg-slate-700/50 border-slate-600 text-gray-300 hover:border-yellow-400/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-xl">{type.icon}</span>
                        <div>
                          <div className="font-semibold">{type.name}</div>
                          <div className="text-sm text-gray-400">{type.description}</div>
                        </div>
                      </div>
                      {selectedQuestionTypes.includes(type.id as QuestionType) && (
                        <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                          <span className="text-black text-sm">✓</span>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {!allQuestionTypesSelected && (
                <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                  <p className="text-red-300 text-sm">Please select at least one question type</p>
                </div>
              )}
            </div>

            {/* Professional Features */}
            <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-6 border border-yellow-500/30">
              <h3 className="text-lg font-semibold mb-4 text-yellow-400">🧠 Advanced Features</h3>
              
              <div className="space-y-4">
                <label className="flex items-center space-x-3 p-3 bg-slate-700/30 rounded-lg cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={professionalScenarios} 
                    onChange={() => setProfessionalScenarios(!professionalScenarios)}
                    className="w-4 h-4 text-yellow-500 bg-slate-600 border-slate-500 rounded focus:ring-yellow-500"
                  />
                  <div>
                    <div className="font-medium">Professional Scenarios</div>
                    <div className="text-sm text-gray-400">Real-world application questions, not just memorization</div>
                  </div>
                </label>
                
                <label className="flex items-center space-x-3 p-3 bg-slate-700/30 rounded-lg cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={certificationLevel} 
                    onChange={() => setCertificationLevel(!certificationLevel)}
                    className="w-4 h-4 text-yellow-500 bg-slate-600 border-slate-500 rounded focus:ring-yellow-500"
                  />
                  <div>
                    <div className="font-medium">PhD Certification Level</div>
                    <div className="text-sm text-gray-400">Board exam standard questions with critical thinking</div>
                  </div>
                </label>

                <label className="flex items-center space-x-3 p-3 bg-slate-700/30 rounded-lg cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={crossTopicIntegration} 
                    onChange={() => setCrossTopicIntegration(!crossTopicIntegration)}
                    className="w-4 h-4 text-yellow-500 bg-slate-600 border-slate-500 rounded focus:ring-yellow-500"
                  />
                  <div>
                    <div className="font-medium">Cross-Topic Integration</div>
                    <div className="text-sm text-gray-400">Questions that combine multiple concepts intelligently</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerateQuiz}
              disabled={!allQuestionTypesSelected}
              className="w-full bg-gradient-to-r from-yellow-600 to-yellow-700 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-yellow-500 hover:to-yellow-600 transition-all transform hover:scale-105 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed shadow-lg shadow-yellow-500/25"
            >
              🚀 Generate Professional Quiz
            </button>

            {/* Features Preview */}
            <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-6 border border-yellow-500/30">
              <h4 className="font-semibold text-yellow-400 mb-3">✨ Your Quiz Includes</h4>
              <ul className="text-sm text-gray-300 space-y-2">
                <li className="flex items-center space-x-2">
                  <span className="text-green-400">✓</span>
                  <span>{questionCount} professionally crafted questions</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="text-green-400">✓</span>
                  <span>{selectedQuestionTypes.length} question types</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="text-green-400">✓</span>
                  <span>{difficulty} difficulty level</span>
                </li>
                {professionalScenarios && (
                  <li className="flex items-center space-x-2">
                    <span className="text-blue-400">★</span>
                    <span>Real-world professional scenarios</span>
                  </li>
                )}
                {certificationLevel && (
                  <li className="flex items-center space-x-2">
                    <span className="text-purple-400">★</span>
                    <span>PhD-level certification questions</span>
                  </li>
                )}
                {enableTiming && (
                  <li className="flex items-center space-x-2">
                    <span className="text-orange-400">⏱️</span>
                    <span>Time management: {timePerQuestion}s per question</span>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizConfigurator;
