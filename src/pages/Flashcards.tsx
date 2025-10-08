import React, { useState, useEffect } from 'react';
import { useDocument } from '../contexts/DocumentContext';
import { quizzesApi } from '../lib/database.js';
import { useNavigate } from 'react-router-dom';

interface Flashcard {
  id: string;
  front: string;
  back: string;
}

const Flashcards: React.FC = () => {
  const { currentDocument } = useDocument();
  const navigate = useNavigate();
  
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentCard, setCurrentCard] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentDocument) {
      navigate('/dashboard');
      return;
    }

    loadFlashcards();
  }, [currentDocument, navigate]);

  const loadFlashcards = async () => {
    if (!currentDocument) return;

    setLoading(true);
    try {
      const flashcardSets = await quizzesApi.getFlashcardSetsByDocument(currentDocument.id);
      
      if (flashcardSets.length > 0) {
        setFlashcards(flashcardSets[0].flashcards);
      }
    } catch (error) {
      console.error('Error loading flashcards:', error);
    } finally {
      setLoading(false);
    }
  };

  const nextCard = () => {
    setIsFlipped(false);
    setCurrentCard((prev) => (prev + 1) % flashcards.length);
  };

  const prevCard = () => {
    setIsFlipped(false);
    setCurrentCard((prev) => (prev - 1 + flashcards.length) % flashcards.length);
  };

  if (!currentDocument) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">No Document Found</h2>
          <p>Please upload a document first to access flashcards.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Flashcards</h1>
            <p className="text-gray-600">Generated from: {currentDocument.title}</p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>

        {loading && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold mb-2">Loading Flashcards...</h2>
          </div>
        )}

        {!loading && flashcards.length === 0 && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-6xl mb-6">📇</div>
            <h2 className="text-2xl font-bold mb-4">No Flashcards Available</h2>
            <p className="text-gray-600 mb-6">
              Upload a text document to automatically generate flashcards.
            </p>
            <button
              onClick={() => navigate('/')}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Upload Document
            </button>
          </div>
        )}

        {!loading && flashcards.length > 0 && (
          <div className="flex flex-col items-center">
            {/* Progress indicator */}
            <div className="w-full max-w-2xl mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-600">
                  Card {currentCard + 1} of {flashcards.length}
                </span>
                <span className="text-sm text-gray-500">
                  {Math.round(((currentCard + 1) / flashcards.length) * 100)}% Complete
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentCard + 1) / flashcards.length) * 100}%` }}
                ></div>
              </div>
            </div>
            
            <div 
              className="w-full max-w-2xl h-80 perspective-1000 cursor-pointer mb-8"
              onClick={() => setIsFlipped(!isFlipped)}
            >
              <div className={`relative w-full h-full transition-transform duration-600 preserve-3d ${
                isFlipped ? 'rotate-y-180' : ''
              }`}>
                {/* Front of card */}
                <div className="absolute w-full h-full bg-white rounded-2xl shadow-xl border border-gray-200 backface-hidden flex flex-col justify-center p-8">
                  <div className="text-center">
                    <div className="text-sm font-medium text-blue-600 mb-4 uppercase tracking-wide">
                      Define
                    </div>
                    <div className="text-2xl font-bold text-gray-800 leading-relaxed break-words">
                      {flashcards[currentCard].front}
                    </div>
                  </div>
                  <div className="absolute bottom-4 right-4 text-xs text-gray-400">
                    Card {currentCard + 1} of {flashcards.length}
                  </div>
                </div>
                
                {/* Back of card */}
                <div className="absolute w-full h-full bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-xl border border-blue-200 backface-hidden rotate-y-180 flex flex-col justify-center p-8">
                  <div className="text-center">
                    <div className="text-sm font-medium text-indigo-600 mb-4 uppercase tracking-wide">
                      Answer
                    </div>
                    <div className="text-xl text-gray-700 leading-relaxed break-words">
                      {flashcards[currentCard].back}
                    </div>
                  </div>
                  <div className="absolute bottom-4 right-4 text-xs text-blue-400">
                    Card {currentCard + 1} of {flashcards.length}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center space-x-6">
              <button
                onClick={prevCard}
                disabled={flashcards.length <= 1}
                className="flex items-center space-x-2 bg-gray-600 text-white px-6 py-3 rounded-xl hover:bg-gray-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <span>←</span>
                <span>Previous</span>
              </button>
              
              <button
                onClick={() => setIsFlipped(!isFlipped)}
                className="flex items-center space-x-2 bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700 transition-all transform hover:scale-105 shadow-lg"
              >
                <span>{isFlipped ? '🔄' : '👁️'}</span>
                <span>{isFlipped ? 'Show Question' : 'Show Answer'}</span>
              </button>
              
              <button
                onClick={nextCard}
                disabled={flashcards.length <= 1}
                className="flex items-center space-x-2 bg-gray-600 text-white px-6 py-3 rounded-xl hover:bg-gray-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <span>Next</span>
                <span>→</span>
              </button>
            </div>

            <div className="mt-8 text-center">
              <div className="inline-flex items-center space-x-2 bg-gray-50 px-4 py-2 rounded-full text-sm text-gray-600">
                <span>💡</span>
                <span>Click on the card to flip between question and answer</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Flashcards;