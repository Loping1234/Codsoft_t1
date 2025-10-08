# AI Tutor Document Content Access Fix

## Problem Statement

The AI Tutor was not able to access the uploaded file's content, responding with messages like "I cannot directly read or open binary files like PowerPoint presentations (.pptx)...". This occurred even though we successfully extracted text from PDF, Word, and text files using the DocumentProcessor.

### Root Cause

**Memory vs. Persistence Issue:**

1. When a document is uploaded in `Dashboard.tsx`:
   - DocumentProcessor extracts text content
   - Content is stored in database (`documents.content` field)
   - Content is also set in React context via `setDocumentContent(processedContent)`

2. When user navigates to AI Tutor:
   - **Problem**: `documentContent` from context is empty because:
     - React context state is memory-only (not persisted)
     - If user refreshes page or navigates away and back, context resets
     - AI Tutor had no logic to load content from database

3. Result:
   - AI Tutor sees `currentDocument` (metadata) but no `documentContent` (actual text)
   - Falls back to `quickAnswer()` instead of `answerQuestion(question, content)`
   - Responds as if it can't access the file

## Solution Implemented

### 1. Added Database Content Loading

**File**: `src/pages/AITutor.tsx`

```typescript
import { documentsApi } from '../lib/database';

// Added state for loading indicator
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
```

### 2. Added Visual Status Indicators

Now shows document loading status to user:

```typescript
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
```

## How It Works Now

### Upload Flow (Dashboard)
```
1. User uploads file
2. DocumentProcessor extracts text
3. Content saved to database (documents.content)
4. Content set in context (setDocumentContent)
5. User can immediately use AI Tutor
```

### Navigate Back Flow (AI Tutor)
```
1. User opens AI Tutor page
2. AITutor checks: currentDocument exists? ✅
3. AITutor checks: documentContent loaded? ❌
4. AITutor fetches from database (documentsApi.getDocument)
5. Content loaded and set in context
6. AI Tutor now has access to full text
7. Responds with context-aware answers
```

## Files Modified

### `src/pages/AITutor.tsx`
- **Added**: Import `documentsApi` from `../lib/database`
- **Added**: `loadingContent` state for loading indicator
- **Added**: `useEffect` to load document content from database on mount
- **Added**: Status indicators showing document loading state
- **Added**: Word count display when content is loaded

### Database Schema
No changes needed - already has `documents.content` field storing extracted text.

## Testing Instructions

### Test 1: Fresh Upload
1. Upload a PDF/Word/Text file from Dashboard
2. Click "AI Tutor" button
3. **Expected**: Green checkmark "✅ Document loaded (X words)"
4. Ask question: "What is this document about?"
5. **Expected**: AI responds with content-specific answer

### Test 2: Page Refresh
1. After uploading a document, refresh the browser page
2. Navigate to AI Tutor from Dashboard
3. **Expected**: 
   - Brief "⏳ Loading document content..." message
   - Then "✅ Document loaded (X words)"
4. Ask question about the content
5. **Expected**: AI has full document context

### Test 3: Navigation Away and Back
1. Upload document → Go to AI Tutor → Ask a question
2. Navigate to Quiz page
3. Come back to AI Tutor
4. **Expected**: Content still loaded, no re-fetch needed (already in context)

### Test 4: Unsupported File Type (PowerPoint)
1. Upload a .pptx file (not yet supported by DocumentProcessor)
2. Go to AI Tutor
3. **Expected**: 
   - Yellow warning "⚠️ Document content not available"
   - AI responds: "I don't have access to the extracted content"
   - This is expected behavior until we add PowerPoint support

## Console Logs for Debugging

When document loads successfully:
```
📖 Loaded document content from database: 15234 characters
```

When user asks a question:
```javascript
// In AITutor.tsx handleSendMessage()
if (documentContent && documentContent.trim().length > 50) {
  response = await geminiService.answerQuestion(inputMessage, documentContent);
  // Uses context-aware response
} else {
  response = await geminiService.quickAnswer(inputMessage);
  // Falls back to general knowledge
}
```

## Future Enhancements

### 1. Add PowerPoint Support
Use `pptx` or similar library to extract text from .pptx files:

```typescript
// In documentProcessor.ts
async processPowerPoint(file: File): Promise<string> {
  // Extract text from slides
  // Return combined text from all slides
}
```

### 2. Cache Loaded Content
Prevent re-fetching on every AI Tutor visit:

```typescript
// Add to DocumentContext
const [contentCache, setContentCache] = useState<Map<string, string>>(new Map());

// Check cache before fetching
if (contentCache.has(currentDocument.id)) {
  setDocumentContent(contentCache.get(currentDocument.id)!);
} else {
  // Fetch and cache
}
```

### 3. Show Content Preview
Let users verify what content AI Tutor sees:

```jsx
<details className="mt-2">
  <summary className="cursor-pointer text-sm text-gray-600">
    📄 View document content preview
  </summary>
  <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40">
    {documentContent.substring(0, 500)}...
  </pre>
</details>
```

### 4. Semantic Chunks for Better Responses
Use the `semantic_chunks` field we created:

```typescript
// Instead of sending all content:
const doc = await documentsApi.getDocument(currentDocument.id);

// Use semantic chunks for better context:
const relevantChunks = doc.semantic_chunks?.slice(0, 5).join('\n\n');
response = await geminiService.answerQuestion(inputMessage, relevantChunks);
```

## Benefits

✅ **Persistent Content Access**: AI Tutor works even after page refresh
✅ **User Transparency**: Clear status indicators show document state
✅ **Better UX**: No need to manually copy-paste content
✅ **Consistent Behavior**: Works same as Quiz and Flashcards
✅ **Error Handling**: Graceful fallback if content unavailable
✅ **Performance**: Only loads when needed (lazy loading)

## Related Files

- `src/pages/AITutor.tsx` - AI Tutor interface (MODIFIED)
- `src/pages/Dashboard.tsx` - Document upload and processing
- `src/utils/documentProcessor.ts` - Text extraction utility
- `src/lib/database.ts` - Database API (`getDocument` function)
- `src/lib/gemini.ts` - AI service (`answerQuestion` method)
- `src/contexts/DocumentContext.tsx` - React context for document state

## Troubleshooting

### Issue: "⚠️ Document content not available"

**Possible Causes:**
1. File type not supported (e.g., .pptx, .xlsx)
2. Text extraction failed during upload
3. Database content field is empty

**Solution:**
- Check console for extraction errors during upload
- Verify `documents.content` field in Supabase table
- Re-upload the file to trigger extraction

### Issue: AI gives generic answers instead of specific ones

**Check:**
1. Status indicator shows green checkmark?
2. Word count > 0?
3. Console shows "📖 Loaded document content"?

**Debug:**
```typescript
// Add temporary debug in AITutor.tsx
console.log('Document content length:', documentContent?.length);
console.log('First 100 chars:', documentContent?.substring(0, 100));
```

## Summary

This fix ensures AI Tutor has **persistent access** to uploaded document content by:
1. Loading content from database when page loads
2. Showing clear status indicators to users
3. Providing context-aware responses based on actual document text
4. Handling edge cases gracefully

Users can now upload any supported file (PDF, Word, Text) and immediately get intelligent, content-specific help from the AI Tutor without any manual copy-pasting! 🎉
