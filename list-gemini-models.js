// List available Gemini models
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.VITE_GEMINI_API_KEY;

async function listAvailableModels() {
  console.log('🔍 Fetching available Gemini AI models...\n');
  
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log('📋 Available Models:\n');
    console.log('========================================\n');
    
    if (data.models && data.models.length > 0) {
      data.models.forEach((model, index) => {
        console.log(`${index + 1}. ${model.name}`);
        console.log(`   Display Name: ${model.displayName || 'N/A'}`);
        console.log(`   Description: ${model.description || 'N/A'}`);
        console.log(`   Supported Methods: ${model.supportedGenerationMethods?.join(', ') || 'N/A'}`);
        console.log('');
      });
      
      console.log('========================================\n');
      console.log(`✅ Total models found: ${data.models.length}\n`);
      
      // Test with the first available model that supports generateContent
      const contentModel = data.models.find(m => 
        m.supportedGenerationMethods?.includes('generateContent')
      );
      
      if (contentModel) {
        console.log(`🧪 Testing with model: ${contentModel.name}\n`);
        await testModel(contentModel.name);
      }
    } else {
      console.log('❌ No models found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function testModel(modelName) {
  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: modelName });
    
    const result = await model.generateContent('Say hello!');
    const response = await result.response;
    const text = response.text();
    
    console.log(`✅ Model ${modelName} is working!`);
    console.log(`   Response: ${text.substring(0, 100)}`);
    console.log('');
  } catch (error) {
    console.log(`❌ Model ${modelName} failed: ${error.message}\n`);
  }
}

listAvailableModels();
