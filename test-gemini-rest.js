// Simple REST API test for Gemini API key
const API_KEY = 'AIzaSyDZ62MQs_oeZ_ZPfzH0AUx8mUrfONpHCxM';

async function testGeminiRestAPI() {
  try {
    console.log('Testing Gemini API with direct REST call...');
    
    // First, let's try to list models to see what's available
    const modelsUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;
    
    console.log('Fetching available models...');
    const modelsResponse = await fetch(modelsUrl);
    
    if (!modelsResponse.ok) {
      throw new Error(`HTTP ${modelsResponse.status}: ${modelsResponse.statusText}`);
    }
    
    const modelsData = await modelsResponse.json();
    
    console.log('✅ API Key is valid! Available models:');
    if (modelsData.models && modelsData.models.length > 0) {
      modelsData.models.forEach((model, index) => {
        console.log(`${index + 1}. ${model.name}`);
        console.log(`   Display Name: ${model.displayName || 'N/A'}`);
        console.log(`   Description: ${model.description || 'N/A'}`);
        console.log('');
      });
      
      // Find a suitable text generation model (not embedding models)
      const textGenerationModels = modelsData.models.filter(model => 
        model.name.includes('gemini') && 
        !model.name.includes('embedding') && 
        !model.name.includes('aqa') &&
        !model.name.includes('imagen')
      );
      
      if (textGenerationModels.length === 0) {
        console.log('❌ No suitable text generation models found');
        return false;
      }
      
      const testModel = textGenerationModels[0];
      console.log(`\n🧪 Testing content generation with: ${testModel.name}`);
      
      const generateUrl = `https://generativelanguage.googleapis.com/v1beta/${testModel.name}:generateContent?key=${API_KEY}`;
      
      const requestBody = {
        contents: [{
          parts: [{
            text: "Hello! Please respond with 'Gemini API is working correctly!' to confirm the connection."
          }]
        }]
      };
      
      const generateResponse = await fetch(generateUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!generateResponse.ok) {
        const errorText = await generateResponse.text();
        throw new Error(`Generate request failed: ${generateResponse.status} - ${errorText}`);
      }
      
      const generateData = await generateResponse.json();
      
      if (generateData.candidates && generateData.candidates[0] && generateData.candidates[0].content) {
        const responseText = generateData.candidates[0].content.parts[0].text;
        console.log('✅ Content generation successful!');
        console.log('Response:', responseText);
        return true;
      } else {
        console.log('⚠️ Unexpected response format:', generateData);
        return false;
      }
      
    } else {
      console.log('⚠️ No models found in the response');
      console.log('Response:', modelsData);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error testing Gemini API:');
    console.error('Error:', error.message);
    
    if (error.message.includes('403')) {
      console.error('\n🔑 API Key Issues - Possible causes:');
      console.error('1. API key is invalid or expired');
      console.error('2. Gemini API is not enabled for your project');
      console.error('3. Billing is not set up (if required)');
      console.error('4. API key restrictions (if any) are blocking the request');
    } else if (error.message.includes('400')) {
      console.error('\n📝 Request format issue - check the API documentation');
    } else if (error.message.includes('429')) {
      console.error('\n⏰ Rate limit exceeded - try again later');
    }
    
    return false;
  }
}

// Run the test
console.log('='.repeat(60));
console.log('🧪 GEMINI REST API TEST');
console.log('='.repeat(60));

testGeminiRestAPI()
  .then((success) => {
    console.log('\n' + '='.repeat(60));
    if (success) {
      console.log('✅ SUCCESS: Your Gemini API key is working correctly!');
      console.log('You can now use this API key in your application.');
    } else {
      console.log('❌ FAILED: There was an issue with your API key or setup.');
      console.log('Please check the error messages above and try again.');
    }
    console.log('='.repeat(60));
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('\n💥 Unexpected error:', error);
    process.exit(1);
  });