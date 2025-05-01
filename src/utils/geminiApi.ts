declare global {
  interface Window {
    GEMINI_API_KEY: string;
  }
}

// --- START Interface Definitions ---

interface GeminiModel {
  name?: string;
  // Add other relevant properties if known/needed
}

interface StudyHourRange {
  start: string;
  end: string;
}

interface StudyPreferences {
  studySessionLength?: number;
  breakLength?: number;
  preferredStudyHours?: StudyHourRange[];
  subjects?: string[];
}

interface SessionData {
  title: string;
  subject: string;
  startTime: string; // Expecting "HH:MM"
  endTime: string;   // Expecting "HH:MM"
  description?: string;
  isBreak?: boolean;
}

interface DailySessionData {
  date: string; // Expecting "YYYY-MM-DD"
  sessions?: SessionData[];
}

interface SmartPlanningData {
  priority: number;
  dueDate?: Date;
  examDate?: Date;
}

interface StudyDaySchedule {
  daySlots: { start: Date; end: Date }[];
  subjects: Set<string>;
  validSubjects: string[];
  events: ScheduleEvent[];
}

// --- END Interface Definitions ---


/**
 * Get the Gemini API key from various possible sources
 */
export function getApiKey(): string {
  // First check the environment variable from .env.local
  let apiKey = '';
  
  // Try direct environment variables (both Next.js and Vite naming conventions)
  if (typeof process !== 'undefined' && process.env) {
    if (process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
      apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      console.log("Retrieved API key from NEXT_PUBLIC_GEMINI_API_KEY");
    }
  }
  
  // Try Vite environment variables
  if (!apiKey && typeof import.meta !== 'undefined' && import.meta.env) {
    if (import.meta.env.VITE_GEMINI_API_KEY) {
      apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      console.log("Retrieved API key from VITE_GEMINI_API_KEY");
    } else if (import.meta.env.NEXT_PUBLIC_GEMINI_API_KEY) {
      apiKey = import.meta.env.NEXT_PUBLIC_GEMINI_API_KEY;
      console.log("Retrieved API key from NEXT_PUBLIC_GEMINI_API_KEY (via import.meta)");
    }
  }
  
  // If no environment variables found, try localStorage and window global
  if (!apiKey && typeof window !== 'undefined') {
    // Try localStorage (user might have set it manually via Settings page)
    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey && storedKey.trim().length > 10) {
      apiKey = storedKey;
      console.log("Retrieved API key from localStorage");
    }
    
    // Try window.GEMINI_API_KEY (might be set at application startup)
    if (!apiKey && window.GEMINI_API_KEY) {
      apiKey = window.GEMINI_API_KEY;
      console.log("Retrieved API key from window.GEMINI_API_KEY");
    }
  }
  
  // Set a hardcoded key as last resort (your original fallback)
  if (!apiKey) {
    apiKey = 'AIzaSyCkVZxbyceJ9XoS1rqYW__W50bmYc00v0I';
    console.log("Using fallback hardcoded API key");
  }
  
  return apiKey;
}

/**
 * Generate a mock response when the API is unavailable
 */
function generateMockResponse(prompt: string): string {
  console.log("Using mock response for:", prompt);
  const lowercasePrompt = prompt.toLowerCase();
  
  if (lowercasePrompt.includes("hello") || lowercasePrompt.includes("hi")) {
    return "Hello! I'm your AI study assistant (running in offline mode). How can I help you with your studies today?";
  }
  
  if (lowercasePrompt.includes("study") || lowercasePrompt.includes("learn")) {
    return "For effective studying, I recommend the Pomodoro technique: 25 minutes of focused study followed by a 5-minute break. This helps maintain concentration while preventing burnout. (Note: I'm currently in offline mode)";
  }
  
  if (lowercasePrompt.includes("exam") || lowercasePrompt.includes("test")) {
    return "When preparing for exams, create a study schedule, use active recall techniques, and take practice tests. Getting enough sleep the night before is crucial for memory recall. (Note: I'm currently in offline mode)";
  }
  
  return "I'm currently operating in offline mode due to API connectivity issues. I can still provide basic study advice, but my capabilities are limited until the connection is restored.";
}

/**
 * Verify if the API key is valid by making a minimal API request
 * This function is used to check API status before the user sends a message
 */
export async function verifyApiKeyStatus(): Promise<{
  isValid: boolean;
  message: string;
}> {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    return {
      isValid: false,
      message: "No API key configured. Please add your Gemini API key in Settings."
    };
  }
  
  try {
    // Try a minimal API call to test connectivity
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      { method: 'GET', headers: { 'Content-Type': 'application/json' } }
    );
    
    if (response.ok) {
      return {
        isValid: true,
        message: "API connection successful"
      };
    } else {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || `Error ${response.status}`;
      
      if (response.status === 403) {
        return {
          isValid: false,
          message: "API key is invalid or unauthorized"
        };
      } else if (response.status === 429) {
        return {
          isValid: false,
          message: "API quota exceeded. Try again later."
        };
      }
      
      return {
        isValid: false,
        message: `API error: ${errorMessage}`
      };
    }
  } catch (error) {
    console.error("API verification error:", error);
    return {
      isValid: false,
      message: "Connection failed. Check your internet connection."
    };
  }
}

