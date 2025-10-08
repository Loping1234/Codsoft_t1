// Quick API test to check which models work
import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = 'AIzaSyDZ62MQs_oeZ_ZPfzH0AUx8mUrfONpHCxM';
const genAI = new GoogleGenerativeAI(API_KEY);

async function testModels() {
  const modelsToTest = [
    'gemini-pro',
    'gemini-1.5-pro',
    'gemini-1.0-pro',
    'models/gemini-pro',
    'models/gemini-1.5-pro'
  ];

  console.log('🧪 Testing available models...');

  for (const modelName of modelsToTest) {
    try {
      console.log(`\n🔍 Testing: ${modelName}`);
      
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent('Hello! Just say "working" if you can read this.');
      const response = await result.response;
      const text = response.text();
      
      console.log(`✅ ${modelName}: ${text}`);
      
    } catch (error) {
      console.log(`❌ ${modelName}: ${error.message}`);
    }
  }
}

testModels();