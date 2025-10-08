// Comprehensive API Connectivity Test
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

console.log('\n========================================');
console.log('🔍 API CONNECTIVITY TEST SUITE');
console.log('========================================\n');

const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: []
};

function logTest(service, status, message, details = null) {
  const icon = status === 'success' ? '✅' : status === 'error' ? '❌' : '⚠️';
  console.log(`${icon} ${service}`);
  console.log(`   Status: ${status.toUpperCase()}`);
  console.log(`   ${message}`);
  if (details) {
    console.log(`   Details: ${JSON.stringify(details, null, 2)}`);
  }
  console.log('');
  
  results.tests.push({ service, status, message, details });
  if (status === 'success') results.passed++;
  else if (status === 'error') results.failed++;
  else results.warnings++;
}

// Test 1: Environment Variables
async function testEnvironmentVariables() {
  console.log('📋 Testing Environment Configuration...\n');
  
  if (!GEMINI_API_KEY) {
    logTest('Gemini API Key', 'error', 'VITE_GEMINI_API_KEY not found in environment');
    return false;
  } else {
    logTest('Gemini API Key', 'success', 'API key found in environment', {
      keyLength: GEMINI_API_KEY.length,
      prefix: GEMINI_API_KEY.substring(0, 10) + '...'
    });
  }
  
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    logTest('Supabase Config', 'error', 'Supabase credentials not found');
    return false;
  } else {
    logTest('Supabase Config', 'success', 'Supabase credentials found', {
      url: SUPABASE_URL,
      keyLength: SUPABASE_ANON_KEY.length
    });
  }
  
  return true;
}

// Test 2: Gemini Pro API
async function testGeminiPro() {
  console.log('🤖 Testing Gemini Pro API...\n');
  
  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const startTime = Date.now();
    const result = await model.generateContent('Say "API Connected" if you can read this message.');
    const response = await result.response;
    const text = response.text();
    const endTime = Date.now();
    
    logTest('Gemini Pro API', 'success', 'Successfully connected to Gemini Pro', {
      model: 'gemini-pro',
      responseTime: `${endTime - startTime}ms`,
      responsePreview: text.substring(0, 100),
      responseLength: text.length
    });
    return true;
  } catch (error) {
    logTest('Gemini Pro API', 'error', `Failed: ${error.message}`, {
      error: error.toString(),
      errorCode: error.code
    });
    return false;
  }
}

// Test 3: Gemini 1.5 Flash API
async function testGeminiFlash() {
  console.log('⚡ Testing Gemini 1.5 Flash API...\n');
  
  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const startTime = Date.now();
    const result = await model.generateContent('Respond with "Connected" in one word.');
    const response = await result.response;
    const text = response.text();
    const endTime = Date.now();
    
    logTest('Gemini 1.5 Flash API', 'success', 'Successfully connected to Gemini 1.5 Flash', {
      model: 'gemini-1.5-flash',
      responseTime: `${endTime - startTime}ms`,
      response: text.trim(),
      responseLength: text.length
    });
    return true;
  } catch (error) {
    logTest('Gemini 1.5 Flash API', 'error', `Failed: ${error.message}`, {
      error: error.toString(),
      errorCode: error.code
    });
    return false;
  }
}

// Test 4: Direct Gemini REST API
async function testGeminiDirectAPI() {
  console.log('🌐 Testing Direct Gemini REST API...\n');
  
  try {
    const startTime = Date.now();
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: 'Test connection - respond with OK'
            }]
          }]
        })
      }
    );
    const endTime = Date.now();

    if (response.ok) {
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
      
      logTest('Direct Gemini REST API', 'success', 'Direct API endpoint accessible', {
        statusCode: response.status,
        responseTime: `${endTime - startTime}ms`,
        responsePreview: text.substring(0, 100)
      });
      return true;
    } else {
      const errorData = await response.text();
      logTest('Direct Gemini REST API', 'error', `API returned error status`, {
        statusCode: response.status,
        statusText: response.statusText,
        error: errorData
      });
      return false;
    }
  } catch (error) {
    logTest('Direct Gemini REST API', 'error', `Network error: ${error.message}`, {
      error: error.toString()
    });
    return false;
  }
}

