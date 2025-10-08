Redesigned Workflow with Gemini API
USER UPLOADS FILE
         ↓
    FRONTEND (React)
         ↓
    STORAGE (Firebase/Supabase)
         ↓
    BACKEND FUNCTION
         ↓
    ┌────┴────┐
    │         │
 File Type?  
    │         │
PDF/DOCX  IMAGE/Screenshot
    │         │
    ├─────────┤
    │         │
    └────┬────┘
         ↓
GEMINI API (Single Call)
[Multimodal input - no OCR needed!]
         ↓
    JSON Response:
    {
      quiz: [...],
      flashcards: [...],
      summary: "..."
    }
         ↓
    DATABASE
         ↓
    FRONTEND (Display)

Key Advantages with Gemini:

Native PDF/Image support - No need for pdf-parse, Tesseract, or mammoth
Free tier - 15 requests/minute, 1 million tokens/day
Large context - Gemini 1.5 Pro handles up to 2M tokens (entire textbooks)
Multimodal - Handles text, images, PDFs in one call
Structured output - JSON mode available


Implementation Code
Backend Function (Supabase Edge Function or Express.js)
typescriptimport { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function processDocument(fileUrl: string, userId: string) {
  
  // 1. Fetch file from storage
  const fileResponse = await fetch(fileUrl);
  const fileBuffer = await fileResponse.arrayBuffer();
  const mimeType = fileResponse.headers.get('content-type');
  
  // 2. Prepare Gemini input
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-pro",
    generationConfig: {
      responseMimeType: "application/json"
    }
  });
  
  const prompt = `
Analyze this study material and generate educational content in JSON format:

{
  "quiz": [
    {
      "question": "string",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": 0-3,
      "explanation": "string",
      "difficulty": "easy|medium|hard"
    }
  ],
  "flashcards": [
    {
      "front": "string",
      "back": "string",
      "category": "string"
    }
  ],
  "summary": {
    "mainTopics": ["topic1", "topic2"],
    "keyPoints": ["point1", "point2"],
    "briefOverview": "string"
  }
}

Requirements:
- Generate 10 diverse quiz questions
- Create 20 flashcards covering key concepts
- Summary should capture essential information for AI tutor context

Analyze thoroughly and extract the most important educational content.
`;

  // 3. Call Gemini with file
  const result = await model.generateContent([
    {
      inlineData: {
        data: Buffer.from(fileBuffer).toString('base64'),
        mimeType: mimeType
      }
    },
    { text: prompt }
  ]);
  
  const response = result.response.text();
  const { quiz, flashcards, summary } = JSON.parse(response);
  
  // 4. Store in database
  const { data: doc } = await supabase
    .from('documents')
    .insert({
      user_id: userId,
      file_url: fileUrl,
      title: extractTitle(fileUrl),
      summary: summary.briefOverview
    })
    .select()
    .single();
  
  await supabase.from('quizzes').insert({
    document_id: doc.id,
    questions: quiz
  });
  
  await supabase.from('flashcard_decks').insert({
    document_id: doc.id,
    cards: flashcards
  });
  
  await supabase.from('ai_context').insert({
    document_id: doc.id,
    summary: summary,
    full_content_embedding: await generateEmbedding(response) // for RAG
  });
  
  return { documentId: doc.id };
}

AI Tutor with Gemini
typescriptasync function askTutor(documentId: string, userQuestion: string, chatHistory: any[]) {
  
  // 1. Get document context
  const { data: context } = await supabase
    .from('ai_context')
    .select('summary')
    .eq('document_id', documentId)
    .single();
  
  // 2. Build chat with context
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  
  const chat = model.startChat({
    history: [
      {
        role: "user",
        parts: [{ 
          text: `You are an AI tutor. Here's the study material context:\n\n${JSON.stringify(context.summary)}\n\nHelp the student understand this material.`
        }]
      },
      {
        role: "model",
        parts: [{ text: "I understand the material. I'm ready to help you learn!" }]
      },
      ...chatHistory
    ]
  });
  
  // 3. Send user question
  const result = await chat.sendMessage(userQuestion);
  return result.response.text();
}

Updated Database Schema
sql-- Documents table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL, -- pdf, docx, image, etc
  summary TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Quizzes table
CREATE TABLE quizzes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID REFERENCES documents NOT NULL,
  questions JSONB NOT NULL, -- array of question objects
  created_at TIMESTAMP DEFAULT NOW()
);

-- Flashcard decks table
CREATE TABLE flashcard_decks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID REFERENCES documents NOT NULL,
  cards JSONB NOT NULL, -- array of flashcard objects
  created_at TIMESTAMP DEFAULT NOW()
);

-- AI tutor context (for RAG)
CREATE TABLE ai_context (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID REFERENCES documents NOT NULL,
  summary JSONB NOT NULL, -- structured summary
  created_at TIMESTAMP DEFAULT NOW()
);

-- Chat history
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID REFERENCES documents NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  role TEXT NOT NULL, -- 'user' or 'model'
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

Frontend Flow with Gemini
tsx// Upload.tsx
const [processing, setProcessing] = useState(false);
const [status, setStatus] = useState('');

const handleUpload = async (file: File) => {
  setProcessing(true);
  
  try {
    // 1. Upload to storage
    setStatus('Uploading...');
    const { url } = await uploadFile(file);
    
    // 2. Process with Gemini
    setStatus('Analyzing document...');
    const { documentId } = await fetch('/api/process-document', {
      method: 'POST',
      body: JSON.stringify({ fileUrl: url })
    }).then(r => r.json());
    
    // 3. Success
    setStatus('Complete!');
    router.push(`/document/${documentId}`);
    
  } catch (error) {
    setStatus('Error processing document');
  }
};

Cost Comparison
Gemini (Free tier):

15 requests/minute
1M tokens/day
Multimodal included
Cost: $0

OpenAI GPT-4:

$0.03 per 1K input tokens
$0.06 per 1K output tokens
No native PDF support
Cost: ~$0.50-2 per document


Recommended Stack with Gemini
Frontend: React + TypeScript + Vite
Backend: Supabase (Auth + Database + Edge Functions)
AI: Gemini 1.5 Pro (document processing) + Flash (chat)
Storage: Supabase Storage
Deployment: Vercel (frontend) + Supabase (backend)