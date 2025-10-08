import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useDocument } from '../contexts/DocumentContext';
import { storageApi, documentsApi } from '../lib/database.js';
import { geminiService } from '../lib/gemini';
import { useNavigate } from 'react-router-dom';

const Upload: React.FC = () => {
  const { user } = useAuth();
  const { setCurrentDocument, setProcessingStatus, setDocumentContent } = useDocument();
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
      setProgress('');
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !user) return;

    setUploading(true);
    setProgress('Uploading file to storage...');

    try {
      // 1. Upload file to Supabase Storage
      const fileUrl = await storageApi.uploadDocument(file, user.id);
      setProgress('File uploaded! Processing with AI...');

      // 2. Read file content if it's a text file
      let content = '';
      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        content = await file.text();
      } else {
        // For other file types, we'll just store the file for now
        console.log('Non-text file uploaded - AI processing skipped');
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

      // Update document context
      setCurrentDocument(document);
      setDocumentContent(content);
      setProcessingStatus('processing');

      // 4. Process with Gemini AI if we have text content
      if (content && content.length > 100) {
        setProgress('AI is analyzing your document content...');
        setProcessing(true);

        try {
          const cleanedContent = await geminiService.extractTextFromContent(content);
          
          // Update document with AI-processed content
          await documentsApi.updateDocumentContent(document.id, cleanedContent);
          
          // Update document context with processed content
          setDocumentContent(cleanedContent);
          setProcessingStatus('success');
          
          setProgress('✅ Document processed successfully! AI is ready to generate quizzes and flashcards.');
          
        } catch (aiError) {
          console.error('AI processing error:', aiError);
          setProcessingStatus('error');
          // Continue even if AI processing fails
          setProgress('Document uploaded! (AI processing had some issues)');
        }
      } else if (content) {
        setProcessingStatus('success');
        setProgress('Document uploaded! (Content too short for AI processing)');
      } else {
        setProcessingStatus('success');
        setProgress('Document uploaded! (AI processing available for text files)');
      }

      // 5. Redirect to dashboard after a delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);

    } catch (err: any) {
      setError(err.message);
      setProgress('');
    } finally {
      setUploading(false);
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Upload Study Material</h1>
        <p className="text-gray-600 mb-8">Upload documents and let AI create quizzes & flashcards automatically</p>

        <div className="bg-white rounded-lg shadow p-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {progress && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded mb-4">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
                {progress}
              </div>
              {(uploading || processing) && (
                <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full animate-pulse"></div>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleUpload} className="space-y-6">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <input
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                disabled={uploading || processing}
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <div className="text-4xl mb-4">📁</div>
                <p className="text-lg font-medium text-gray-700">
                  {file ? file.name : 'Choose a file or drag and drop'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  PDF, Word, Text, Images up to 10MB
                </p>
                <button
                  type="button"
                  className="mt-4 bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Select File
                </button>
              </label>
            </div>

            {file && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-700 mb-2">Selected File:</h3>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-600">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      Size: {(file.size / 1024 / 1024).toFixed(2)} MB • Type: {file.type || 'Unknown'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="text-red-500 hover:text-red-700"
                    disabled={uploading || processing}
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={!file || uploading || processing}
              className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Uploading...
                </>
              ) : processing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  AI Processing...
                </>
              ) : (
                'Upload & Process with AI'
              )}
            </button>
          </form>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <div className="text-2xl font-bold text-purple-600">1</div>
            <h3 className="font-semibold mt-2">Upload</h3>
            <p className="text-sm text-gray-600 mt-1">Upload your study materials</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <div className="text-2xl font-bold text-purple-600">2</div>
            <h3 className="font-semibold mt-2">AI Processing</h3>
            <p className="text-sm text-gray-600 mt-1">Gemini AI analyzes your content</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <div className="text-2xl font-bold text-purple-600">3</div>
            <h3 className="font-semibold mt-2">Learn</h3>
            <p className="text-sm text-gray-600 mt-1">Get AI-powered quizzes & flashcards</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Upload;