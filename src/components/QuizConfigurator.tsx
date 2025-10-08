import React, { useState } from 'react';
import type { EnhancedQuizConfig } from '../types/database';

interface QuizConfiguratorProps {
  onConfigSubmit: (config: EnhancedQuizConfig) => void;
  onCancel: () => void;
  documentContent: string;
}

const QuizConfigurator: React.FC<QuizConfiguratorProps> = ({
  onConfigSubmit,
  onCancel,
  documentContent
}) => {
  const [config, setConfig] = useState<EnhancedQuizConfig>({
    numQuestions: 10,
    difficulty: 'intermediate',
    timePerQuestion: 60,
    topicFocus: [],
    includeScenarios: true,
    certificationLevel: false,
    crossTopicIntegration: true
  });

  const [customTopics, setCustomTopics] = useState('');

  const difficulties = [
    { value: 'beginner', label: 'Beginner', description: 'Basic recall and comprehension' },
    { value: 'intermediate', label: 'Intermediate', description: 'Application and analysis' },
    { value: 'advanced', label: 'Advanced', description: 'Synthesis and evaluation' },
    { value: 'expert', label: 'Expert', description: 'Innovation and creation' },
    { value: 'mixed', label: 'Mixed', description: 'All difficulty levels' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalConfig = {
      ...config,
      topicFocus: customTopics 
        ? customTopics.split(',').map(t => t.trim()).filter(t => t)
        : []
    };
    
    onConfigSubmit(finalConfig);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Quiz Configuration</h2>
          <p className="text-gray-600 mt-1">Customize your advanced quiz experience</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Number of Questions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Questions: {config.numQuestions}
            </label>
            <input
              type="range"
              min="1"
              max="50"
              value={config.numQuestions}
              onChange={(e) => setConfig(prev => ({ ...prev, numQuestions: parseInt(e.target.value) }))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1</span>
              <span>25</span>
              <span>50</span>
            </div>
          </div>

          {/* Difficulty Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Difficulty Level
            </label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {difficulties.map((diff) => (
                <button
                  key={diff.value}
                  type="button"
                  onClick={() => setConfig(prev => ({ ...prev, difficulty: diff.value as any }))}
                  className={`p-3 rounded-lg border text-center transition-all ${
                    config.difficulty === diff.value
                      ? 'bg-blue-500 text-white border-blue-500 shadow-lg transform scale-105'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                  }`}
                >
                  <div className="font-medium">{diff.label}</div>
                  <div className="text-xs opacity-80 mt-1">{diff.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Time Management */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time Per Question (seconds)
              </label>
              <select
                value={config.timePerQuestion}
                onChange={(e) => setConfig(prev => ({ ...prev, timePerQuestion: parseInt(e.target.value) }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={0}>No time limit</option>
                <option value={30}>30 seconds</option>
                <option value={60}>60 seconds</option>
                <option value={90}>90 seconds</option>
                <option value={120}>120 seconds</option>
              </select>
            </div>
          </div>

          {/* Advanced Options */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Advanced Features</h3>
            
            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={config.includeScenarios}
                  onChange={(e) => setConfig(prev => ({ ...prev, includeScenarios: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <div>
                  <span className="font-medium">Professional Scenarios</span>
                  <p className="text-sm text-gray-600">Include real-world application questions</p>
                </div>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={config.certificationLevel}
                  onChange={(e) => setConfig(prev => ({ ...prev, certificationLevel: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <div>
                  <span className="font-medium">Certification Level</span>
                  <p className="text-sm text-gray-600">PhD qualifier & board exam standard questions</p>
                </div>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={config.crossTopicIntegration}
                  onChange={(e) => setConfig(prev => ({ ...prev, crossTopicIntegration: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <div>
                  <span className="font-medium">Cross-Topic Integration</span>
                  <p className="text-sm text-gray-600">Combine multiple concepts intelligently</p>
                </div>
              </label>
            </div>
          </div>

          {/* Topic Focus */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Topic Focus (comma-separated)
            </label>
            <input
              type="text"
              value={customTopics}
              onChange={(e) => setCustomTopics(e.target.value)}
              placeholder="e.g., machine learning, neural networks, data analysis"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-500 text-white py-3 px-6 rounded-lg hover:bg-gray-600 transition-colors font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-6 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-105 font-semibold shadow-lg"
            >
              Generate Advanced Quiz
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuizConfigurator;