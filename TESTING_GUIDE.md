# 🧪 Document Processor Testing Guide

## Quick Test Steps

### 1. Open the Application
- Navigate to: `http://localhost:5174/`
- Login/Signup to your account
- Go to Dashboard

### 2. Test PDF Upload
1. Click "Upload Document" button
2. Select a PDF file (must be text-based, not scanned image)
3. **Expected Console Output:**
   ```
   Processing yourfile.pdf (application/pdf)...
   ✅ Extracted 1,234 words from yourfile.pdf
   📄 Created 5 semantic chunks
   ```
4. **Expected UI:**
   - Green "Current Document" card appears
   - File name and size displayed
   - "Ready for AI learning" status

### 3. Test Word Document Upload
1. Click "Upload New" or "Upload Document"
2. Select a `.docx` file
3. **Expected Console Output:**
   ```
   Processing yourdoc.docx (application/vnd.openxmlformats-officedocument.wordprocessingml.document)...
   ✅ Extracted 892 words from yourdoc.docx
   📄 Created 3 semantic chunks
   ```

### 4. Test Text File Upload
1. Upload a `.txt` or `.md` file
2. Should process instantly (< 100ms)
3. **Expected Console Output:**
   ```
   Processing notes.txt (text/plain)...
   ✅ Extracted 456 words from notes.txt
   📄 Created 2 semantic chunks
   ```

### 5. Test Error Handling

#### Large File (>50MB)
- Try uploading a file larger than 50MB
- **Expected:** Alert showing "File size (XX.XMB) exceeds maximum of 50MB"

#### Unsupported Type
- Try uploading an image or video file
- **Expected:** Alert showing supported formats

#### Empty/Scanned PDF
- Upload a scanned PDF (image-based, no text layer)
- **Expected:** 
  ```
  Text extraction failed: Error: No text content extracted from PDF (might be scanned/image-based)
  ```
  - File still uploads with fallback content

---

## 🔍 What to Check

### Browser Console (F12)
✅ Look for processing logs  
✅ Check for extraction success messages  
✅ Verify chunk creation  
❌ No red errors about worker files  
❌ No 404 errors for pdf.worker.min.mjs

### UI Dashboard
✅ Current Document card displays correctly  
✅ File metadata shown (type, size)  
✅ Processing spinner appears during upload  
✅ Success message after completion  
✅ Can access Quiz, Flashcards, AI Tutor

### Network Tab (F12 → Network)
✅ `pdf.worker.min.mjs` loads from `/pdf.worker.min.mjs` (200 OK)  
✅ File uploads to Supabase Storage  
✅ Database insert succeeds

---

## 🐛 Common Issues & Solutions

### Issue: "Failed to fetch pdf.worker.min.mjs"
**Solution:** 
```bash
Copy-Item "node_modules\pdfjs-dist\build\pdf.worker.min.mjs" -Destination "public\pdf.worker.min.mjs"
```

### Issue: "Cannot read properties of undefined reading 'getDocument'"
**Solution:** Make sure pdfjs-dist is properly imported:
```typescript
import * as pdfjsLib from 'pdfjs-dist';
```

### Issue: Empty text extracted from PDF
**Possible Causes:**
1. PDF is scanned/image-based (needs OCR - Phase 2)
2. PDF has copy protection
3. PDF uses non-standard fonts

**Solution:** Use a different PDF or enable fallback mode

### Issue: Word document extraction fails
**Check:**
1. File is `.docx` format (not `.doc`)
2. File is not corrupted
3. mammoth library is installed

---

## 📊 Expected Performance

| Operation | Time | Memory |
|-----------|------|--------|
| PDF (10 pages) | ~500ms | ~15MB |
| Word doc | ~300ms | ~10MB |
| Text file | <100ms | ~5MB |
| Chunking | <50ms | ~2MB |

---

## ✅ Success Criteria

- [ ] PDF files extract text successfully
- [ ] Word documents extract text successfully
- [ ] Text files process instantly
- [ ] Semantic chunks are created
- [ ] Metadata is stored in database
- [ ] AI can generate quizzes from content
- [ ] No console errors about workers
- [ ] File size validation works
- [ ] Unsupported file types are rejected gracefully

---

## 🎯 Test Files

Create test files or use existing:
- **PDF:** Any text-based PDF (research paper, ebook, notes)
- **Word:** Any `.docx` document
- **Text:** Any `.txt` or `.md` file

**Avoid:**
- Scanned PDFs (images without text layer)
- Protected/encrypted PDFs
- Very old Word formats (`.doc`)

---

## 📝 Test Report Template

```
### Test Date: [Date]
### Browser: [Chrome/Firefox/Edge]
### Test Results:

| Test Case | Status | Notes |
|-----------|--------|-------|
| PDF Upload | ✅/❌ | |
| Word Upload | ✅/❌ | |
| Text Upload | ✅/❌ | |
| Large File (>50MB) | ✅/❌ | |
| Unsupported Type | ✅/❌ | |
| Semantic Chunking | ✅/❌ | |
| AI Processing | ✅/❌ | |
| Quiz Generation | ✅/❌ | |

### Issues Found:
1. [Issue description]
2. [Issue description]

### Browser Console Logs:
[Paste relevant logs]
```

---

**Ready to Test!** 🚀

Open `http://localhost:5174/` and start uploading documents!
