# 📋 Quiz Parameters Reference Guide

Complete documentation of all quiz difficulty levels, custom topics, and configuration parameters used in the AI-Powered Study Platform.

---

## 🎯 DIFFICULTY LEVELS

### SimpleQuiz.tsx Parameters
The auto-scaled quiz system with 5 difficulty levels:

```javascript
{ id: 'beginner', name: '🌱 Beginner', desc: 'More questions, basic recall' }
{ id: 'intermediate', name: '📈 Intermediate', desc: 'Balanced coverage' }
{ id: 'advanced', name: '🎓 Advanced', desc: 'Fewer, deeper questions' }
{ id: 'expert', name: '🏆 Expert', desc: 'Minimal, highly complex' }
{ id: 'mixed', name: '🎯 Mixed', desc: 'All difficulty levels' }
```

### QuizConfigurator.tsx (Enhanced Quiz) Parameters
Advanced quiz configuration with detailed descriptions:

```javascript
{ value: 'beginner', label: 'Beginner', description: 'Basic recall and comprehension' }
{ value: 'intermediate', label: 'Intermediate', description: 'Application and analysis' }
{ value: 'advanced', label: 'Advanced', description: 'Synthesis and evaluation' }
{ value: 'expert', label: 'Expert', description: 'Innovation and creation' }
{ value: 'mixed', label: 'Mixed', description: 'All difficulty levels' }
```

### Difficulty Multipliers (quizGenerator.ts)
Mathematical scaling factors applied to question counts:

```javascript
const multipliers = {
  beginner: 1.2,      // More questions, simpler (20% increase)
  intermediate: 1.0,  // Balanced (no change)
  advanced: 0.85,     // Fewer, deeper questions (15% decrease)
  expert: 0.7,        // Significantly fewer, very complex (30% decrease)
  mixed: 1.0          // Balanced mix (no change)
};
```

### AI Prompt Descriptions
How the AI interprets each difficulty level:

```
- Beginner: Basic recall and understanding
- Intermediate: Application and analysis  
- Advanced: Synthesis and evaluation
- Expert: Critical thinking and innovation
- Mixed: Balanced distribution across all levels
```

---

## 📚 CUSTOM TOPICS PARAMETER

### SimpleQuiz.tsx Implementation

**Textarea Configuration:**
```javascript
<textarea
  value={customTopics}
  onChange={(e) => setCustomTopics(e.target.value)}
  placeholder="e.g., neural networks, optimization algorithms, regularization techniques"
  className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none transition-colors"
/>
```

**Helper Text:**
```
💡 Leave blank for comprehensive coverage of all content
```

### QuizConfigurator.tsx Implementation

**Input Field Configuration:**
```javascript
<input
  type="text"
  value={customTopics}
  onChange={(e) => setCustomTopics(e.target.value)}
  placeholder="e.g., machine learning, neural networks, data analysis"
  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
/>
```

**Processing Logic:**
```javascript
const finalConfig = {
  ...config,
  topicFocus: customTopics 
    ? customTopics.split(',').map(t => t.trim()).filter(t => t)
    : []
};
```

### AI Prompt Usage
How custom topics are integrated into the AI prompt:

```javascript
${customTopics ? `FOCUS TOPICS: ${customTopics}` : 'COVER ALL KEY CONCEPTS from the content'}
```

**Example Custom Topics:**
- `machine learning, neural networks, data analysis`
- `neural networks, optimization algorithms, regularization techniques`
- `calculus, derivatives, integration`
- `photosynthesis, cellular respiration, genetics`

---

## 📊 AUTO-SCALING ALGORITHM

### Word Count to Question Count Mapping

```javascript
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
```

### User-Facing Explanation

**Content Size → Question Count:**
```
• Short notes (200 words) → 5-6 questions
• Article (1,000 words) → 12-15 questions
• Chapter (3,500 words) → 25-30 questions
• Document (10,000 words) → 50-65 questions
```

**Difficulty Adjustment:**
```
• Beginner: 20% more questions, simpler
• Intermediate: Balanced coverage
• Advanced: 15% fewer, deeper questions
• Expert: 30% fewer, highly complex
```

### Final Calculation Formula

```javascript
const finalCount = Math.round((baseCount * multipliers[difficulty]) / 4) * 4;
return Math.max(5, Math.min(100, finalCount));
```

**Notes:**
- Questions are rounded to multiples of 4 for clean answer distribution
- Minimum: 5 questions
- Maximum: 100 questions

---

## ⚙️ ENHANCED QUIZ CONFIGURATION OPTIONS

### Complete EnhancedQuizConfig Interface

```javascript
{
  numQuestions: 10,                    // Number of questions to generate
  difficulty: 'intermediate',          // Difficulty level (see above)
  timePerQuestion: 60,                 // Time limit per question in seconds
  topicFocus: [],                      // Array of custom topics
  includeScenarios: true,              // Include real-world scenarios
  certificationLevel: false,           // PhD qualifier & board exam standard
  crossTopicIntegration: true          // Combine multiple concepts
}
```

