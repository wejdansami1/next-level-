# NextLevel AI Study Planner

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) <!-- Optional License Badge -->
<!-- Add other badges if applicable: build status, code coverage, etc. -->

**An intelligent, AI-powered study planner and assistant designed to help students organize their academic life, featuring a unique LittleBigPlanet-inspired user interface.**

This application leverages the Google Gemini API to analyze user-provided events and prioritized tasks, generating optimized weekly schedules and actionable study plans. It includes an interactive schedule visualizer, a user-managed priority/to-do list system, and an AI chat assistant.

**Note:** This version utilizes a **local file-based system** for user data storage and authentication, making it suitable for personal use or prototyping, but **not for production deployment.**

---

## ✨ Key Features

*   **AI-Powered Plan Generation:** Uses Google Gemini to create personalized weekly study/work schedules based on events and user priorities.
*   **Interactive Schedule Visualization:** A dynamic, visually engaging timeline/block view (LBP-themed) showing planned tasks and events.
*   **Event Management:** Streamlined input for fixed events like exams, assignments, and meetings.
*   **Priority / To-Do List:** A dedicated section for users to:
    *   Add/manage personal tasks and optionally link them to events.
    *   Visually prioritize tasks via drag-and-drop ordering.
*   **AI Chat Assistant:** Conversational AI (powered by Gemini) aware of the user's schedule and plan.
*   **LittleBigPlanet Inspired UI/UX:** Unique, tactile, and whimsical interface reminiscent of the LBP game series.
*   **LBP-Style Notifications:** Themed, animated notifications for application feedback.
*   **Local Authentication & Data:** Secure user signup/login using local JSON files for data persistence (per user).
*   **(Optional) Gamification:** Leveling system with LBP-themed rewards for task completion.

## 🛠️ Technology Stack

*   **Frontend:** React (or Vue/Svelte - *update as per actual implementation*), HTML5, CSS3 (potentially Tailwind CSS or similar for styling)
*   **Backend:** Node.js, Express.js
*   **AI:** Google Gemini API
*   **Database:** Local File System (JSON files via Node.js `fs` module)
*   **Key Libraries:**
    *   `bcrypt`: Password hashing
    *   **Calendar/Timeline Library:** (e.g., FullCalendar.io, vis.js Timeline - *update as per actual implementation*)
    *   **Date/Time Picker Library:** (e.g., react-datepicker - *update as per actual implementation*)
    *   `express-session` (or similar for session management)

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

*   [Node.js](https://nodejs.org/) (LTS version recommended)
*   [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

## 🚀 Getting Started

Follow these steps to set up and run the project locally:

1.  **Clone the Repository:**
    ```bash
    git clone <your-repo-url>
    cd nextlevel-ai-planner
    ```

2.  **Install Backend Dependencies:**
    ```bash
    cd backend
    npm install
    # or: yarn install
    ```

3.  **Install Frontend Dependencies:**
    ```bash
    cd ../frontend
    npm install
    # or: yarn install
    ```

4.  **Configure Environment Variables (Backend):**
    *   Navigate back to the `backend` directory: `cd ../backend`
    *   Create a `.env` file in the `backend` directory.
    *   Add the following environment variables to the `.env` file:

        ```dotenv
        # --- REQUIRED ---
        # Get your Gemini API Key from Google AI Studio: https://aistudio.google.com/app/apikey
        GEMINI_API_KEY=YOUR_GOOGLE_GEMINI_API_KEY

        # --- RECOMMENDED ---
        # A secret string for signing session cookies (make this long and random)
        SESSION_SECRET=your_very_secret_session_key_string

        # Port for the backend server (optional, defaults usually to 3000 or similar)
        PORT=3001

        # --- OPTIONAL ---
        # Other configuration variables if needed
        ```
    *   **IMPORTANT:** Replace `YOUR_GOOGLE_GEMINI_API_KEY` and `your_very_secret_session_key_string` with your actual values. **Never commit your `.env` file to version control!** Add `.env` to your `.gitignore` file if it's not already there.

5.  **Create Data Directory (Backend):**
    *   Ensure the `./data/users/` directory exists within the `backend` folder. The application needs this to store user JSON files. If it doesn't exist, create it:
    ```bash
    # Ensure you are in the 'backend' directory
    mkdir -p data/users
    ```

## ▶️ Running the Application

You need to run both the backend and frontend servers concurrently.

1.  **Start the Backend Server:**
    *   Open a terminal in the `backend` directory.
    *   Run the start script (this might be `start` or `dev` depending on your `package.json`):
    ```bash
    # Example using npm:
    npm run dev
    # or: npm start
    ```
    *   The backend server should now be running (typically on `http://localhost:3001` or the `PORT` you specified).

2.  **Start the Frontend Development Server:**
    *   Open a *separate* terminal in the `frontend` directory.
    *   Run the start script:
    ```bash
    # Example using npm:
    npm start
    # or: npm run dev
    ```
    *   This will usually open the application automatically in your default web browser, typically at `http://localhost:3000`.

3.  **Access the Application:**
    *   Open your web browser and navigate to `http://localhost:3000` (or the port specified by the frontend development server).

## 📁 Project Structure (Simplified)