/**
 * Generate a response using Google's Gemini API, potentially with schedule/priority context.
 * This implementation uses direct REST API calls with fetch
 */
export async function generateGeminiResponse(
  userPrompt: string,
  schedule?: ScheduleEvent[], // Optional schedule context
  priorities?: PriorityTask[] // Optional priorities context
): Promise<string> {
  try {
    const apiKey = getApiKey();
    console.log("API Key available:", !!apiKey);
    
    if (!apiKey) {
      console.error('Gemini API key not found');
      return "API configuration error. Please check .env.local file.";
    }

    // First check if API is accessible
    const apiStatus = await verifyApiKeyStatus();
    if (!apiStatus.isValid) {
      console.log("API not accessible, using mock response");
      return generateMockResponse(userPrompt); // Corrected variable name
    }

    // --- Construct the full prompt with context ---
    let fullPrompt = userPrompt;

    if (schedule && schedule.length > 0) {
      const scheduleContext = formatScheduleForPrompt(schedule);
      fullPrompt = `Here is my current schedule:\n${scheduleContext}\n\n${fullPrompt}`;
    }

    if (priorities && priorities.length > 0) {
      const prioritiesContext = formatPrioritiesForPrompt(priorities);
      fullPrompt = `Here are my current priority tasks:\n${prioritiesContext}\n\n${fullPrompt}`;
    }
    // --- End prompt construction ---


    // Get available models first to find the correct one
    try {
      const workingModel = await findWorkingModel(apiKey);
      if (workingModel) {
        console.log("Found working model:", workingModel);
        const result = await makeApiRequest(workingModel.endpoint, apiKey, fullPrompt); // Use fullPrompt
        return result;
      }
    } catch (modelError) {
      console.error("Error finding working model:", modelError);
    }
    
    // If model discovery fails, try multiple endpoints
    try {
      return await tryMultipleEndpoints(fullPrompt); // Use fullPrompt
    } catch (fallbackError) {
      console.error("All fallback methods failed:", fallbackError);
      // Return mock response as last resort
      return generateMockResponse(userPrompt); // Use original userPrompt for mock
    }
  } catch (error) {
    console.error("All API methods failed:", error);
    return generateMockResponse(userPrompt); // Use original userPrompt for mock
  }
}

/**
 * Find a working model by querying the available models
 */
