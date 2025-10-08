import React, { useState } from 'react';
import { geminiService } from '../lib/gemini';

const TestGemini: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const sampleText = `Photosynthesis is the process used by plants, algae and certain bacteria to harness energy from sunlight and turn it into chemical energy. There are two types of photosynthetic processes: oxygenic photosynthesis and anoxygenic photosynthesis. The general principles of anoxygenic and oxygenic photosynthesis are very similar, but oxygenic photosynthesis is the most common and is seen in plants, algae and cyanobacteria.`;

  const testBasicAPI = async () => {
    setTesting(true);
    setError('');
    setResult(null);

    try {
      console.log('🧪 Testing basic Gemini API connection...');
      
      const basicResult = await geminiService.extractTextFromContent('Test: Hello world! This is a simple test.');
      console.log('✅ Basic API test result:', basicResult);
      setResult({ message: 'API is working!', content: basicResult });
      
    } catch (err: any) {
      console.error('❌ Basic API test failed:', err);
      setError(err.message);
    } finally {
      setTesting(false);
    }
  };

  const testQuizGeneration = async () => {
    setTesting(true);
    setError('');
    setResult(null);

    try {
      console.log('🧪 Testing Gemini API with sample text...');
      
      const quiz = await geminiService.generateQuiz(sampleText);
      console.log('✅ Quiz generation result:', quiz);
      setResult(quiz);
      
    } catch (err: any) {
      console.error('❌ Gemini API test failed:', err);
      setError(err.message);
    } finally {
      setTesting(false);
    }
  };

  const testFlashcardGeneration = async () => {
    setTesting(true);
    setError('');
    setResult(null);

    try {
      console.log('🧪 Testing flashcard generation...');
      
      const flashcards = await geminiService.generateFlashcards(sampleText);
      console.log('✅ Flashcard generation result:', flashcards);
      setResult(flashcards);
      
    } catch (err: any) {
      console.error('❌ Flashcard generation failed:', err);
      setError(err.message);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
      <h2 className="text-xl font-bold text-yellow-800 mb-4">🧪 Gemini API Test</h2>
      
      <div className="space-y-4">
        <div className="bg-white p-4 rounded border">
          <h3 className="font-semibold mb-2">Sample Text:</h3>
          <p className="text-sm text-gray-600">{sampleText}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={testBasicAPI}
            disabled={testing}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 disabled:opacity-50"
          >
            {testing ? 'Testing...' : 'Test Basic API'}
          </button>
          
          <button
            onClick={testQuizGeneration}
            disabled={testing}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {testing ? 'Testing...' : 'Test Quiz Generation'}
          </button>
          
          <button
            onClick={testFlashcardGeneration}
            disabled={testing}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
          >
            {testing ? 'Testing...' : 'Test Flashcards'}
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <strong>Error: </strong>{error}
          </div>
        )}

        {result && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            <strong>Success! </strong>API is working correctly.
            <details className="mt-2">
              <summary className="cursor-pointer font-semibold">View API Response</summary>
              <pre className="mt-2 text-xs bg-white p-2 rounded overflow-auto max-h-60">
                {JSON.stringify(result, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestGemini;