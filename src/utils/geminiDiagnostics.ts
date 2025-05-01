import { getApiKey } from './geminiApi';

/**
 * Diagnostic test results
 */
export interface DiagnosticResult {
  name: string;
  passed: boolean;
  message: string;
  details?: string;
}

/**
 * Run a comprehensive API connection diagnostic
 */
export async function runGeminiDiagnostics(): Promise<{
  overallStatus: 'success' | 'failed' | 'partial';
  results: DiagnosticResult[];
  recommendations: string[];
}> {
  const results: DiagnosticResult[] = [];
  const recommendations: string[] = [];
  
  // Test 1: Check if API key exists
  const apiKey = getApiKey();
  const keyExists = !!apiKey;
  results.push({
    name: 'API Key Check',
    passed: keyExists,
    message: keyExists ? 'API key is configured' : 'API key is missing',
    details: keyExists ? `Key starts with: ${apiKey.substring(0, 4)}...` : 'No key found in any location'
  });
  
  if (!keyExists) {
    recommendations.push('Set up your Gemini API key in the .env.local file or in the application settings');
  }
  
  // Test 2: Check internet connectivity
  let hasInternet = false;
  try {
    const googleResponse = await fetch('https://www.google.com', { 
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-store'
    });
    hasInternet = true;
    results.push({
      name: 'Internet Connectivity',
      passed: true,
      message: 'Internet connection is available'
    });
  } catch (error) {
    results.push({
      name: 'Internet Connectivity',
      passed: false,
      message: 'No internet connection detected',
      details: error instanceof Error ? error.message : String(error)
    });
    recommendations.push('Check your internet connection and make sure your device is online');
  }
  
  // Only continue tests if we have an API key and internet
  if (keyExists && hasInternet) {
    // Test 3: Validate API key with Google
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
        { 
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }
      );
      
      if (response.ok) {
        results.push({
          name: 'API Key Validation',
          passed: true,
          message: 'API key is valid and accepted by Google'
        });
      } else {
        const errorText = await response.text();
        results.push({
          name: 'API Key Validation',
          passed: false,
          message: `API key was rejected with status ${response.status}`,
          details: errorText
        });
        
        if (response.status === 403) {
          recommendations.push('Your API key appears to be invalid or unauthorized. Create a new API key at https://aistudio.google.com/app/apikey');
        } else if (response.status === 429) {
          recommendations.push('You may have exceeded your API quota. Check your usage limits in Google AI Studio.');
        }
      }
    } catch (error) {
      results.push({
        name: 'API Key Validation',
        passed: false,
        message: 'Could not validate API key due to connection error',
        details: error instanceof Error ? error.message : String(error)
      });
      recommendations.push('There may be a network issue preventing API connections. Check for firewalls or try a different network.');
    }
    
    // Test 4: Try simple API request
    try {
      const testEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
      const response = await fetch(`${testEndpoint}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: 'Hello, can you hear me?' }]
          }],
        })
      });
      
      if (response.ok) {
        results.push({
          name: 'API Request Test',
          passed: true,
          message: 'Successfully made a request to the Gemini API'
        });
      } else {
        const errorText = await response.text();
        results.push({
          name: 'API Request Test',
          passed: false,
          message: `API request failed with status ${response.status}`,
          details: errorText
        });
        
        if (response.status === 404) {
          recommendations.push('The API endpoint might have changed. Check for updates to the Gemini API documentation.');
        }
      }
    } catch (error) {
      results.push({
        name: 'API Request Test',
        passed: false,
        message: 'Could not complete API request',
        details: error instanceof Error ? error.message : String(error)
      });
      
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        recommendations.push('CORS issues detected. You might need to use a proxy server or backend API to make requests.');
      }
    }
  }
  
  // Determine overall status
  const passedTests = results.filter(r => r.passed).length;
  const overallStatus = passedTests === results.length ? 'success' : 
                        passedTests > 0 ? 'partial' : 'failed';
                        
  // Add general recommendations if we have problems
  if (overallStatus !== 'success') {
    if (recommendations.length === 0) {
      recommendations.push(
        'Try using a different browser or network connection',
        'The Gemini API service might be temporarily unavailable - try again later'
      );
    }
  }
  
  return {
    overallStatus,
    results,
    recommendations
  };
}
