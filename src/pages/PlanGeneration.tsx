import { useState, useEffect } from "react";
import { useEvents, ScheduleEvent } from "@/contexts/EventContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, BookOpen, MessageSquare, Calendar, CheckCircle, Clock, AlertCircle, Wifi, WifiOff, Settings } from "lucide-react";
import { format } from "date-fns";
import { generateGeminiResponse, generateStudyPlan, verifyApiKeyStatus, getApiKey } from "@/utils/geminiApi";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";
import { useLBPNotification } from "@/hooks/use-lbp-notification";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface StudySession {
  id: string;
  title: string;
  subject: string;
  startTime: string;
  endTime: string;
  description?: string;
  isBreak: boolean;
}

interface StructuredStudyPlan {
  overview: string;
  sessions: StudySession[];
  tips: string[];
  summary: string;
}

const PlanGeneration = () => {
  const { events, studyTasks, priorityTasks, addStudyPlan, loading, clearStudyPlan } = useEvents();
  const [userInput, setUserInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [studyPlan, setStudyPlan] = useState<{ text: string; structured: StructuredStudyPlan | null }>({
    text: "",
    structured: null,
  });
  const [isPlanGenerating, setIsPlanGenerating] = useState(false);
  const [planAdded, setPlanAdded] = useState(false);
  const [apiStatus, setApiStatus] = useState<{
    checked: boolean;
    online: boolean;
    message: string;
  }>({
    checked: false,
    online: false,
    message: "Checking API status...",
  });

  const navigate = useNavigate();
  const { success, error } = useLBPNotification();

  useEffect(() => {
    const apiKey = getApiKey();

    const checkApiStatus = async () => {
      try {
        const status = await verifyApiKeyStatus();

        setApiStatus({
          checked: true,
          online: status.isValid,
          message: status.message,
        });

        if (!status.isValid) {
          if (!status.message.includes("No API key configured")) {
            setChatMessages((prev) => [
              ...prev,
              {
                id: `system-${Date.now()}`,
                role: "assistant",
                content:
                  "I'm currently operating in offline mode due to API connectivity issues. I can still help with basic study advice, but my capabilities are limited until the connection is restored.",
                timestamp: new Date(),
              },
            ]);
          } else if (!apiKey || apiKey === 'AIzaSyCkVZxbyceJ9XoS1rqYW__W50bmYc00v0I') {
            setChatMessages((prev) => [
              ...prev,
              {
                id: `api-key-guide-${Date.now()}`,
                role: "assistant",
                content: 
                  "Welcome! To access the full AI capabilities, you'll need to add your Gemini API key in Settings → AI Settings. You can get a free key from Google AI Studio.",
                timestamp: new Date(),
              },
            ]);
          }
        }
      } catch (error) {
        console.error("API status check failed:", error);
        setApiStatus({
          checked: true,
          online: false,
          message: "Failed to verify API connection",
        });
      }
    };

    checkApiStatus();

    const intervalId = setInterval(checkApiStatus, 60000);

    return () => clearInterval(intervalId);
  }, []);

  const handleGeneratePlan = async () => {
    try {
      setIsPlanGenerating(true);
      setPlanAdded(false);

      const formattedEvents = events.map((event) => ({
        id: event.id,
        title: event.title,
        start: event.startDate,
        end: new Date(new Date(event.startDate).getTime() + event.duration * 60000).toISOString(),
        type: event.category,
        description: event.description || "",
        priority: event.priority === "High" ? 3 : event.priority === "Medium" ? 2 : 1,
      }));

      const formattedPriorities = priorityTasks.map((task) => ({
        id: task.id,
        title: task.title,
        priority: task.priority || task.order + 1,
        completed: task.isCompleted,
        dueDate: task.dueDate,
        subject: task.subject,
        estimatedTime: task.estimatedDurationMinutes,
      }));

      const preferences = {
        studySessionLength: 45,
        breakLength: 10,
        preferredStudyHours: [{ start: "09:00", end: "17:00" }],
        subjects: Array.from(new Set(priorityTasks.map((task) => task.subject).filter(Boolean))),
      };

      const generatedPlan = await generateStudyPlan(
        formattedEvents,
        formattedPriorities,
        preferences,
        'week'
      );

      if (generatedPlan?.structuredPlan?.sessions?.length > 0) {
        setStudyPlan({
          text: generatedPlan.textPlan,
          structured: generatedPlan.structuredPlan,
        });
        setApiStatus(prev => ({
          ...prev,
          online: true,
          message: "Plan generated successfully"
        }));
      } else {
        const mockPlan = generateMockStructuredPlan();
        setStudyPlan({
          text: "Could not generate AI study plan. Using fallback plan instead.",
          structured: mockPlan,
        });
        setApiStatus(prev => ({
          ...prev,
          online: false,
          message: "Failed to generate plan - using fallback"
        }));
      }
    } catch (error) {
      console.error("Error in study plan generation:", error);
      const mockPlan = generateMockStructuredPlan();
      setStudyPlan({
        text: "Failed to generate study plan. Using fallback plan.",
        structured: mockPlan,
      });
      setApiStatus(prev => ({
        ...prev,
        online: false,
        message: error instanceof Error ? error.message : "Unknown error"
      }));
    } finally {
      setIsPlanGenerating(false);
    }
  };

  const generateMockStructuredPlan = (): StructuredStudyPlan => {
    const sessions: StudySession[] = [];
    const startDate = new Date();

    const subjects = Array.from(
      new Set(priorityTasks.filter((t) => !t.isCompleted).map((t) => t.subject || "General Study"))
    );

    for (let day = 0; day < 5; day++) {
      const sessionDate = new Date(startDate);
      sessionDate.setDate(startDate.getDate() + day);

      const morningStart = new Date(sessionDate);
      morningStart.setHours(9, 0, 0, 0);
      const morningEnd = new Date(sessionDate);
      morningEnd.setHours(10, 30, 0, 0);

      sessions.push({
        id: `mock-morning-${day}`,
        title: `Study: ${subjects[day % subjects.length]}`,
        subject: subjects[day % subjects.length],
        startTime: morningStart.toISOString(),
        endTime: morningEnd.toISOString(),
        description: `Focus on key concepts in ${subjects[day % subjects.length]}`,
        isBreak: false,
      });

      const breakStart = new Date(morningEnd);
      const breakEnd = new Date(breakStart);
      breakEnd.setMinutes(breakEnd.getMinutes() + 15);

      sessions.push({
        id: `mock-break-${day}`,
        title: `Break`,
        subject: `Break`,
        startTime: breakStart.toISOString(),
        endTime: breakEnd.toISOString(),
        description: `Take a short break to refresh`,
        isBreak: true,
      });

      const afternoonStart = new Date(sessionDate);
      afternoonStart.setHours(14, 0, 0, 0);
      const afternoonEnd = new Date(sessionDate);
      afternoonEnd.setHours(15, 30, 0, 0);

      sessions.push({
        id: `mock-afternoon-${day}`,
        title: `Study: ${subjects[(day + 1) % subjects.length]}`,
        subject: subjects[(day + 1) % subjects.length],
        startTime: afternoonStart.toISOString(),
        endTime: afternoonEnd.toISOString(),
        description: `Practice problems in ${subjects[(day + 1) % subjects.length]}`,
        isBreak: false,
      });
    }

    return {
      overview: "A balanced study plan focusing on your priority subjects with regular breaks",
      sessions,
      tips: [
        "Use active recall techniques instead of passive reading",
        "Take short walks during your breaks to improve concentration",
        "Review material from previous days before starting new topics",
        "Stay hydrated throughout your study sessions",
        "Use the Pomodoro technique (25 min study, 5 min break)",
      ],
      summary: `This plan includes ${sessions.filter((s) => !s.isBreak).length} study sessions across ${subjects.length} subjects with regular breaks. Total study time: ${Math.round(sessions.reduce((acc, s) => !s.isBreak ? acc + ((new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / (1000 * 60 * 60)) : acc, 0) * 10) / 10} hours over ${Math.ceil(sessions.length / 3)} days.`
    };
  };

  const handleAddToSchedule = () => {
    if (!studyPlan.structured) {
      error("No study plan", "Please generate a study plan first");
      return;
    }

    try {
      // Clear existing study plan first
      clearStudyPlan();

      // Transform and add each session
      studyPlan.structured.sessions.forEach((session) => {
        const startDate = new Date(session.startTime);
        const endDate = new Date(session.endTime);
        
        // Calculate duration in minutes
        const duration = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60));

        addStudyPlan({
          id: session.id,
          title: session.title,
          startTime: session.startTime,
          endTime: session.endTime,
          description: session.description || "",
          category: session.isBreak ? "break" : "study",
          subject: session.subject,
          duration: duration,
          isBreak: session.isBreak,
          isCompleted: false
        });
      });

      setPlanAdded(true);
      success("Plan Added", "Study plan has been added to your schedule");
      
      // Navigate to schedule view
      setTimeout(() => navigate('/schedule'), 1500);
    } catch (error) {
      console.error("Error adding study plan:", error);
      error("Failed to add plan", "There was an error adding the study plan to your schedule");
    }
  };

  const navigateToSettings = () => {
    navigate('/settings');
  };

  const sendMessage = async () => {
    if (!userInput.trim() || isProcessing) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: userInput,
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setUserInput("");
    setIsProcessing(true);

    try {
      // Get current context
      const upcomingEvents = events
        .filter(event => new Date(event.startDate) > new Date())
        .slice(0, 5);
      
      const activePriorities = priorityTasks
        .filter(task => !task.isCompleted)
        .sort((a, b) => a.order - b.order)
        .slice(0, 5);

      const todayStudyTasks = studyTasks
        .filter(task => {
          const taskDate = new Date(task.scheduledStartTime);
          const today = new Date();
          return taskDate.getDate() === today.getDate() && 
                 taskDate.getMonth() === today.getMonth() &&
                 taskDate.getFullYear() === today.getFullYear();
        });

      const recentMessages = chatMessages
        .slice(-5)
        .map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
        .join("\n\n");

      const contextPrompt = `
You are an AI study assistant for the NextLevel app. Your purpose is to help students with their academic studies.
You have access to the following real-time information about the user:

UPCOMING EVENTS (next 5):
${upcomingEvents.map(event => `- ${event.title} (${format(new Date(event.startDate), "MMM dd, h:mm a")}) - ${event.category}${event.priority ? ` - Priority: ${event.priority}` : ''}`).join('\n')}

ACTIVE PRIORITIES (top 5):
${activePriorities.map(task => `- ${task.title}${task.subject ? ` (${task.subject})` : ''} - Est. ${task.estimatedDurationMinutes} mins`).join('\n')}

TODAY'S STUDY TASKS:
${todayStudyTasks.map(task => `- ${task.title} (${format(new Date(task.scheduledStartTime), "h:mm a")} - ${format(new Date(task.scheduledEndTime), "h:mm a")})${task.isCompleted ? ' ✓' : ''}`).join('\n')}

Previous conversation:
${recentMessages}

User: ${userInput}

Please provide a helpful response that takes into account the user's current schedule, priorities, and study tasks. When appropriate, offer specific study techniques, schedule suggestions, or strategies that align with their existing commitments.
`;

      const responsePromise = generateGeminiResponse(contextPrompt);
      const timeoutPromise = new Promise<string>((_, reject) => {
        setTimeout(() => reject(new Error("Request timed out after 20 seconds")), 20000);
      });

      const response = await Promise.race([responsePromise, timeoutPromise]);

      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: response,
        timestamp: new Date(),
      };

      setChatMessages((prev) => [...prev, aiMessage]);

      if (response.includes("offline mode")) {
        setApiStatus({
          checked: true,
          online: false,
          message: "API unavailable - using offline mode",
        });
      } else {
        setApiStatus((prev) =>
          prev.online ? prev : { checked: true, online: true, message: "API connected" }
        );
      }
    } catch (error) {
      console.error("Error sending message:", error);

      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "Sorry, I encountered an error processing your request. I'll switch to offline mode for now.",
        timestamp: new Date(),
      };

      setChatMessages((prev) => [...prev, errorMessage]);

      setApiStatus({
        checked: true,
        online: false,
        message: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickPrompts = [
    "What's on my schedule for today?",
    "What should I focus on next based on my priorities?",
    "How am I progressing with my study tasks?",
    "Can you help me balance my upcoming events?",
  ];

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi there! I'm your AI study assistant. I can help you create a study plan, answer questions about your subjects, or provide study tips. What would you like to do today?",
      timestamp: new Date(),
    },
  ]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Study Assistant</h1>
          <p className="text-muted-foreground">Get AI-powered study plans and advice</p>
        </div>
        <div className="flex items-center gap-2">
          {apiStatus.checked && (
            <>
              <Alert className={`flex items-center ${apiStatus.online ? "bg-green-50" : "bg-red-50"}`}>
                {apiStatus.online ? (
                  <Wifi className="h-4 w-4 text-green-600" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription className={apiStatus.online ? "text-green-700" : "text-red-700"}>
                  {apiStatus.message}
                </AlertDescription>
              </Alert>
              
              {!apiStatus.online && !apiStatus.message.includes("using fallback") && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={navigateToSettings}
                  className="flex items-center gap-1"
                >
                  <Settings className="h-4 w-4" />
                  Configure API
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      <Tabs defaultValue="chat">
        <TabsList>
          <TabsTrigger value="chat" className="flex items-center">
            <MessageSquare className="mr-2 h-4 w-4" />
            AI Chat
          </TabsTrigger>
          <TabsTrigger value="plan" className="flex items-center">
            <BookOpen className="mr-2 h-4 w-4" />
            Study Plan
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="mt-6">
          <Card className="h-[600px] flex flex-col">
            <CardHeader>
              <CardTitle>Chat with Your AI Study Assistant</CardTitle>
              <CardDescription>
                Ask questions, get study tips, or request a personalized study plan
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                {chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.role === "user"
                          ? "bg-next-purple text-white"
                          : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                ))}
                {isProcessing && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] rounded-lg p-3 bg-gray-100">
                      <div className="flex space-x-2">
                        <div
                          className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                          style={{ animationDelay: "0s" }}
                        ></div>
                        <div
                          className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                        <div
                          className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                          style={{ animationDelay: "0.4s" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {chatMessages.length < 3 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {quickPrompts.map((prompt, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setUserInput(prompt);
                      }}
                    >
                      {prompt}
                    </Button>
                  ))}
                </div>
              )}

              <div className="flex items-end gap-2">
                <Textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Ask anything about your studies..."
                  className="min-h-[60px] resize-none"
                  disabled={isProcessing}
                />
                <Button
                  className="mb-[1px]"
                  size="icon"
                  onClick={sendMessage}
                  disabled={!userInput.trim() || isProcessing}
                >
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plan" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Generate Study Plan</CardTitle>
              <CardDescription>
                Let AI create a personalized study plan based on your upcoming events and priorities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">This will include:</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li className="text-sm text-gray-600">
                    {events.length} upcoming events from your calendar
                  </li>
                  <li className="text-sm text-gray-600">
                    {studyTasks.length} study tasks from your priority list
                  </li>
                  <li className="text-sm text-gray-600">
                    Your study preferences and previous patterns
                  </li>
                </ul>
              </div>

              <Button
                className="w-full"
                onClick={handleGeneratePlan}
                disabled={isPlanGenerating || loading}
              >
                {isPlanGenerating ? (
                  <>
                    <span className="mr-2">Generating Plan...</span>
                    <div className="h-4 w-4 rounded-full border-2 border-white border-r-transparent animate-spin" />
                  </>
                ) : (
                  "Generate Study Plan"
                )}
              </Button>

              {studyPlan.structured && (
                <div className="mt-6 border rounded-lg p-4 bg-white">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Your Personalized Study Plan</h3>
                    <Button
                      onClick={handleAddToSchedule}
                      disabled={planAdded}
                      size="sm"
                      className="flex items-center"
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      {planAdded ? "Added to Schedule" : "Add to My Schedule"}
                    </Button>
                  </div>

                  {planAdded && (
                    <Alert className="mb-4 bg-green-50 border-green-200">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertTitle className="text-green-800">Study plan added to your schedule</AlertTitle>
                      <AlertDescription className="text-green-700">
                        Your study sessions and breaks have been added to your calendar.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-6">
                    {/* Overview Section */}
                    <div className="rounded-md border border-gray-200 p-4">
                      <h4 className="font-medium text-gray-700 mb-2">Overview</h4>
                      <p className="text-gray-600">{studyPlan.structured.overview}</p>
                    </div>

                    {/* Study Sessions Section */}
                    <div className="rounded-md border border-gray-200 p-4">
                      <h4 className="font-medium text-gray-700 mb-2">Study Sessions</h4>
                      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                        {studyPlan.structured.sessions.map((session, index) => (
                          <div
                            key={session.id || index}
                            className={`p-3 rounded-md border ${
                              session.isBreak
                                ? "bg-gray-50 border-gray-200"
                                : "bg-blue-50 border-blue-200"
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-medium">{session.title}</div>
                                {session.description && (
                                  <div className="text-sm mt-1 text-gray-600">{session.description}</div>
                                )}
                              </div>
                              <div className="text-sm text-gray-500 flex items-center whitespace-nowrap ml-4">
                                <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
                                {format(new Date(session.startTime), "MMM d, h:mm a")} -{" "}
                                {format(new Date(session.endTime), "h:mm a")}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Study Tips Section */}
                    {studyPlan.structured.tips.length > 0 && (
                      <div className="rounded-md border border-gray-200 p-4">
                        <h4 className="font-medium text-gray-700 mb-2">Study Tips</h4>
                        <ul className="list-disc pl-5 space-y-2">
                          {studyPlan.structured.tips.map((tip, index) => (
                            <li key={index} className="text-sm text-gray-600">
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Summary Section */}
                    {studyPlan.structured.summary && (
                      <div className="rounded-md border border-gray-200 p-4">
                        <h4 className="font-medium text-gray-700 mb-2">Summary</h4>
                        <p className="text-sm text-gray-600">{studyPlan.structured.summary}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {studyPlan.text && !studyPlan.structured && (
                <div className="mt-6 border rounded-lg p-4 bg-white">
                  <h3 className="text-lg font-semibold mb-4">Your Personalized Study Plan</h3>
                  <div className="prose max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: studyPlan.text.replace(/\n/g, "<br>") }} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PlanGeneration;
