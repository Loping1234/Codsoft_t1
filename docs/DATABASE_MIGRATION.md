# Database Migration Guide: Enhanced Quiz Generation

## Overview
This migration adds support for the Enhanced Quiz Generation Pipeline with NLP-powered content processing.

## New Columns

### `documents` table

Add two JSONB columns to store processed content analysis:

```sql
-- Add processed content column
ALTER TABLE documents
ADD COLUMN processed_content JSONB DEFAULT NULL;

-- Add content metadata column
ALTER TABLE documents
ADD COLUMN content_metadata JSONB DEFAULT NULL;

-- Add index for faster queries
CREATE INDEX idx_documents_processed_content ON documents USING GIN (processed_content);
CREATE INDEX idx_documents_content_metadata ON documents USING GIN (content_metadata);

-- Add comment for documentation
COMMENT ON COLUMN documents.processed_content IS 'NLP analysis results including entities, concepts, relationships, and semantic chunks';
COMMENT ON COLUMN documents.content_metadata IS 'Content metadata including difficulty, key terms, topic tags, word count, and estimated reading time';
```

## Data Structure

### `processed_content` JSONB Structure

```json
{
  "entities": [
    {
      "text": "Machine Learning",
      "type": "CONCEPT",
      "context": "Machine Learning is a subset of AI...",
      "importance": 9
    }
  ],
  "concepts": [
    {
      "name": "Neural Networks",
      "description": "Computing systems inspired by biological neural networks",
      "relatedTerms": ["deep learning", "perceptron", "backpropagation"],
      "importance": 8
    }
  ],
  "relationships": [
    {
      "subject": "Neural Networks",
      "predicate": "are used in",
      "object": "Deep Learning",
      "sentence": "Neural Networks are used in Deep Learning applications.",
      "type": "hierarchical"
    }
  ],
  "chunks": [
    {
      "id": "chunk-1",
      "content": "Neural networks form the foundation...",
      "topic": "Neural Network Fundamentals",
      "startIndex": 0,
      "endIndex": 245,
      "concepts": ["neural networks", "deep learning"]
    }
  ]
}
```

### `content_metadata` JSONB Structure

```json
{
  "difficulty": "intermediate",
  "keyTerms": ["machine learning", "neural networks", "backpropagation"],
  "topicTags": ["artificial intelligence", "computer science"],
  "wordCount": 1250,
  "estimatedReadingTime": "5 minutes"
}
```

## Migration Steps

### Using Supabase Dashboard

1. **Navigate to SQL Editor**
   - Go to your Supabase project
   - Click "SQL Editor" in the sidebar

2. **Run Migration SQL**
   ```sql
   -- Enhanced Quiz Generation Pipeline Migration
   -- Add NLP processing columns to documents table
   
   ALTER TABLE documents
   ADD COLUMN IF NOT EXISTS processed_content JSONB DEFAULT NULL,
   ADD COLUMN IF NOT EXISTS content_metadata JSONB DEFAULT NULL;
   
   -- Create indexes for performance
   CREATE INDEX IF NOT EXISTS idx_documents_processed_content 
   ON documents USING GIN (processed_content);
   
   CREATE INDEX IF NOT EXISTS idx_documents_content_metadata 
   ON documents USING GIN (content_metadata);
   
   -- Add column comments
   COMMENT ON COLUMN documents.processed_content IS 'NLP analysis results including entities, concepts, relationships, and semantic chunks';
   COMMENT ON COLUMN documents.content_metadata IS 'Content metadata including difficulty, key terms, topic tags, word count, and estimated reading time';
   ```

3. **Verify Migration**
   ```sql
   -- Check new columns exist
   SELECT column_name, data_type, is_nullable
   FROM information_schema.columns
   WHERE table_name = 'documents'
   AND column_name IN ('processed_content', 'content_metadata');
   
   -- Check indexes
   SELECT indexname, indexdef
   FROM pg_indexes
   WHERE tablename = 'documents'
   AND indexname LIKE 'idx_documents_%content%';
   ```

### Using PostgreSQL CLI

```bash
# Connect to database
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT].supabase.co:5432/postgres"

# Run migration
\i migration.sql

# Verify
\d documents
```

