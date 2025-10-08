import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker - use local worker file from public directory
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

export interface ProcessedDocument {
  content: string;
  chunks: string[];
  metadata: {
    wordCount: number;
    characterCount: number;
    chunkCount: number;
    fileType: string;
    extractionMethod: string;
  };
}

export class DocumentProcessor {
  /**
   * Extract text from various document types
   */
  static async extractText(file: File): Promise<string> {
    const fileType = file.type;
    const fileName = file.name.toLowerCase();
    
    try {
      // Word documents (.docx)
      if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
          fileName.endsWith('.docx')) {
        return await this.processDocx(file);
      } 
      // PDF files
      else if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
        return await this.processPdf(file);
      } 
      // Text files
      else if (fileType === 'text/plain' || fileName.endsWith('.txt') || fileName.endsWith('.md')) {
        return await this.processText(file);
      } 
      // Fallback: try to read as text
      else {
        console.warn(`Unknown file type: ${fileType}, attempting text extraction`);
        return await this.processText(file);
      }
    } catch (error) {
      console.error('Document processing error:', error);
      throw new Error(`Failed to extract text from ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Process Word (.docx) files
   */
  static async processDocx(file: File): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      
      if (result.messages.length > 0) {
        console.warn('Mammoth conversion warnings:', result.messages);
      }
      
      if (!result.value || result.value.trim().length === 0) {
        throw new Error('No text content extracted from Word document');
      }
      
      return result.value;
    } catch (error) {
      throw new Error(`Failed to process Word document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Process PDF files
   */
  static async processPdf(file: File): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      
      // Load PDF document
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      
      let fullText = '';
      
      // Extract text from each page
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // Concatenate text items
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        
        fullText += pageText + '\n\n';
      }
      
      if (!fullText || fullText.trim().length === 0) {
        throw new Error('No text content extracted from PDF (might be scanned/image-based)');
      }
      
      return fullText.trim();
    } catch (error) {
      throw new Error(`Failed to process PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Process plain text files
   */
  static async processText(file: File): Promise<string> {
    try {
      const text = await file.text();
      
      if (!text || text.trim().length === 0) {
        throw new Error('File appears to be empty');
      }
      
      return text;
    } catch (error) {
      throw new Error(`Failed to read text file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Split content into semantic chunks for better AI processing
   * @param content - The full document content
   * @param chunkSize - Maximum characters per chunk (default: 1000)
   * @param overlap - Characters to overlap between chunks (default: 100)
   */
  static chunkContent(content: string, chunkSize: number = 1000, overlap: number = 100): string[] {
    if (!content || content.trim().length === 0) {
      return [];
    }

    const chunks: string[] = [];
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    let currentChunk = '';
    
    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();
      
      // If adding this sentence would exceed chunk size, save current chunk
      if (currentChunk.length + trimmedSentence.length > chunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        
        // Create overlap by keeping the last portion of previous chunk
        const words = currentChunk.split(' ');
        const overlapWords = words.slice(-Math.ceil(overlap / 5)); // Approximate words for overlap
        currentChunk = overlapWords.join(' ') + ' ' + trimmedSentence;
      } else {
        currentChunk += (currentChunk ? '. ' : '') + trimmedSentence;
      }
    }
    
    // Add the last chunk
    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks;
  }

  /**
   * Process file and return complete document information
   */
  static async processDocument(file: File): Promise<ProcessedDocument> {
    // Extract text content
    const content = await this.extractText(file);
    
    // Create semantic chunks
    const chunks = this.chunkContent(content);
    
    // Calculate metadata
    const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
    const characterCount = content.length;
    
    return {
      content,
      chunks,
      metadata: {
        wordCount,
        characterCount,
        chunkCount: chunks.length,
        fileType: file.type,
        extractionMethod: this.getExtractionMethod(file)
      }
    };
  }

  /**
   * Get the extraction method used for the file
   */
  private static getExtractionMethod(file: File): string {
    const fileName = file.name.toLowerCase();
    
    if (fileName.endsWith('.docx')) return 'mammoth';
    if (fileName.endsWith('.pdf')) return 'pdf-parse';
    if (fileName.endsWith('.txt') || fileName.endsWith('.md')) return 'text';
    return 'text-fallback';
  }

  /**
   * Validate file before processing
   */
  static validateFile(file: File, maxSizeMB: number = 50): { valid: boolean; error?: string } {
    // Check file size
    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      return {
        valid: false,
        error: `File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds maximum of ${maxSizeMB}MB`
      };
    }

    // Check file type
    const supportedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    const fileName = file.name.toLowerCase();
    const isSupportedExtension = fileName.endsWith('.pdf') || 
                                   fileName.endsWith('.docx') || 
                                   fileName.endsWith('.txt') || 
                                   fileName.endsWith('.md');
    
    if (!supportedTypes.includes(file.type) && !isSupportedExtension) {
      return {
        valid: false,
        error: `Unsupported file type. Supported formats: PDF, Word (.docx), Text (.txt, .md)`
      };
    }

    return { valid: true };
  }
}
