import React, { useState, useRef, useEffect } from 'react';
import { useTutor } from '../contexts/TutorContext';
import type { Message } from '../contexts/TutorContext';

const ChatInterface: React.FC = () => {
  const {
    currentSession,
    sessions,
    startNewSession,
    loadSession,
    askQuestion,
    explanationLevel,
    setExplanationLevel,
    isProcessing,
    simplifyLastAnswer,
    giveExample,
    showSteps,
    studentProgress
  } = useTutor();

  const [inputMessage, setInputMessage] = useState('');
  const [showSessions, setShowSessions] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession?.messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = async () => {
    if (!inputMessage.trim() || isProcessing) return;

    const message = inputMessage.trim();
    setInputMessage('');

    try {
      await askQuestion(message);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const filteredSessions = sessions.filter(session =>
    session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.messages.some(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getMessageIcon = (type: Message['messageType']) => {
    switch (type) {
      case 'question':
        return '❓';
      case 'explanation':
        return '💡';
      case 'example':
        return '📝';
      case 'analogy':
        return '🔄';
      case 'problem_solution':
        return '🎯';
      case 'encouragement':
        return '⭐';
      default:
        return '💬';
    }
  };

  const renderMessage = (message: Message) => {
    const isUser = message.role === 'user';

    return (
      <div
        key={message.id}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 animate-fade-in`}
      >
        <div className={`max-w-[80%] ${isUser ? 'order-2' : 'order-1'}`}>
          {/* Message bubble */}
          <div
            className={`rounded-2xl px-4 py-3 ${
              isUser
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                : 'bg-white/10 backdrop-blur-lg border border-white/20 text-gray-100'
            }`}
          >
            {!isUser && (
              <div className="flex items-center gap-2 mb-2 text-sm opacity-70">
                <span>{getMessageIcon(message.messageType)}</span>
                <span className="capitalize">{message.messageType.replace('_', ' ')}</span>
              </div>
            )}
            
            <div className="whitespace-pre-wrap">{message.content}</div>

            {/* Related concepts */}
            {message.relatedConcepts && message.relatedConcepts.length > 0 && (
              <div className="mt-3 pt-3 border-t border-white/10">
                <div className="text-xs opacity-70 mb-2">Related concepts:</div>
                <div className="flex flex-wrap gap-2">
                  {message.relatedConcepts.map((concept, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-white/10 rounded-full text-xs"
                    >
                      {concept}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Follow-up questions */}
            {message.followUpQuestions && message.followUpQuestions.length > 0 && (
              <div className="mt-3 pt-3 border-t border-white/10">
                <div className="text-xs opacity-70 mb-2">You might also ask:</div>
                {message.followUpQuestions.map((question, i) => (
                  <button
                    key={i}
                    onClick={() => setInputMessage(question)}
                    className="block w-full text-left px-3 py-2 mb-1 bg-white/5 hover:bg-white/10 rounded-lg text-xs transition-colors"
                  >
                    {question}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Timestamp */}
          <div className={`text-xs opacity-50 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
            {new Date(message.timestamp).toLocaleTimeString()}
          </div>

          {/* Quick actions (only for assistant messages) */}
          {!isUser && (
            <div className="flex gap-2 mt-2">
              <button
                onClick={simplifyLastAnswer}
                className="text-xs px-3 py-1 bg-white/5 hover:bg-white/10 rounded-full transition-colors"
                disabled={isProcessing}
              >
                🔽 Explain simpler
              </button>
              <button
                onClick={giveExample}
                className="text-xs px-3 py-1 bg-white/5 hover:bg-white/10 rounded-full transition-colors"
                disabled={isProcessing}
              >
                📝 Give example
              </button>
              <button
                onClick={showSteps}
                className="text-xs px-3 py-1 bg-white/5 hover:bg-white/10 rounded-full transition-colors"
                disabled={isProcessing}
              >
                🎯 Show steps
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full gap-4">
      {/* Session Sidebar */}
      <div className={`transition-all duration-300 ${showSessions ? 'w-80' : 'w-0'} overflow-hidden`}>
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-4 h-full flex flex-col">
          <h3 className="text-lg font-bold text-white mb-4">Conversations</h3>
          
          {/* Search */}
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 mb-4 focus:outline-none focus:border-purple-500"
          />

          {/* Session list */}
          <div className="flex-1 overflow-y-auto space-y-2">
            {filteredSessions.map((session) => (
              <button
                key={session.id}
                onClick={() => loadSession(session.id)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  currentSession?.id === session.id
                    ? 'bg-purple-600'
                    : 'bg-white/5 hover:bg-white/10'
                }`}
              >
                <div className="font-medium text-white text-sm">{session.title}</div>
                <div className="text-xs opacity-70 mt-1">
                  {session.messages.length} messages • {new Date(session.lastActivity).toLocaleDateString()}
                </div>
              </button>
            ))}
          </div>

          {/* New session button */}
          <button
            onClick={() => startNewSession()}
            className="mt-4 w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all"
          >
            + New Conversation
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-lg rounded-t-2xl border border-white/20 border-b-0 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSessions(!showSessions)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            <div>
              <h2 className="text-lg font-bold text-white">
                {currentSession?.title || 'AI Tutor'}
              </h2>
              {currentSession?.topic && (
                <p className="text-sm opacity-70">Topic: {currentSession.topic}</p>
              )}
            </div>
          </div>

          {/* Explanation level selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm opacity-70">Level:</span>
            <select
              value={explanationLevel}
              onChange={(e) => setExplanationLevel(e.target.value as any)}
              className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
            >
              <option value="like_im_10" className="bg-gray-800">Like I'm 10</option>
              <option value="high_school" className="bg-gray-800">High School</option>
              <option value="college" className="bg-gray-800">College</option>
              <option value="expert" className="bg-gray-800">Expert</option>
            </select>
          </div>

          {/* Progress indicator */}
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1">
              <span>📚</span>
              <span>{studentProgress.conceptsMastered.length} mastered</span>
            </div>
            <div className="flex items-center gap-1">
              <span>🎯</span>
              <span>{studentProgress.questionsAsked} questions</span>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 bg-white/5 backdrop-blur-lg border border-white/20 border-y-0 overflow-y-auto p-6">
          {!currentSession || currentSession.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="text-6xl mb-4">🎓</div>
              <h3 className="text-2xl font-bold text-white mb-2">
                Welcome to AI Tutor!
              </h3>
              <p className="text-gray-300 mb-6 max-w-md">
                Ask me anything about your study materials, get explanations, solve problems,
                or explore concepts in depth.
              </p>
              <div className="grid grid-cols-2 gap-3 max-w-2xl">
                <button
                  onClick={() => setInputMessage("Explain photosynthesis like I'm 10")}
                  className="p-4 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-left"
                >
                  <div className="text-2xl mb-2">🌱</div>
                  <div className="font-medium text-white text-sm">Simple Explanations</div>
                  <div className="text-xs opacity-70 mt-1">Get concepts explained clearly</div>
                </button>
                <button
                  onClick={() => setInputMessage("Solve: 2x + 5 = 15")}
                  className="p-4 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-left"
                >
                  <div className="text-2xl mb-2">🎯</div>
                  <div className="font-medium text-white text-sm">Step-by-Step</div>
                  <div className="text-xs opacity-70 mt-1">Work through problems together</div>
                </button>
                <button
                  onClick={() => setInputMessage("Give me a real-world example of probability")}
                  className="p-4 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-left"
                >
                  <div className="text-2xl mb-2">🌍</div>
                  <div className="font-medium text-white text-sm">Real Examples</div>
                  <div className="text-xs opacity-70 mt-1">See practical applications</div>
                </button>
                <button
                  onClick={() => setInputMessage("Help me prepare for my exam on cell biology")}
                  className="p-4 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-left"
                >
                  <div className="text-2xl mb-2">📝</div>
                  <div className="font-medium text-white text-sm">Exam Prep</div>
                  <div className="text-xs opacity-70 mt-1">Review and practice</div>
                </button>
              </div>
            </div>
          ) : (
            <>
              {currentSession.messages.map(renderMessage)}
              {isProcessing && (
                <div className="flex justify-start mb-4">
                  <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span className="text-sm opacity-70">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="bg-white/10 backdrop-blur-lg rounded-b-2xl border border-white/20 border-t-0 p-4">
          <div className="flex gap-3">
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask a question, request an explanation, or solve a problem..."
              className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 resize-none"
              rows={2}
              disabled={isProcessing}
            />
            <button
              onClick={handleSend}
              disabled={!inputMessage.trim() || isProcessing}
              className="px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isProcessing ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </div>

          {/* Suggestions */}
          <div className="flex gap-2 mt-3 flex-wrap">
            <button
              onClick={() => setInputMessage('Explain this in simpler terms')}
              className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded-full text-xs transition-colors"
            >
              💡 Simplify
            </button>
            <button
              onClick={() => setInputMessage('Give me an analogy for this')}
              className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded-full text-xs transition-colors"
            >
              🔄 Analogy
            </button>
            <button
              onClick={() => setInputMessage('Show me real-world examples')}
              className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded-full text-xs transition-colors"
            >
              🌍 Examples
            </button>
            <button
              onClick={() => setInputMessage('Break this down step by step')}
              className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded-full text-xs transition-colors"
            >
              🎯 Steps
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
