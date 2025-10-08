import React, { useState, useEffect, useRef } from 'react';
import { useDocument } from '../contexts/DocumentContext';
import { useAuth } from '../contexts/AuthContext';
import { geminiService } from '../lib/gemini';
import { documentsApi } from '../lib/database';
import { useNavigate } from 'react-router-dom';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const AITutor: React.FC = () => {
  const { currentDocument, documentContent, setDocumentContent } = useDocument();
  const { user } = useAuth();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingContent, setLoadingContent] = useState(false);

  // Load document content from database if not already loaded
  useEffect(() => {
    const loadDocumentContent = async () => {
      if (currentDocument && !documentContent && currentDocument.id) {
        setLoadingContent(true);
        try {
          // Fetch the full document from database
          const doc = await documentsApi.getDocument(currentDocument.id);
          if (doc && doc.content) {
            console.log('📖 Loaded document content from database:', doc.content.length, 'characters');
            setDocumentContent(doc.content);
          }
        } catch (err) {
          console.error('Failed to load document content:', err);
        } finally {
          setLoadingContent(false);
        }
      }
    };

    loadDocumentContent();
  }, [currentDocument, documentContent, setDocumentContent]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (currentDocument && documentContent && messages.length === 0) {
      const welcomeMessage: Message = {
        id: '1',
        role: 'assistant',
        content: `Hello! I'm your AI Tutor. I've analyzed "${currentDocument.title}" and I'm ready to help you understand it. Ask me anything!`,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [currentDocument, documentContent, messages.length]);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);
    setError('');

    try {
      let response: string;
      
      if (documentContent && documentContent.trim().length > 50) {
        response = await geminiService.answerQuestion(inputMessage, documentContent);
      } else {
        response = await geminiService.quickAnswer(inputMessage);
      }
      
      const assistantMessage: Message = {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      setError('Failed to get response. Please try again.');
      console.error('AI Tutor error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickQuestions = [
    "Explain the main concepts in simple terms",
    "What are the key takeaways?",
    "Give me real-world examples"
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-6">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 text-center max-w-md">
          <div className="text-6xl mb-4"></div>
          <h2 className="text-2xl font-bold text-white mb-4">Login Required</h2>
          <button
            onClick={() => navigate('/auth')}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">🤖 AI Tutor</h1>
              {currentDocument && (
                <div>
                  <p className="text-gray-600">
                    Learning from: <span className="font-semibold text-purple-600">{currentDocument.title}</span>
                  </p>
                  {loadingContent && (
                    <p className="text-sm text-blue-600 mt-1">⏳ Loading document content...</p>
                  )}
                  {!loadingContent && documentContent && (
                    <p className="text-sm text-green-600 mt-1">
                      ✅ Document loaded ({documentContent.split(/\s+/).length} words)
                    </p>
                  )}
                  {!loadingContent && !documentContent && (
                    <p className="text-sm text-amber-600 mt-1">
                      ⚠️ Document content not available - responses may be limited
                    </p>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
            >
              Back
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-lg h-[600px] flex flex-col">
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl p-4 ${
                        message.role === 'user'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{message.content}</div>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-2xl p-4">
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                        </div>
                        <span>AI Tutor is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="border-t p-4">
                {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">{error}</div>}
                <div className="flex space-x-4">
                  <textarea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask anything..."
                    className="flex-1 border rounded-lg p-4"
                    rows={3}
                    disabled={loading}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || loading}
                    className="bg-purple-600 text-white px-6 rounded-lg disabled:opacity-50"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4"> Quick Questions</h3>
              <div className="space-y-3">
                {quickQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => setInputMessage(question)}
                    className="w-full text-left p-3 bg-gray-50 hover:bg-purple-50 border rounded-lg text-sm"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AITutor;
