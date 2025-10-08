// Test file to verify the quiz generator functionality
import { calculateQuestionCount, generateAutoScaledQuiz } from './lib/quizGenerator';

// Test the calculateQuestionCount function
console.log('Testing calculateQuestionCount function:');

const testContent1 = 'This is a short test content with less than 200 words. '.repeat(10); // ~100 words
const testContent2 = 'This is a medium test content with words. '.repeat(50); // ~350 words  
const testContent3 = 'This is a long test content with many words to test the scaling. '.repeat(100); // ~1300 words

console.log('Short content (100 words):');
console.log('- Beginner:', calculateQuestionCount(testContent1, 'beginner'));
console.log('- Intermediate:', calculateQuestionCount(testContent1, 'intermediate'));
console.log('- Advanced:', calculateQuestionCount(testContent1, 'advanced'));
console.log('- Expert:', calculateQuestionCount(testContent1, 'expert'));

console.log('\nMedium content (350 words):');
console.log('- Beginner:', calculateQuestionCount(testContent2, 'beginner'));
console.log('- Intermediate:', calculateQuestionCount(testContent2, 'intermediate'));
console.log('- Advanced:', calculateQuestionCount(testContent2, 'advanced'));
console.log('- Expert:', calculateQuestionCount(testContent2, 'expert'));

console.log('\nLong content (1300 words):');
console.log('- Beginner:', calculateQuestionCount(testContent3, 'beginner'));
console.log('- Intermediate:', calculateQuestionCount(testContent3, 'intermediate'));
console.log('- Advanced:', calculateQuestionCount(testContent3, 'advanced'));
console.log('- Expert:', calculateQuestionCount(testContent3, 'expert'));

// Test the actual quiz generation (requires API key)
async function testQuizGeneration() {
  try {
    console.log('\nTesting quiz generation...');
    const quiz = await generateAutoScaledQuiz(testContent2, 'intermediate', 'basic concepts');
    console.log('✅ Quiz generated successfully!');
    console.log('- Title:', quiz.title);
    console.log('- Question count:', quiz.questionCount);
    console.log('- First question:', quiz.questions[0]?.question.substring(0, 100) + '...');
  } catch (error) {
    console.log('❌ Quiz generation failed:', error.message);
  }
}

// Uncomment to test actual API call (requires valid API key in environment)
// testQuizGeneration();