## Rollback (if needed)

```sql
-- Remove columns and indexes
DROP INDEX IF EXISTS idx_documents_content_metadata;
DROP INDEX IF EXISTS idx_documents_processed_content;

ALTER TABLE documents
DROP COLUMN IF EXISTS content_metadata,
DROP COLUMN IF EXISTS processed_content;
```

## Application Integration

### Update Document Upload Flow

```typescript
// In src/lib/database.ts or upload handler

import { contentProcessor } from '../services/contentProcessor';

async function uploadAndProcessDocument(file: File, userId: string) {
  // 1. Upload document (existing code)
  const documentId = await uploadDocument(file, userId);
  
  // 2. Extract content
  const content = await extractContentFromFile(file);
  
  // 3. Process with NLP pipeline
  const document = await getDocument(documentId);
  const processedContent = await contentProcessor.processDocument(document, content);
  
  // 4. Update database with processed results
  await supabase
    .from('documents')
    .update({
      processed_content: processedContent,
      content_metadata: processedContent.metadata,
      processed: true
    })
    .eq('id', documentId);
  
  return documentId;
}
```

### Use Processed Content for Quiz Generation

```typescript
// In Quiz generation handler

import { geminiService } from '../lib/gemini';

async function generateEnhancedQuiz(documentId: string, config: QuizConfig) {
  // Fetch document with processed content
  const { data: document } = await supabase
    .from('documents')
    .select('content, processed_content')
    .eq('id', documentId)
    .single();
  
  // Use enhanced pipeline if content is already processed
  if (document.processed_content) {
    // Generate directly from processed content
    const { advancedQuestionGenerator } = await import('../services/advancedQuestionGenerator');
    const questions = await advancedQuestionGenerator.generateQuestionsAdvanced(
      document.processed_content,
      config
    );
    return { questions };
  }
  
  // Otherwise use full pipeline
  return await geminiService.generateEnhancedQuiz(documentId, document.content, config);
}
```

## Performance Optimization

### Background Processing

Consider processing documents asynchronously:

```typescript
// Process in background after upload
async function queueDocumentProcessing(documentId: string) {
  // Use Supabase Edge Functions or similar
  await fetch('/api/process-document', {
    method: 'POST',
    body: JSON.stringify({ documentId })
  });
}
```

### Caching Strategy

1. **Check for cached results** before running NLP pipeline
2. **Store processed content** for reuse across multiple quizzes
3. **Invalidate cache** only when document content changes

## Benefits

### Performance
- **Faster Quiz Generation**: Reuse processed content analysis
- **Reduced API Calls**: Process once, generate many quizzes
- **Better Quality**: NLP-powered question targeting

### Features
- **Entity-Based Questions**: Target key concepts and entities
- **Relationship Testing**: Test understanding of connections
- **Difficulty Scoring**: Automatic difficulty assessment
- **Topic Mapping**: Organize questions by topics

## Monitoring

### Query to check processing status

```sql
-- See processing statistics
SELECT 
  COUNT(*) as total_documents,
  COUNT(processed_content) as processed_documents,
  COUNT(processed_content) * 100.0 / COUNT(*) as processing_rate
FROM documents;

-- See documents needing processing
SELECT id, title, created_at
FROM documents
WHERE processed_content IS NULL
ORDER BY created_at DESC;
```

## Testing

### Test Data

```sql
-- Insert test document with processed content
INSERT INTO documents (user_id, title, content, processed_content, content_metadata)
VALUES (
  'test-user-id',
  'Test Document',
  'Sample content for testing...',
  '{"entities": [], "concepts": [], "relationships": [], "chunks": []}',
  '{"difficulty": "easy", "keyTerms": ["test"], "wordCount": 100}'
);

-- Query and verify
SELECT processed_content, content_metadata
FROM documents
WHERE title = 'Test Document';
```

## Next Steps

1. ✅ Run the migration SQL
2. ✅ Verify columns and indexes
3. 🔄 Update upload flow to process documents
4. 🔄 Update quiz generation to use processed content
5. 🔄 Test with sample documents
6. 🔄 Monitor processing performance

---

**Migration Created**: 2024
**Version**: 1.0
**Status**: Ready for Production