// Test 5: Supabase Connection
async function testSupabaseConnection() {
  console.log('💾 Testing Supabase Database...\n');
  
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    const startTime = Date.now();
    const { data, error } = await supabase
      .from('documents')
      .select('id')
      .limit(1);
    const endTime = Date.now();

    if (error) {
      logTest('Supabase Database', 'warning', `Database accessible but query returned error: ${error.message}`, {
        responseTime: `${endTime - startTime}ms`,
        error: error.message,
        hint: error.hint
      });
      return false;
    } else {
      logTest('Supabase Database', 'success', 'Successfully connected to Supabase database', {
        responseTime: `${endTime - startTime}ms`,
        recordsFound: data?.length || 0
      });
      return true;
    }
  } catch (error) {
    logTest('Supabase Database', 'error', `Connection failed: ${error.message}`, {
      error: error.toString()
    });
    return false;
  }
}

// Test 6: Supabase Auth
async function testSupabaseAuth() {
  console.log('🔐 Testing Supabase Authentication...\n');
  
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      logTest('Supabase Auth', 'warning', 'Auth service accessible but no active session', {
        error: error.message
      });
      return false;
    } else {
      logTest('Supabase Auth', 'success', session ? 'Active user session found' : 'Auth service accessible (no active session)', {
        hasSession: !!session,
        sessionInfo: session ? 'User logged in' : 'No active session'
      });
      return true;
    }
  } catch (error) {
    logTest('Supabase Auth', 'error', `Auth service error: ${error.message}`, {
      error: error.toString()
    });
    return false;
  }
}

// Test 7: Supabase Storage
async function testSupabaseStorage() {
  console.log('📦 Testing Supabase Storage...\n');
  
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
      logTest('Supabase Storage', 'error', `Storage service error: ${error.message}`, {
        error: error.message
      });
      return false;
    } else {
      logTest('Supabase Storage', 'success', 'Storage service accessible', {
        bucketCount: buckets?.length || 0,
        buckets: buckets?.map(b => b.name) || []
      });
      return true;
    }
  } catch (error) {
    logTest('Supabase Storage', 'error', `Storage connection error: ${error.message}`, {
      error: error.toString()
    });
    return false;
  }
}

// Test 8: Network Connectivity
async function testNetworkConnectivity() {
  console.log('🌍 Testing Network Connectivity...\n');
  
  try {
    const response = await fetch('https://www.google.com', {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000)
    });
    
    logTest('Network Connection', 'success', 'Internet connection is active', {
      statusCode: response.status
    });
    return true;
  } catch (error) {
    logTest('Network Connection', 'error', 'No internet connection detected', {
      error: error.message
    });
    return false;
  }
}

// Test 9: Quiz Generation Test
async function testQuizGeneration() {
  console.log('🎯 Testing Quiz Generation Feature...\n');
  
  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const testContent = 'Photosynthesis is the process by which plants convert sunlight into energy.';
    const prompt = `Generate 2 quiz questions from this content: "${testContent}". Return as JSON with questions array.`;
    
    const startTime = Date.now();
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const endTime = Date.now();
    
    logTest('Quiz Generation', 'success', 'Successfully generated quiz content', {
      responseTime: `${endTime - startTime}ms`,
      contentLength: text.length,
      preview: text.substring(0, 150) + '...'
    });
    return true;
  } catch (error) {
    logTest('Quiz Generation', 'error', `Quiz generation failed: ${error.message}`, {
      error: error.toString()
    });
    return false;
  }
}

// Main test execution
async function runAllTests() {
  console.log('Starting comprehensive API connectivity tests...\n');
  console.log('Timestamp:', new Date().toISOString());
  console.log('========================================\n');
  
  await testEnvironmentVariables();
  await testGeminiPro();
  await testGeminiFlash();
  await testGeminiDirectAPI();
  await testSupabaseConnection();
  await testSupabaseAuth();
  await testSupabaseStorage();
  await testNetworkConnectivity();
  await testQuizGeneration();
  
  // Final Summary
  console.log('\n========================================');
  console.log('📊 FINAL TEST SUMMARY');
  console.log('========================================\n');
  
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`⚠️  Warnings: ${results.warnings}`);
  console.log(`📝 Total Tests: ${results.tests.length}\n`);
  
  const successRate = ((results.passed / results.tests.length) * 100).toFixed(1);
  console.log(`Success Rate: ${successRate}%\n`);
  
  if (results.failed === 0) {
    console.log('🎉 ALL CRITICAL TESTS PASSED!');
    console.log('✨ Your API connectivity is fully operational.\n');
  } else {
    console.log('⚠️  SOME TESTS FAILED');
    console.log('Please review the failed tests above and check your API credentials.\n');
  }
  
  console.log('========================================\n');
}

// Run all tests
runAllTests().catch(error => {
  console.error('❌ Test suite error:', error);
  process.exit(1);
});
