import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

// Auto-scaling question count based on file size
export const calculateQuestionCount = (content: string, difficulty: string): number => {
  const wordCount = content.trim().split(/\s+/).length;
  
  // Base question count by word count tiers
  let baseCount = 0;
  if (wordCount < 200) baseCount = 5;
  else if (wordCount < 500) baseCount = 8;
  else if (wordCount < 1000) baseCount = 12;
  else if (wordCount < 2000) baseCount = 18;
  else if (wordCount < 3500) baseCount = 25;
  else if (wordCount < 5000) baseCount = 32;
  else if (wordCount < 7500) baseCount = 40;
  else if (wordCount < 10000) baseCount = 50;
  else if (wordCount < 15000) baseCount = 65;
  else baseCount = 80;

  // Difficulty multipliers
  const multipliers = {
    beginner: 1.2,      // More questions, simpler
    intermediate: 1.0,  // Balanced
    advanced: 0.85,     // Fewer, deeper questions
    expert: 0.7,        // Significantly fewer, very complex
    mixed: 1.0          // Balanced mix
  };

  // Apply multiplier and round to multiple of 4 for clean answer distribution
  const finalCount = Math.round((baseCount * multipliers[difficulty as keyof typeof multipliers]) / 4) * 4;
  
  // Ensure within bounds
  return Math.max(5, Math.min(100, finalCount));
};

export const generateAutoScaledQuiz = async (
  content: string, 
  difficulty: string, 
  customTopics?: string
) => {
  try {
    const questionCount = calculateQuestionCount(content, difficulty);
    
    // Use the current Gemini model (October 2025)
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash'  // Fast, efficient model for quiz generation
    });
    
    const prompt = `
Generate a ${difficulty}-level professional quiz with EXACTLY ${questionCount} questions.

CONTENT: ${content.substring(0, 30000)}

${customTopics ? `FOCUS TOPICS: ${customTopics}` : 'COVER ALL KEY CONCEPTS from the content'}

DIFFICULTY: ${difficulty}
- Beginner: Basic recall and understanding
- Intermediate: Application and analysis  
- Advanced: Synthesis and evaluation
- Expert: Critical thinking and innovation
- Mixed: Balanced distribution across all levels

STRICT REQUIREMENTS:
1. NEVER mention "the document", "according to the text", or reference the source
2. Create real-world professional scenarios
3. Balance answer options evenly (25% A/B/C/D distribution)
4. Include multiple question types intelligently
5. PhD-level critical thinking for advanced/expert
6. Professional context and practical applications

Return ONLY valid JSON in this exact format:
{
  "title": "Professional Assessment",
  "estimatedLevel": "${difficulty}",
  "questionCount": ${questionCount},
  "questions": [
    {
      "id": "1",
      "type": "mcq",
      "question": "Professional scenario that applies concepts...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Option A",
      "explanation": "Detailed professional explanation...",
      "difficulty": "medium",
      "professionalContext": "Real-world scenario description"
    }
  ]
}

IMPORTANT: Return ONLY the JSON object, no other text.
    `;
    
    console.log('Sending request to Gemini API...');
    console.log('Question count:', questionCount);
    console.log('Difficulty:', difficulty);
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    // Extract text from response
    const responseText = response.text();
    console.log('Raw Gemini response:', responseText);
    
    // Extract JSON from response text
    let jsonString = responseText.trim();
    
    // Remove markdown code blocks if present
    jsonString = jsonString.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    // Try to find JSON object
    const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in response. Full response:', responseText);
      throw new Error('AI response format error - no JSON found');
    }
    
    const parsedQuiz = JSON.parse(jsonMatch[0]);
    console.log('Successfully parsed quiz with', parsedQuiz.questions?.length, 'questions');
    
    return parsedQuiz;
    
  } catch (error) {
    console.error('Error generating auto-scaled quiz:', error);
    throw new Error('Failed to generate quiz: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
};

// Alternative direct API call using fetch (if the SDK still has issues)
export const generateAutoScaledQuizDirect = async (
  content: string,
  difficulty: string,
  customTopics?: string
) => {
  try {
    const questionCount = calculateQuestionCount(content, difficulty);
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    
    const prompt = `
Generate a ${difficulty}-level professional quiz with EXACTLY ${questionCount} questions.

CONTENT: ${content.substring(0, 30000)}

${customTopics ? `FOCUS TOPICS: ${customTopics}` : 'COVER ALL KEY CONCEPTS from the content'}

Return ONLY valid JSON in this exact format:
{
  "title": "Professional Assessment",
  "estimatedLevel": "${difficulty}",
  "questionCount": ${questionCount},
  "questions": [
    {
      "id": "1",
      "type": "mcq",
      "question": "Professional scenario question...",
      "options": ["A", "B", "C", "D"],
      "correct_answer": "A",
      "explanation": "Detailed explanation...",
      "difficulty": "medium"
    }
  ]
}
    `;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const responseText = data.candidates[0].content.parts[0].text;
    
    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    
    return JSON.parse(jsonMatch[0]);
    
  } catch (error) {
    console.error('Error in direct API call:', error);
    throw error;
  }
};