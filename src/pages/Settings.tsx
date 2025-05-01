import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useLBPNotification } from "@/hooks/use-lbp-notification";
import { testGeminiApi, verifyApiKeyStatus } from "@/utils/geminiApi";
import { runGeminiDiagnostics } from "@/utils/geminiDiagnostics";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, Info, Loader2 } from "lucide-react";

const Settings = () => {
  const { user, logout } = useAuth();
  const notification = useLBPNotification();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [studyReminders, setStudyReminders] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [autoSchedulePriorities, setAutoSchedulePriorities] = useState(true);
  const [showCompletedTasks, setShowCompletedTasks] = useState(true);
  
  // Gemini API key state
  const [geminiApiKey, setGeminiApiKey] = useState(() => 
    localStorage.getItem('gemini_api_key') || '');
  const [apiKeyStatus, setApiKeyStatus] = useState<{
    isValid: boolean;
    message: string;
    testing: boolean;
  }>({
    isValid: false,
    message: '',
    testing: false
  });

  // Default study preferences
  const [studySessionLength, setStudySessionLength] = useState(45);
  const [breakLength, setBreakLength] = useState(10);
  const [studyDays, setStudyDays] = useState(["Mon", "Tue", "Wed", "Thu", "Fri"]);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would call an API to update the user's profile
    notification.success("Profile Updated", "Your profile information has been saved successfully");
  };

  const handlePreferencesUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    // This would save the user's study preferences
    notification.success("Study Preferences Saved", "Your study preferences have been updated");
  };

  const handleSettingsSave = () => {
    // This would save all the user's settings
    notification.success("Settings Updated", "Your settings have been saved successfully");
  };

  const handleClearData = () => {
    if (confirm("Are you sure you want to clear all your data? This cannot be undone.")) {
      // Clear local storage data
      localStorage.removeItem(`events-${user?.id}`);
      localStorage.removeItem(`tasks-${user?.id}`);
      notification.info("Data Cleared", "All your data has been cleared successfully");
    }
  };
  
  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would call an API to change the user's password
    notification.success("Password Changed", "Your password has been updated successfully");
  };

  const toggleStudyDay = (day: string) => {
    if (studyDays.includes(day)) {
      setStudyDays(studyDays.filter((d) => d !== day));
    } else {
      setStudyDays([...studyDays, day]);
    }
  };

  const handleSaveApiKey = async () => {
    if (!geminiApiKey.trim()) {
      notification.error("API Key Required", "Please enter a valid Gemini API key");
      return;
    }
    
    setApiKeyStatus(prev => ({ ...prev, testing: true }));
    
    try {
      // Save the API key to localStorage
      localStorage.setItem('gemini_api_key', geminiApiKey);
      
      // Optionally store the key in window global for immediate use
      if (typeof window !== 'undefined') {
        window.GEMINI_API_KEY = geminiApiKey;
      }
      
      // Test the API key connection
      const result = await testGeminiApi();
      
      if (result.success) {
        setApiKeyStatus({
          isValid: true,
          message: result.message,
          testing: false
        });
        notification.success("API Key Saved", "Your Gemini API key has been saved and verified");
      } else {
        setApiKeyStatus({
          isValid: false,
          message: result.message,
          testing: false
        });
        notification.warning("API Key Issue", "Your key was saved but may have connectivity issues");
      }
    } catch (error) {
      let errorMessage = "An unknown error occurred";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setApiKeyStatus({
        isValid: false,
        message: errorMessage,
        testing: false
      });
      
      notification.error(
        "API Connection Error", 
        "There was a problem connecting to the Gemini API"
      );
    }
  };
  
  const handleRunDiagnostics = async () => {
    notification.info("Running Diagnostics", "Checking Gemini API connectivity...");
    setApiKeyStatus(prev => ({ ...prev, testing: true }));
    
    try {
      const diagnostics = await runGeminiDiagnostics();
      
      setApiKeyStatus({
        isValid: diagnostics.overallStatus === 'success',
        message: `Diagnostics: ${diagnostics.results.filter(r => r.passed).length}/${diagnostics.results.length} tests passed`,
        testing: false
      });
      
      if (diagnostics.overallStatus === 'success') {
        notification.success("Diagnostics Passed", "All Gemini API connectivity tests passed successfully");
      } else if (diagnostics.overallStatus === 'partial') {
        notification.warning(
          "Partial Success", 
          "Some API tests passed but there may be connectivity issues"
        );
      } else {
        notification.error(
          "Connection Failed", 
          diagnostics.recommendations[0] || "Check your API key and internet connection"
        );
      }
    } catch (error) {
      setApiKeyStatus({
        isValid: false,
        message: "Error running diagnostics",
        testing: false
      });
      
      notification.error(
        "Diagnostic Error", 
        "There was a problem running the connectivity tests"
      );
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>
      
      <Tabs defaultValue="profile">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="priorities">Priorities</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="ai-settings">AI Settings</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal information
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleProfileUpdate}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input 
                    id="name" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit">Save Changes</Button>
              </CardFooter>
            </form>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Study Preferences</CardTitle>
              <CardDescription>
                Customize your study experience
              </CardDescription>
            </CardHeader>
            <form onSubmit={handlePreferencesUpdate}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="studySessionLength">Default Study Session Length (minutes)</Label>
                  <Input 
                    id="studySessionLength" 
                    type="number"
                    min="15"
                    max="120"
                    value={studySessionLength}
                    onChange={(e) => setStudySessionLength(parseInt(e.target.value) || 45)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="breakLength">Default Break Length (minutes)</Label>
                  <Input 
                    id="breakLength" 
                    type="number"
                    min="5"
                    max="30"
                    value={breakLength}
                    onChange={(e) => setBreakLength(parseInt(e.target.value) || 10)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Study Days</Label>
                  <div className="flex flex-wrap gap-2">
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                      <Button 
                        key={day} 
                        variant={studyDays.includes(day) ? "default" : "outline"} 
                        className={studyDays.includes(day) ? "bg-primary" : "bg-gray-100"}
                        type="button"
                        onClick={() => toggleStudyDay(day)}
                      >
                        {day}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Productive Hours</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startTime" className="text-sm text-gray-500">Start</Label>
                      <Input 
                        id="startTime" 
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="endTime" className="text-sm text-gray-500">End</Label>
                      <Input 
                        id="endTime" 
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit">Save Preferences</Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
        
        <TabsContent value="priorities" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Priority List Settings</CardTitle>
              <CardDescription>
                Configure how your priority list and tasks work
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Task Management</h3>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="autoSchedulePriorities">Auto-Schedule Priorities</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically include priority tasks in AI-generated schedules
                    </p>
                  </div>
                  <Switch 
                    id="autoSchedulePriorities" 
                    checked={autoSchedulePriorities}
                    onCheckedChange={setAutoSchedulePriorities}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="showCompletedTasks">Show Completed Tasks</Label>
                    <p className="text-sm text-muted-foreground">
                      Display completed tasks in your priority list
                    </p>
                  </div>
                  <Switch 
                    id="showCompletedTasks" 
                    checked={showCompletedTasks}
                    onCheckedChange={setShowCompletedTasks}
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Default Task Settings</h3>
                <Separator />
                <div className="space-y-2">
                  <Label htmlFor="defaultTaskDuration">Default Task Duration (minutes)</Label>
                  <Input 
                    id="defaultTaskDuration" 
                    type="number"
                    min="5"
                    max="240"
                    defaultValue="45"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defaultSubject">Default Subject</Label>
                  <Input 
                    id="defaultSubject" 
                    placeholder="General"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSettingsSave}>Save Settings</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="preferences" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>
                Customize your application settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Notifications</h3>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="emailNotifications">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive email notifications about your upcoming events
                    </p>
                  </div>
                  <Switch 
                    id="emailNotifications" 
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="studyReminders">Study Reminders</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive reminders for scheduled study sessions
                    </p>
                  </div>
                  <Switch 
                    id="studyReminders" 
                    checked={studyReminders}
                    onCheckedChange={setStudyReminders}
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Appearance</h3>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="darkMode">Dark Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable dark mode for the application
                    </p>
                  </div>
                  <Switch 
                    id="darkMode" 
                    checked={darkMode}
                    onCheckedChange={setDarkMode}
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">AI Features</h3>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="aiSuggestions">AI Suggestions</Label>
                    <p className="text-sm text-muted-foreground">
                      Get AI-powered suggestions for your study plan
                    </p>
                  </div>
                  <Switch id="aiSuggestions" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="aiChat">AI Chat History</Label>
                    <p className="text-sm text-muted-foreground">
                      Store your chat history with the AI assistant
                    </p>
                  </div>
                  <Switch id="aiChat" defaultChecked />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSettingsSave}>Save Preferences</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="ai-settings" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gemini API Configuration</CardTitle>
              <CardDescription>
                Configure your Google Gemini API key for AI chat and study plan generation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="geminiApiKey">Gemini API Key</Label>
                <div className="flex space-x-2">
                  <Input 
                    id="geminiApiKey" 
                    value={geminiApiKey}
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                    type="password"
                    placeholder="Enter your Gemini API key"
                  />
                  <Button 
                    onClick={handleSaveApiKey}
                    disabled={apiKeyStatus.testing}
                  >
                    {apiKeyStatus.testing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : "Save Key"}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Get your API key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary underline">Google AI Studio</a>
                </p>
              </div>
              
              {apiKeyStatus.message && (
                <Alert variant={apiKeyStatus.isValid ? "default" : "destructive"}>
                  {apiKeyStatus.isValid ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <AlertTitle>
                    {apiKeyStatus.isValid ? "API Connected" : "Connection Issue"}
                  </AlertTitle>
                  <AlertDescription>
                    {apiKeyStatus.message}
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2 pt-4">
                <h3 className="text-lg font-medium">API Connectivity</h3>
                <p className="text-sm text-muted-foreground">
                  Test your connection to the Gemini API
                </p>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={handleRunDiagnostics}
                    disabled={apiKeyStatus.testing}
                  >
                    {apiKeyStatus.testing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Running...
                      </>
                    ) : "Run Diagnostics"}
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2 pt-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>About API Keys</AlertTitle>
                  <AlertDescription>
                    <p className="mb-2">Your API key is stored locally on your device and is never sent to our servers.</p>
                    <ul className="list-disc pl-4 space-y-1">
                      <li>Keep your API key secure and don't share it</li>
                      <li>Google Gemini API offers a free tier with limited usage</li>
                      <li>You may need to enable billing for extended usage</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>AI Feature Settings</CardTitle>
              <CardDescription>
                Configure how AI features work in the application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Study Plan Generation</h3>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="aiIncludeEvents">Include Calendar Events</Label>
                    <p className="text-sm text-muted-foreground">
                      Incorporate your calendar events when generating study plans
                    </p>
                  </div>
                  <Switch id="aiIncludeEvents" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="aiIncludePriorities">Include Priorities</Label>
                    <p className="text-sm text-muted-foreground">
                      Include your priority list tasks when generating study plans
                    </p>
                  </div>
                  <Switch id="aiIncludePriorities" defaultChecked />
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">AI Chat</h3>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="aiChatHistory">Save Chat History</Label>
                    <p className="text-sm text-muted-foreground">
                      Save your conversations with the AI assistant
                    </p>
                  </div>
                  <Switch id="aiChatHistory" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="aiContextAwareness">Context-Aware Responses</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow AI to access your schedule and priorities for more relevant answers
                    </p>
                  </div>
                  <Switch id="aiContextAwareness" defaultChecked />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="account" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Update your account password
              </CardDescription>
            </CardHeader>
            <form onSubmit={handlePasswordChange}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input id="currentPassword" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input id="newPassword" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input id="confirmPassword" type="password" />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit">Change Password</Button>
              </CardFooter>
            </form>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>
                Manage your account data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium">Export Data</h3>
                <p className="text-sm text-muted-foreground">
                  Download a copy of all your data from NextLevel
                </p>
                <Button variant="outline">Export Data</Button>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <h3 className="font-medium">Clear Data</h3>
                <p className="text-sm text-muted-foreground">
                  Remove all your events, study plans, and chat history
                </p>
                <Button 
                  variant="destructive"
                  onClick={handleClearData}
                >
                  Clear All Data
                </Button>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <h3 className="font-medium">Account Actions</h3>
                <p className="text-sm text-muted-foreground">
                  Log out or deactivate your account
                </p>
                <div className="flex flex-col gap-2">
                  <Button 
                    variant="outline"
                    onClick={logout}
                  >
                    Log Out
                  </Button>
                  <Button variant="destructive">Deactivate Account</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
