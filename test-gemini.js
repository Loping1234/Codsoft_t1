// Test file for Gemini API key
import { GoogleGenerativeAI } from '@google/generative-ai';

// Your Gemini API key
const API_KEY = 'AIzaSyDZ62MQs_oeZ_ZPfzH0AUx8mUrfONpHCxM';

async function listAvailableModels() {
  try {
    console.log('Fetching available models...');
    
    const genAI = new GoogleGenerativeAI(API_KEY);
    
    // List available models
    const models = await genAI.listModels();
    
    console.log('📋 Available Models:');
    models.forEach((model) => {
      console.log(`- ${model.name}`);
      console.log(`  Display Name: ${model.displayName}`);
      console.log(`  Supported Methods: ${model.supportedGenerationMethods?.join(', ')}`);
      console.log('');
    });
    
    return models;
  } catch (error) {
    console.error('❌ Error listing models:', error.message);
    return [];
  }
}

async function testGeminiAPI() {
  try {
    console.log('Testing Gemini API connection...');
    
    // Initialize the Gemini AI client
    const genAI = new GoogleGenerativeAI(API_KEY);
    
    // First, let's list available models
    const models = await listAvailableModels();
    
    // Try different model names
    const modelNamesToTry = [
      "gemini-pro",
      "gemini-1.5-pro",
      "gemini-1.0-pro",
      "models/gemini-pro",
      "models/gemini-1.5-pro",
      "models/gemini-1.0-pro"
    ];
    
    let success = false;
    
    for (const modelName of modelNamesToTry) {
      try {
        console.log(`\n🧪 Trying model: ${modelName}`);
        
        // Get the generative model
        const model = genAI.getGenerativeModel({ model: modelName });
        
        // Simple test prompt
        const prompt = "Hello! Can you respond with 'Gemini API is working correctly!' to confirm the connection?";
        
        console.log('Sending test prompt...');
        
        // Generate content
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        console.log('✅ Success! Gemini API Response:');
        console.log(text);
        console.log(`✅ Working model: ${modelName}`);
        
        success = true;
        break;
        
      } catch (modelError) {
        console.log(`❌ Model ${modelName} failed:`, modelError.message);
      }
    }
    
    return success;
    
  } catch (error) {
    console.error('❌ Error testing Gemini API:');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    
    if (error.status) {
      console.error('HTTP Status:', error.status);
    }
    
    if (error.message.includes('API_KEY_INVALID')) {
      console.error('🔑 The API key appears to be invalid. Please check:');
      console.error('1. The key is correct');
      console.error('2. The Gemini API is enabled in your Google Cloud Console');
      console.error('3. Billing is set up if required');
    }
    
    return false;
  }
}

// Run the test
console.log('='.repeat(50));
console.log('🧪 GEMINI API TEST');
console.log('='.repeat(50));

testGeminiAPI()
  .then((success) => {
    if (success) {
      console.log('\n✅ Test completed successfully!');
      console.log('Your Gemini API key is working correctly.');
    } else {
      console.log('\n❌ Test failed!');
      console.log('Please check your API key and try again.');
    }
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('\n💥 Unexpected error:', error);
    process.exit(1);
  });