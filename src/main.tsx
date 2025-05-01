import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Load environment variables from .env.local for Gemini API
// This ensures the API key is available at application startup
if (import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.NEXT_PUBLIC_GEMINI_API_KEY) {
  const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.NEXT_PUBLIC_GEMINI_API_KEY;
  // Set the API key in window global for immediate access
  window.GEMINI_API_KEY = geminiApiKey;
  console.log("Loaded Gemini API key from environment variables");
  
  // Also store in localStorage for persistence across sessions
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('gemini_api_key', geminiApiKey);
  }
}

createRoot(document.getElementById("root")!).render(<App />);