async function findWorkingModel(apiKey: string): Promise<{model: string, endpoint: string} | null> {
  try {
    // Get list of available models
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`,
      { method: 'GET', headers: { 'Content-Type': 'application/json' } }
    );
    
    if (!response.ok) {
      // Try v1beta if v1 fails
      const betaResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
        { method: 'GET', headers: { 'Content-Type': 'application/json' } }
      );
      
      if (!betaResponse.ok) {
        throw new Error(`Failed to get models list: ${betaResponse.status}`);
      }
      
      const data = await betaResponse.json();
      console.log("Available models (beta):", data.models?.map((m: GeminiModel) => m.name)); // Use GeminiModel

      // Prioritize gemini-1.5-pro
      const preferredModelBeta = (data.models || []).find((m: GeminiModel) => m.name?.includes('gemini-1.5-pro')); // Use GeminiModel
      if (preferredModelBeta) {
        console.log("Found preferred model (beta):", preferredModelBeta.name);
        return {
          model: preferredModelBeta.name.split('/').pop(),
          endpoint: `https://generativelanguage.googleapis.com/v1beta/models/${preferredModelBeta.name.split('/').pop()}:generateContent`
        };
      }

      // Find any other suitable text generation model if 1.5-pro not found
      for (const model of data.models || []) {
        if (model.name?.includes('gemini') && !model.name?.includes('vision')) {
          console.log("Found fallback model (beta):", model.name);
          return {
            model: model.name.split('/').pop(),
            endpoint: `https://generativelanguage.googleapis.com/v1beta/models/${model.name.split('/').pop()}:generateContent`
          };
        }
      }
    } else {
      const data = await response.json();
      console.log("Available models (v1):", data.models?.map((m: GeminiModel) => m.name)); // Use GeminiModel

      // Prioritize gemini-1.5-pro
      const preferredModelV1 = (data.models || []).find((m: GeminiModel) => m.name?.includes('gemini-1.5-pro')); // Use GeminiModel
      if (preferredModelV1) {
        console.log("Found preferred model (v1):", preferredModelV1.name);
        return {
          model: preferredModelV1.name.split('/').pop(),
          endpoint: `https://generativelanguage.googleapis.com/v1/models/${preferredModelV1.name.split('/').pop()}:generateContent`
        };
      }

      // Find any other suitable text generation model if 1.5-pro not found
      for (const model of data.models || []) {
        if (model.name?.includes('gemini') && !model.name?.includes('vision')) {
          console.log("Found fallback model (v1):", model.name);
          return {
            model: model.name.split('/').pop(),
            endpoint: `https://generativelanguage.googleapis.com/v1/models/${model.name.split('/').pop()}:generateContent`
          };
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error("Failed to discover models:", error);
    return null;
  }
}

/**
 * Helper function to make the actual API request
 */
async function makeApiRequest(endpoint: string, apiKey: string, prompt: string): Promise<string> {
  console.log("Making API request to:", endpoint);
  
  // Some versions of the API expect a different format
  const isV1Beta = endpoint.includes('v1beta');
  
  let requestBody;
  
  // Different request formats for different endpoints
  if (isV1Beta) {
    requestBody = {
      contents: [{
        role: "user",
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048, // Increased for study plans
        topP: 0.8,
        topK: 40
      }
    };
  } else {
    // Older format for v1 endpoints that might not support the newer format
    requestBody = {
      contents: [{
        role: "user",
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048
      }
    };
  }

  try {
    const response = await fetch(`${endpoint}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorStatus = response.status;
      let errorText = "";
      
      try {
        const errorResponse = await response.json();
        console.error("API Error Response:", errorResponse);
        errorText = errorResponse.error?.message || await response.text() || `Error ${errorStatus}`;
      } catch (e) {
        try {
          errorText = await response.text();
        } catch (textError) {
          errorText = "Could not read error response";
        }
      }
      
      console.error(`API Error (${errorStatus}):`, errorText);
      throw new Error(`API error ${errorStatus}: ${errorText}`);
    }

    const data = await response.json();
    console.log("API Response structure:", Object.keys(data));
    
    // Handle different response formats
    if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      return data.candidates[0].content.parts[0].text;
    } else if (data?.candidates?.[0]?.text) {
      return data.candidates[0].text;
    } else if (data?.text) {
      return data.text;
    } else if (data?.candidates?.[0]?.content?.text) {
      return data.candidates[0].content.text;
    } else if (data?.candidates?.[0]?.message?.content) {
      return data.candidates[0].message.content;
    } else if (data?.candidates?.[0]?.output) {
      return data.candidates[0].output;
    }
    
    console.error("Unexpected response format:", JSON.stringify(data, null, 2));
    throw new Error("Invalid response format from API");
  } catch (error) {
    if (error instanceof Error) {
      console.error("API request failed:", error.message);
      throw error;
    }
    throw new Error("Unknown error during API request");
  }
}

/**
 * Try multiple API endpoints to find a working one
 */
export async function tryMultipleEndpoints(fullPrompt: string): Promise<string> {
  const endpoints = [
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent',
    'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent',
    'https://generativelanguage.googleapis.com/v1/models/gemini-1.0-pro:generateContent',
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.0-pro:generateContent',
    'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent',
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent'
  ];
  
  const apiKey = getApiKey();
  let lastError = null;
  
  // Try each endpoint with retries
  for (const endpoint of endpoints) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        console.log(`Trying endpoint: ${endpoint} (attempt ${attempt + 1})`);
        const result = await makeApiRequest(endpoint, apiKey, fullPrompt);

        // If we got here, the request succeeded
        console.log(`Success with endpoint: ${endpoint}`);
        localStorage.setItem('working_gemini_endpoint', endpoint);
        return result;
      } catch (e) {
        lastError = e;
        console.error(`Failed with endpoint ${endpoint} (attempt ${attempt + 1}):`, e);
        // Wait briefly before retry
        if (attempt === 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
  }
  
  throw lastError || new Error('All endpoints failed');
}

/**
 * Most basic possible request as a last resort
 */
async function basicFallbackRequest(apiKey: string, prompt: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: { text: prompt } })
  });
  
  if (!response.ok) throw new Error(`Basic fallback failed: ${response.status}`);
  
  const data = await response.json();
  if (data.candidates?.[0]?.output) {
    return data.candidates[0].output;
  }
  
  throw new Error("Unexpected response format from basic fallback");
}

/**
 * Test function to verify API connection
 */
export async function testGeminiApi(): Promise<{ success: boolean, message: string }> {
  try {
    const response = await generateGeminiResponse(
      "Hello, this is a test request. Please respond with 'API connection successful' if you receive this."
    );
    
    if (response && response.length > 10) {
      return { 
        success: true, 
        message: "Connected to Gemini API successfully" 
      };
    } else {
      return { 
        success: false, 
        message: response || "Empty response from API" 
      };
    }
  } catch (error) {
    return { 
      success: false, 
      message: `Connection test failed: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
}

// Types for study plan generation
interface ScheduleEvent {
  id: string;
  title: string;
  start: string; // ISO date string
  end: string; // ISO date string
  type?: string;
  priority?: number;
  description?: string;
  location?: string;
}

interface PriorityTask {
  id: string;
  title: string;
  priority: number;
  completed: boolean;
  dueDate?: string; // ISO date string
  subject?: string;
  estimatedTime?: number; // minutes
  relatedEventId?: string; // ID of related event
}

// Add a new interface for structured study plan
export interface StructuredStudyPlan {
  overview: string;
  sessions: StudySession[];
  tips: string[];
  summary: string;
}

export interface StudySession {
  id: string;
  title: string;
  subject: string;
  startTime: string; // ISO date string
  endTime: string; // ISO date string
  description?: string;
  isBreak: boolean;
}

/**
 * Format schedule data for the prompt
 */
function formatScheduleForPrompt(schedule: ScheduleEvent[]): string {
  if (!schedule || schedule.length === 0) {
    return "No existing schedule events.";
  }
  
  // Sort events by start time
  const sortedEvents = [...schedule].sort((a, b) => 
    new Date(a.start).getTime() - new Date(b.start).getTime()
  );
  
  return sortedEvents.map(event => {
    const start = new Date(event.start);
    const end = new Date(event.end);
    const duration = (end.getTime() - start.getTime()) / (1000 * 60); // in minutes
    
    return `- ${event.title} (${formatDate(start)} ${formatTime(start)} - ${formatTime(end)}, ${duration} mins)${
      event.description ? `, Description: ${event.description}` : ''
    }${event.type ? `, Type: ${event.type}` : ''}${
      event.priority ? `, Priority: ${event.priority}` : ''
    }`;
  }).join('\n');
}

/**
 * Format priorities data for the prompt
 */
function formatPrioritiesForPrompt(priorities: PriorityTask[]): string {
  if (!priorities || priorities.length === 0) {
    return "No priority tasks.";
  }
  
  // Sort by priority (higher number = higher priority)
  const sortedPriorities = [...priorities].sort((a, b) => b.priority - a.priority);
  
  return sortedPriorities.map(task => {
    return `- ${task.title} (Priority: ${task.priority})${
      task.subject ? `, Subject: ${task.subject}` : ''
    }${task.dueDate ? `, Due: ${formatDate(new Date(task.dueDate))}` : ''}${
      task.estimatedTime ? `, Est. Time: ${task.estimatedTime} mins` : ''
    }${task.completed ? ' [COMPLETED]' : ''}`;
  }).join('\n');
}

/**
 * Format study preferences for the prompt
 */
function formatPreferencesForPrompt(preferences: StudyPreferences): string { // Use StudyPreferences
  const lines = [];

  if (preferences.studySessionLength) {
    lines.push(`- Preferred study session length: ${preferences.studySessionLength} minutes`);
  }
  
  if (preferences.breakLength) {
    lines.push(`- Preferred break length: ${preferences.breakLength} minutes`);
  }
  if (preferences.preferredStudyHours && preferences.preferredStudyHours.length > 0) {
    const hoursStr = preferences.preferredStudyHours
      .map((h: StudyHourRange) => `${h.start} - ${h.end}`) // Use StudyHourRange
      .join(', ');
    lines.push(`- Preferred study hours: ${hoursStr}`);
  }
  
  if (preferences.subjects && preferences.subjects.length > 0) {
    lines.push(`- Subjects: ${preferences.subjects.join(', ')}`);
  }
  
  return lines.join('\n');
}

/**
 * Helper function to format date
 */
function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  });
}

/**
 * Helper function to format time
 */
function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

/**
 * Generate a study plan based on user's schedule and priorities
 */
export async function generateStudyPlan(
  schedule: ScheduleEvent[],
  priorities: PriorityTask[],
  preferences?: {
    studySessionLength?: number;
    breakLength?: number;
    preferredStudyHours?: { start: string; end: string }[];
    subjects?: string[];
  },
  timeframe: 'day' | 'week' | 'month' = 'week'
): Promise<{ textPlan: string, structuredPlan: StructuredStudyPlan }> {
  try {
    const apiKey = getApiKey();
    
    if (!apiKey) {
      console.error('Gemini API key not found');
      return generateIntelligentMockPlan(schedule, priorities, timeframe, preferences);
    }

    // Filter out past events and get exam dates
    const today = new Date();
    const filteredSchedule = schedule.filter(event => new Date(event.start) > today);
    const activePriorities = priorities.filter(task => {
      // Check if task is not completed
      if (task.completed) return false;
      
      // Check if task has a future due date or no due date
      if (task.dueDate && new Date(task.dueDate) <= today) return false;
      
      // If task is related to an event, check if that event has finished
      if (task.relatedEventId) {
        const relatedEvent = schedule.find(event => event.id === task.relatedEventId);
        if (relatedEvent && new Date(relatedEvent.end) <= today) {
          return false;
        }
      }
      
      return true;
    });

    // Format data for the prompt
    const scheduleData = formatScheduleForPrompt(filteredSchedule);
    const prioritiesData = formatPrioritiesForPrompt(activePriorities);
    const preferencesData = preferences ? formatPreferencesForPrompt(preferences) : "";
    
    // Calculate date range for the plan
    const startDate = new Date();
    const endDate = getEndDateForTimeframe(startDate, timeframe);

    // Build a more targeted prompt
    const prompt = `
Generate a structured study plan from ${formatDate(startDate)} to ${formatDate(endDate)}.

CURRENT SCHEDULE:
${scheduleData}

PRIORITY TASKS:
${prioritiesData}

${preferencesData ? `STUDY PREFERENCES:\n${preferencesData}\n` : ''}

Return response in this JSON format:
{
  "overview": "Brief plan strategy",
  "dailySessions": [
    {
      "date": "YYYY-MM-DD",
      "sessions": [
        {
          "title": "Session title",
          "subject": "Subject",
          "startTime": "HH:MM",
          "endTime": "HH:MM",
          "description": "Focus description",
          "isBreak": false
        }
      ]
    }
  ],
  "tips": ["Study tips"],
  "summary": "Study hours summary"
}`;

    try {
      // Set a reasonable timeout and make the API request
      const timeoutPromise = new Promise<string>((_, reject) => {
        setTimeout(() => reject(new Error("API request timed out")), 20000);
      });
      
      let responseText = "";
      const workingModel = await findWorkingModel(apiKey);
      
      try {
        responseText = await Promise.race([
          workingModel 
            ? makeApiRequest(workingModel.endpoint, apiKey, prompt)
            : tryMultipleEndpoints(prompt),
          timeoutPromise
        ]);

        const structuredPlan = extractStructuredPlan(responseText, startDate);
        
        // Validate the plan has sufficient sessions
        if (structuredPlan.sessions && structuredPlan.sessions.length > 0) {
          return {
            textPlan: responseText,
            structuredPlan
          };
        }
      } catch (error) {
        console.warn("Primary plan generation failed:", error);
      }

      // If we get here, either the plan was invalid or there was an error
      // Fall back to intelligent mock plan
      return generateIntelligentMockPlan(filteredSchedule, activePriorities, timeframe, preferences);
      
    } catch (error) {
      console.error("Plan generation error:", error);
      return generateIntelligentMockPlan(filteredSchedule, activePriorities, timeframe, preferences);
    }
  } catch (error) {
    console.error("Critical error:", error);
    return {
      textPlan: "Error generating study plan. Using fallback plan.",
      structuredPlan: createEmptyStructuredPlan()
    };
  }
}

/**
 * Create an empty structured plan for error cases
 */
function createEmptyStructuredPlan(): StructuredStudyPlan {
  return {
    overview: "Unable to generate a study plan at this time.",
    sessions: [],
    tips: ["Try again later when the service is available."],
    summary: ""
  };
}

/**
 * Get the end date for a given timeframe
 */
function getEndDateForTimeframe(startDate: Date, timeframe: 'day' | 'week' | 'month'): Date {
  const endDate = new Date(startDate);
  
  switch (timeframe) {
    case 'day':
      return endDate;
    case 'week':
      endDate.setDate(endDate.getDate() + 7);
      return endDate;
    case 'month':
      endDate.setMonth(endDate.getMonth() + 1);
      return endDate;
    default:
      endDate.setDate(endDate.getDate() + 7); // default to week
      return endDate;
  }
}

/**
 * Extract structured study plan from AI response
 */
function extractStructuredPlan(responseText: string, startDate: Date): StructuredStudyPlan {
  try {
    // First try to extract JSON using regex with improved pattern
    const jsonPattern = /\{[\s\S]*?\{[\s\S]*?\}[\s\S]*?\}/g;
    const matches = responseText.match(jsonPattern);
    
    if (matches) {
      // Try each potential JSON match
      for (const match of matches) {
        try {
          const data = JSON.parse(match);
          
          // Validate required structure
          if (!data.dailySessions || !Array.isArray(data.dailySessions)) {
            continue;
          }

          // Convert the dailySessions into StudySession[]
          const sessions: StudySession[] = [];
          
          for (const day of data.dailySessions) {
            if (!day.date || !day.sessions || !Array.isArray(day.sessions)) {
              continue;
            }

            for (const session of day.sessions) {
              // Validate required session fields
              if (!session.title || !session.startTime || !session.endTime) {
                continue;
              }

              try {
                // Create proper date objects by combining date and time
                const startDateTime = new Date(`${day.date}T${session.startTime}`);
                const endDateTime = new Date(`${day.date}T${session.endTime}`);

                if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
                  console.warn(`Invalid date/time: ${day.date} ${session.startTime}-${session.endTime}`);
                  continue;
                }

                sessions.push({
                  id: `study-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                  title: session.title,
                  subject: session.subject || 'Study',
                  startTime: startDateTime.toISOString(),
                  endTime: endDateTime.toISOString(),
                  description: session.description || '',
                  isBreak: session.isBreak || false
                });
              } catch (dateError) {
                console.warn('Error parsing session dates:', dateError);
                continue;
              }
            }
          }

          if (sessions.length > 0) {
            return {
              overview: data.overview || "Study plan generated by AI",
              sessions,
              tips: Array.isArray(data.tips) ? data.tips : [],
              summary: data.summary || ""
            };
          }
        } catch (jsonError) {
          console.warn('Failed to parse potential JSON match:', jsonError);
          continue;
        }
      }
    }
    
    // If no valid JSON found or parsing failed, try text-based extraction
    return createStructuredPlanFromText(responseText, startDate);
  } catch (error) {
    console.error("Error parsing AI response:", error);
    return createEmptyStructuredPlan();
  }
}

/**
 * Create structured plan from text response when JSON parsing fails
 */
function createStructuredPlanFromText(text: string, startDate: Date): StructuredStudyPlan {
  // Extract overview (first paragraph)
  const overviewMatch = text.match(/(?:overview|strategy|plan):(.*?)(?:\n\n|\n#|\n\*\*)/is);
  const overview = overviewMatch ? overviewMatch[1].trim() : "Study plan generated by AI";
  
  // Extract sessions - look for time patterns
  const sessions: StudySession[] = [];
  const timeRangeRegex = /(\d{1,2}:\d{2}\s*(?:AM|PM))\s*-\s*(\d{1,2}:\d{2}\s*(?:AM|PM))\s*:?\s*(.*?)(?:\n|$)/gi;
  
  // Extract day headers and process each day's content
  const dayRegex = /\*\*(\w+)(?:day)?(?:\s*[,-]\s*(\w+\s+\d{1,2}))?\*\*/gi;
  
  const days = [];
  let dayMatch;
  while ((dayMatch = dayRegex.exec(text)) !== null) {
    days.push({
      day: dayMatch[1],
      fullMatch: dayMatch[0],
      index: dayMatch.index
    });
  }
  
  for (let i = 0; i < days.length; i++) {
    const currentDay = days[i];
    const nextDay = days[i + 1];
    
    const dayText = nextDay 
      ? text.substring(currentDay.index, nextDay.index)
      : text.substring(currentDay.index);
    
    // Calculate the date for this day
    const sessionDate = new Date(startDate);
    const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      .findIndex(d => currentDay.day.toLowerCase().includes(d));
    
    if (dayOfWeek !== -1) {
      const currentDayOfWeek = startDate.getDay();
      const daysToAdd = (dayOfWeek - currentDayOfWeek + 7) % 7;
      sessionDate.setDate(sessionDate.getDate() + daysToAdd);
    }
    
    // Find all time ranges in this day
    let timeMatch;
    while ((timeMatch = timeRangeRegex.exec(dayText)) !== null) {
      const startTime = timeMatch[1];
      const endTime = timeMatch[2];
      const description = timeMatch[3].trim();
      
      const [startHour, startMinute] = parseTime(startTime);
      const [endHour, endMinute] = parseTime(endTime);
      
      const sessionStartDate = new Date(sessionDate);
      sessionStartDate.setHours(startHour, startMinute);
      
      const sessionEndDate = new Date(sessionDate);
      sessionEndDate.setHours(endHour, endMinute);
      
      const isBreak = description.toLowerCase().includes('break');
      const subject = isBreak ? 'Break' : description.split(':')[0] || 'Study';
      
      sessions.push({
        id: `study-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        title: isBreak ? 'Break' : `Study: ${subject}`,
        subject,
        startTime: sessionStartDate.toISOString(),
        endTime: sessionEndDate.toISOString(),
        description,
        isBreak
      });
    }
  }
  
  // Extract any tips from the text
  const tips: string[] = [];
  const tipsMatch = text.match(/(?:tips|suggestions|recommendations):([\s\S]*?)(?:\n\n|$)/i);
  if (tipsMatch) {
    const tipsText = tipsMatch[1];
    const tipLines = tipsText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    tips.push(...tipLines);
  }
  
  // Generate a summary
  const summary = `Generated ${sessions.filter(s => !s.isBreak).length} study sessions and ${
    sessions.filter(s => s.isBreak).length
  } breaks across ${days.length} days.`;
  
  return { overview, sessions, tips, summary };
}

/**
 * Parse time strings like "9:00 AM" or "3:30 PM" into hours and minutes
 */
function parseTime(timeStr: string): [number, number] {
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return [0, 0];
  
  let hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  const meridiem = match[3].toUpperCase();
  
  if (meridiem === 'PM' && hours < 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;
  
  return [hours, minutes];
}

/**
 * Generate intelligent descriptions for study sessions
 */
function generateSmartDescription(
  subject: string,
  subjectsToday: number,
  subjectData?: SmartPlanningData
): string {
  const parts: string[] = [];

  if (subjectData?.examDate) {
    const daysToExam = Math.ceil(
      (subjectData.examDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    parts.push(`Exam preparation - ${daysToExam} days remaining`);
  }

  if (subjectData?.dueDate) {
    const daysUntilDue = Math.ceil(
      (subjectData.dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysUntilDue <= 7) {
      parts.push(`Assignment due in ${daysUntilDue} days`);
    }
  }

  // Add cognitive load warning if studying multiple subjects
  if (subjectsToday > 2) {
    parts.push("Consider taking extra breaks between subject changes");
  }

  // Add time-based study technique suggestions
  const hour = new Date().getHours();
  if (hour < 11) {
    parts.push("Morning session - focus on challenging concepts");
  } else if (hour < 15) {
    parts.push("Afternoon session - practice problems and application");
  } else {
    parts.push("Evening session - review and consolidation");
  }

  return parts.join(". ") || `Study session for ${subject}`; // Ensure we always return a string
}

/**
 * Generate smart study tips based on the schedule
 */
function generateSmartStudyTips(
  sessions: StudySession[], 
  subjectPriorities: Map<string, SmartPlanningData>
): string[] {
  const tips: string[] = [
    "Use active recall techniques instead of passive reading",
    "Take short walks during breaks to improve focus",
    "Review material from previous sessions before starting new topics",
  ];

  // Add subject-specific tips
  const subjectsWithExams = Array.from(subjectPriorities.entries())
    .filter(([_, data]) => data.examDate)
    .map(([subject, data]) => ({
      subject,
      daysUntilExam: Math.ceil(
        (data.examDate!.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      )
    }));

  if (subjectsWithExams.length > 0) {
    const nextExam = subjectsWithExams.sort((a, b) => a.daysUntilExam - b.daysUntilExam)[0];
    tips.push(
      `Focus on ${nextExam.subject} - exam in ${nextExam.daysUntilExam} days`,
      `Do practice exams under timed conditions for ${nextExam.subject}`,
      `Review past topics and create summary notes for ${nextExam.subject}`,
      `Plan extra review sessions the day before the ${nextExam.subject} exam`
    );
  }

  // Check study patterns
  const longSessions = sessions.filter(s => 
    !s.isBreak && 
    (new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / (1000 * 60) > 60
  );

  if (longSessions.length > 0) {
    tips.push(
      "For longer study sessions, use the 50/10 rule: 50 minutes study, 10 minutes break"
    );
  }

  // Add exam-specific review tips
  const hasReviewSessions = sessions.some(s => s.title?.toLowerCase().includes('review'));
  if (hasReviewSessions) {
    tips.push(
      "Focus on practicing past exam questions during review sessions",
      "Create a checklist of key topics to review before the exam",
      "Use mind maps to connect different concepts during review",
      "Take practice tests under exam-like conditions"
    );
  }

  return tips;
}

/**
 * Generate an intelligent mock study plan with smart scheduling
 */
function generateIntelligentMockPlan(
  schedule: ScheduleEvent[],
  priorities: PriorityTask[],
  timeframe: string,
  preferences?: {
    studySessionLength?: number;
    breakLength?: number;
    preferredStudyHours?: { start: string; end: string }[];
    subjects?: string[];
  }
): { textPlan: string, structuredPlan: StructuredStudyPlan } {
  const startDate = new Date();
  const sessions: StudySession[] = [];
  const studyDays: Date[] = [];
  const subjectPriorities = new Map<string, SmartPlanningData>();
  
  // Get all exams from schedule (both upcoming and completed)
  const allExams = schedule.filter(event => 
    event.type?.toLowerCase() === 'exam'
  );

  // Get upcoming exams
  const upcomingExams = allExams.filter(exam => 
    new Date(exam.start) > startDate
  ).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  // Track completed exam subjects
  const completedExamSubjects = new Set(
    allExams
      .filter(exam => new Date(exam.start) <= startDate)
      .flatMap(exam => {
        const subject = exam.title?.toLowerCase() || '';
        // If this is a math exam, also mark calculus as completed
        if (subject.includes('math')) {
          return [subject, 'calculus'];
        }
        return [subject];
      })
  );

  // Get subjects from priorities and preferences, excluding completed exam subjects
  const subjects = new Set([
    ...(preferences?.subjects || []),
    ...priorities
      .map(p => p.subject || 'General Study')
      .filter(subject => !completedExamSubjects.has(subject.toLowerCase()))
  ]);

  // Add pre-exam review sessions (1 hour before each exam)
  upcomingExams.forEach(exam => {
    const examDate = new Date(exam.start);
    const reviewStart = new Date(examDate);
    reviewStart.setHours(examDate.getHours() - 1);
    const reviewEnd = new Date(examDate);

    sessions.push({
      id: `pre-exam-review-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: `Final Review: ${exam.title}`,
      subject: exam.title,
      startTime: reviewStart.toISOString(),
      endTime: reviewEnd.toISOString(),
      description: `Final review and key points before ${exam.title} exam`,
      isBreak: false
    });
  });

  // Set up study days based on timeframe
  const daysToSchedule = timeframe === 'day' ? 1 : timeframe === 'week' ? 7 : 30;
  for (let i = 0; i < daysToSchedule; i++) {
    const day = new Date(startDate);
    day.setDate(startDate.getDate() + i);
    if (day.getDay() !== 0) { // Skip Sundays
      studyDays.push(day);
    }
  }

  // Create study sessions for each day
  studyDays.forEach((day, dayIndex) => {
    const dayExam = upcomingExams.find(exam => {
      const examDate = new Date(exam.start);
      return examDate.toDateString() === new Date(day.getTime() + 24 * 60 * 60 * 1000).toDateString();
    });

    // Morning session (9:00 - 10:30)
    const morningStart = new Date(day);
    morningStart.setHours(9, 0, 0, 0);
    const morningEnd = new Date(day);
    morningEnd.setHours(10, 30, 0, 0);

    // If there's an exam tomorrow, make this a review session
    if (dayExam) {
      sessions.push({
        id: `study-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: `Pre-exam Review: ${dayExam.title}`,
        subject: dayExam.title,
        startTime: morningStart.toISOString(),
        endTime: morningEnd.toISOString(),
        description: `Final review and practice problems for tomorrow's exam in ${dayExam.title}`,
        isBreak: false
      });
    } else if (subjects.size > 0) { // Only schedule if there are non-completed subjects
      const subjectIndex = dayIndex % subjects.size;
      const subject = Array.from(subjects)[subjectIndex];
      sessions.push({
        id: `study-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: `Study: ${subject}`,
        subject,
        startTime: morningStart.toISOString(),
        endTime: morningEnd.toISOString(),
        description: generateSmartDescription(subject, subjects.size),
        isBreak: false
      });
    }

    // Morning break (10:30 - 10:45)
    const breakStart = new Date(morningEnd);
    const breakEnd = new Date(breakStart);
    breakEnd.setMinutes(breakEnd.getMinutes() + 15);
    sessions.push({
      id: `break-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: 'Break',
      subject: 'Break',
      startTime: breakStart.toISOString(),
      endTime: breakEnd.toISOString(),
      description: 'Take a short break to refresh',
      isBreak: true
    });

    // Afternoon session (14:00 - 15:30)
    const afternoonStart = new Date(day);
    afternoonStart.setHours(14, 0, 0, 0);
    const afternoonEnd = new Date(day);
    afternoonEnd.setHours(15, 30, 0, 0);

    // If there's an exam tomorrow, make this another review session
    if (dayExam) {
      sessions.push({
        id: `study-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: `Final Exam Prep: ${dayExam.title}`,
        subject: dayExam.title,
        startTime: afternoonStart.toISOString(),
        endTime: afternoonEnd.toISOString(),
        description: `Mock exam practice and final preparation for tomorrow's ${dayExam.title} exam`,
        isBreak: false
      });
    } else if (subjects.size > 0) { // Only schedule if there are non-completed subjects
      const subjectIndex = (dayIndex + 1) % subjects.size;
      const subject = Array.from(subjects)[subjectIndex];
      sessions.push({
        id: `study-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: `Study: ${subject}`,
        subject,
        startTime: afternoonStart.toISOString(),
        endTime: afternoonEnd.toISOString(),
        description: generateSmartDescription(subject, subjects.size),
        isBreak: false
      });
    }
  });

  return {
    textPlan: `# Intelligent Study Plan (${timeframe})\n\n${
      sessions.filter(s => !s.isBreak).length
    } study sessions across ${subjects.size} subjects${
      upcomingExams.length ? `, including dedicated review sessions for ${upcomingExams.length} upcoming exam(s)` : ''
    }`,
    structuredPlan: {
      overview: `Personalized study plan optimized for your schedule and priorities${
        upcomingExams.length ? ', with focused exam preparation' : ''
      }.`,
      sessions,
      tips: generateSmartStudyTips(sessions, subjectPriorities),
      summary: `Generated ${sessions.filter(s => !s.isBreak).length} study sessions and ${
        sessions.filter(s => s.isBreak).length
      } breaks across ${studyDays.length} days${
        upcomingExams.length ? `, including dedicated review sessions for upcoming exams` : ''
      }.`
    }
  };
}
