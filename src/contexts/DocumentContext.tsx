import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { Document } from '../types/database';

interface DocumentContextType {
  currentDocument: Document | null;
  setCurrentDocument: (doc: Document | null) => void;
  processingStatus: 'idle' | 'processing' | 'success' | 'error';
  setProcessingStatus: (status: 'idle' | 'processing' | 'success' | 'error') => void;
  documentContent: string;
  setDocumentContent: (content: string) => void;
  clearDocument: () => void;
}

const DocumentContext = createContext<DocumentContextType | undefined>(undefined);

export function DocumentProvider({ children }: { children: ReactNode }) {
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null);
  const [processingStatus, setProcessingStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [documentContent, setDocumentContent] = useState<string>('');

  const clearDocument = () => {
    setCurrentDocument(null);
    setProcessingStatus('idle');
    setDocumentContent('');
  };

  const value = {
    currentDocument,
    setCurrentDocument,
    processingStatus,
    setProcessingStatus,
    documentContent,
    setDocumentContent,
    clearDocument,
  };

  return (
    <DocumentContext.Provider value={value}>
      {children}
    </DocumentContext.Provider>
  );
}

export function useDocument() {
  const context = useContext(DocumentContext);
  if (context === undefined) {
    throw new Error('useDocument must be used within a DocumentProvider');
  }
  return context;
}