### Parameter Details

#### numQuestions
```javascript
// Range: 1-50
// Default: 10
// UI: Slider input
<input type="range" min="1" max="50" value={config.numQuestions} />
```

#### timePerQuestion
```javascript
// Options (in seconds):
<option value={0}>No time limit</option>
<option value={30}>30 seconds</option>
<option value={60}>60 seconds</option>
<option value={90}>90 seconds</option>
<option value={120}>120 seconds</option>
```

#### includeScenarios
```javascript
// Checkbox option
// Label: "Professional Scenarios"
// Description: "Include real-world application questions"
// Default: true
```

#### certificationLevel
```javascript
// Checkbox option
// Label: "Certification Level"
// Description: "PhD qualifier & board exam standard questions"
// Default: false
```

#### crossTopicIntegration
```javascript
// Checkbox option
// Label: "Cross-Topic Integration"
// Description: "Combine multiple concepts intelligently"
// Default: true
```

---

## 🧠 AI FEATURES

The quiz generator includes these advanced AI capabilities:

```
✅ Professional real-world scenarios
✅ Balanced answer distribution (25% A/B/C/D)
✅ Cross-topic integration
✅ Certification-level quality
✅ Multiple question types (MCQ, True/False, Fill-in-Blank, Matching, Short Answer)
```

---

## 🎨 QUESTION TYPES SUPPORTED

1. **Multiple Choice (MCQ)**
   - 4 options (A, B, C, D)
   - Balanced distractor quality

2. **True/False**
   - Binary choice questions
   - Nuanced statements

3. **Fill-in-the-Blank**
   - Context-rich sentences
   - Key term identification

4. **Matching**
   - Logical pairs
   - Terms-definitions, causes-effects

5. **Short Answer**
   - Application questions
   - Analysis and synthesis

---

## 📝 AI PROMPT STRICT REQUIREMENTS

The quiz generator enforces these rules:

1. ❌ **NEVER** mention "the document", "according to the text", or reference the source
2. ✅ Create real-world professional scenarios
3. ✅ Balance answer options evenly (25% A/B/C/D distribution)
4. ✅ Include multiple question types intelligently
5. ✅ PhD-level critical thinking for advanced/expert
6. ✅ Professional context and practical applications

---

## 🔧 TECHNICAL IMPLEMENTATION

### Gemini AI Model
```javascript
const model = genAI.getGenerativeModel({ 
  model: 'gemini-2.5-flash'  // Fast, efficient model for quiz generation
});
```

### Content Processing
```javascript
// Maximum content length sent to AI
const prompt = `CONTENT: ${content.substring(0, 30000)}`;
```

### JSON Response Format
```json
{
  "title": "Professional Assessment",
  "estimatedLevel": "intermediate",
  "questionCount": 12,
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
```

---

## 📖 USAGE EXAMPLES

### Example 1: Beginner Level, No Custom Topics
```javascript
{
  difficulty: 'beginner',
  customTopics: '',
  // Result: 20% more questions, basic recall focus, covers all content
}
```

### Example 2: Expert Level with Custom Topics
```javascript
{
  difficulty: 'expert',
  customTopics: 'neural networks, backpropagation, optimization',
  // Result: 30% fewer questions, highly complex, focused on specified topics
}
```

### Example 3: Enhanced Quiz - Certification Mode
```javascript
{
  numQuestions: 25,
  difficulty: 'advanced',
  timePerQuestion: 120,
  topicFocus: ['machine learning', 'deep learning'],
  includeScenarios: true,
  certificationLevel: true,
  crossTopicIntegration: true
  // Result: PhD-level questions with professional scenarios, 2 min per question
}
```

---

## 🎯 BEST PRACTICES

### For Students
1. Start with **Beginner** or **Intermediate** for first attempt
2. Use **Custom Topics** to focus on weak areas
3. Enable **Certification Level** for exam preparation
4. Use **Time Limits** to simulate real exam conditions

### For Educators
1. Use **Expert** level for assessment preparation
2. Enable **Cross-Topic Integration** for comprehensive testing
3. Use **Scenario-Based Questions** for practical application
4. Adjust **Question Count** based on content depth

### For Content Length
- **< 500 words**: Beginner/Intermediate with 5-8 questions
- **500-2000 words**: Intermediate with 10-20 questions
- **2000-5000 words**: Advanced with 20-35 questions
- **> 5000 words**: Expert with 30-50 questions

---

## 📅 Last Updated
October 8, 2025

## 📝 Related Files
- `src/pages/SimpleQuiz.tsx` - Auto-scaled quiz interface
- `src/pages/Quiz.tsx` - Enhanced quiz interface
- `src/components/QuizConfigurator.tsx` - Configuration modal
- `src/lib/quizGenerator.ts` - Auto-scaling algorithm
- `src/lib/enhancedQuizGenerator.ts` - Advanced quiz generation

---

**Note:** All parameters are designed to work seamlessly with Google's Gemini 2.5 Flash model for optimal quiz generation quality and speed.
