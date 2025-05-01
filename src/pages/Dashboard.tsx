
import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useEvents } from "@/contexts/EventContext";
import { Calendar, BookOpen, FileText, Users, Coffee, Star, Sparkles, Award, Brain } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { user } = useAuth();
  const { events, studyTasks, loading, generateStudyPlan } = useEvents();
  const navigate = useNavigate();

  useEffect(() => {
    if (events.length > 0 && studyTasks.length === 0 && !loading) {
      generateStudyPlan();
    }
  }, [events, studyTasks, loading, generateStudyPlan]);

  const today = new Date();
  const formattedDate = format(today, "EEEE, MMMM do, yyyy");
  
  const todayEvents = events.filter(event => {
    const eventDate = new Date(event.startDate);
    return eventDate.toDateString() === today.toDateString();
  });
  
  const upcomingEvents = events.filter(event => {
    const eventDate = new Date(event.startDate);
    const sevenDaysLater = new Date(today);
    sevenDaysLater.setDate(today.getDate() + 7);
    
    return eventDate > today && eventDate <= sevenDaysLater;
  }).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  
  const todayTasks = studyTasks.filter(task => {
    const taskDate = new Date(task.scheduledStartTime);
    return taskDate.toDateString() === today.toDateString();
  }).sort((a, b) => 
    new Date(a.scheduledStartTime).getTime() - new Date(b.scheduledStartTime).getTime()
  );

  const getCategoryIcon = (category) => {
    switch(category) {
      case 'exam':
        return <FileText className="h-5 w-5 text-lbp-felt-red" />;
      case 'assignment':
        return <FileText className="h-5 w-5 text-lbp-felt-blue" />;
      case 'study':
        return <BookOpen className="h-5 w-5 text-lbp-felt-green" />;
      case 'meeting':
        return <Users className="h-5 w-5 text-lbp-felt-blue" />;
      case 'break':
        return <Coffee className="h-5 w-5 text-lbp-felt-yellow" />;
      default:
        return <Calendar className="h-5 w-5 text-next-purple" />;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in font-body">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-heading tracking-wide">My Dashboard</h1>
          <p className="text-muted-foreground font-body">{formattedDate}</p>
        </div>
        <Button onClick={() => navigate("/events")} className="lbp-button bg-lbp-felt-green text-white">
          <Star className="mr-1 h-4 w-4" />
          Create New Event
        </Button>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lbp-card animate-lbp-pop">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b-2 border-dashed border-lbp-stitch">
            <div className="space-y-1">
              <CardTitle className="font-heading text-xl">Today's Adventures</CardTitle>
              <CardDescription className="font-body">
                You have {todayEvents.length} adventure{todayEvents.length !== 1 ? 's' : ''} planned today
              </CardDescription>
            </div>
            <Calendar className="h-6 w-6 text-next-purple animate-lbp-float" />
          </CardHeader>
          <CardContent className="pt-4">
            {todayEvents.length > 0 ? (
              <div className="space-y-3">
                {todayEvents.map((event) => (
                  <div 
                    key={event.id} 
                    className={`flex items-center p-3 rounded-xl event-${event.category} 
                      hover:translate-x-1 hover:shadow-lbp-hover transition-all duration-200 
                      lbp-popper`}
                  >
                    <div className="flex gap-3 items-center w-full">
                      <div className="bg-white bg-opacity-20 p-1.5 rounded-lg shadow-sm">
                        {getCategoryIcon(event.category)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{event.title}</p>
                        <p className="text-sm text-gray-100">
                          {format(new Date(event.startDate), "h:mm a")} • {event.duration} min
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-muted-foreground pattern-stitches">
                <p className="mb-2 font-heading">No adventures scheduled for today</p>
                <Button 
                  variant="outline" 
                  className="mt-2 lbp-button bg-lbp-felt-blue text-white"
                  onClick={() => navigate("/events")}
                >
                  <Star className="mr-1 h-4 w-4" />
                  Start an Adventure
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="lbp-card animate-lbp-pop" style={{animationDelay: "0.1s"}}>
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b-2 border-dashed border-lbp-stitch">
            <div className="space-y-1">
              <CardTitle className="font-heading text-xl">Today's Study Plan</CardTitle>
              <CardDescription className="font-body">
                {todayTasks.length > 0 
                  ? `${todayTasks.filter(t => t.isCompleted).length}/${todayTasks.length} quests completed` 
                  : 'No study quests for today'}
              </CardDescription>
            </div>
            <Brain className="h-6 w-6 text-next-purple animate-lbp-float" />
          </CardHeader>
          <CardContent className="pt-4">
            {todayTasks.length > 0 ? (
              <div className="space-y-3">
                {todayTasks.map((task) => (
                  <div 
                    key={task.id} 
                    className={`flex items-center p-3 rounded-xl 
                      ${task.isCompleted 
                        ? 'bg-gray-100 border-2 border-dashed border-gray-300 text-gray-500' 
                        : 'event-study hover:translate-x-1 hover:shadow-lbp-hover transition-all duration-200 lbp-popper'}
                      `}
                  >
                    <div className="flex gap-3 items-center w-full">
                      <div className={`${task.isCompleted ? 'bg-gray-200' : 'bg-white bg-opacity-20'} p-1.5 rounded-lg shadow-sm`}>
                        {task.isCompleted ? 
                          <Award className="h-5 w-5 text-lbp-felt-green" /> : 
                          <BookOpen className="h-5 w-5 text-white" />
                        }
                      </div>
                      <div className="flex-1">
                        <p className={`font-medium ${task.isCompleted ? 'line-through' : ''}`}>
                          {task.title}
                        </p>
                        <p className={`text-sm ${task.isCompleted ? 'text-gray-400' : 'text-gray-100'}`}>
                          {format(new Date(task.scheduledStartTime), "h:mm a")} - {format(new Date(task.scheduledEndTime), "h:mm a")}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-muted-foreground pattern-stitches">
                <p className="mb-2 font-heading">No study quests generated yet</p>
                <Button 
                  variant="outline" 
                  className="mt-2 lbp-button bg-lbp-felt-green text-white"
                  onClick={() => navigate("/plan")}
                >
                  <Sparkles className="mr-1 h-4 w-4" />
                  Generate Study Plan
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="lbp-card animate-lbp-pop" style={{animationDelay: "0.2s"}}>
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b-2 border-dashed border-lbp-stitch">
            <div className="space-y-1">
              <CardTitle className="font-heading text-xl">Upcoming Quests</CardTitle>
              <CardDescription className="font-body">Adventures in the next 7 days</CardDescription>
            </div>
            <Calendar className="h-6 w-6 text-next-purple animate-lbp-float" />
          </CardHeader>
          <CardContent className="pt-4">
            {upcomingEvents.length > 0 ? (
              <div className="space-y-3">
                {upcomingEvents.slice(0, 5).map((event) => (
                  <div 
                    key={event.id} 
                    className={`flex items-center p-3 rounded-xl event-${event.category}
                      hover:translate-x-1 hover:shadow-lbp-hover transition-all duration-200 
                      lbp-popper`}
                  >
                    <div className="flex gap-3 items-center w-full">
                      <div className="bg-white bg-opacity-20 p-1.5 rounded-lg shadow-sm">
                        {getCategoryIcon(event.category)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{event.title}</p>
                        <p className="text-sm text-gray-100">
                          {format(new Date(event.startDate), "EEE, MMM d")} at {format(new Date(event.startDate), "h:mm a")}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {upcomingEvents.length > 5 && (
                  <Button 
                    variant="ghost" 
                    className="w-full text-next-purple hover:bg-purple-100 transition-all"
                    onClick={() => navigate("/schedule")}
                  >
                    View all adventures
                  </Button>
                )}
              </div>
            ) : (
              <div className="py-6 text-center text-muted-foreground pattern-stitches">
                <p className="mb-2 font-heading">No upcoming adventures</p>
                <Button 
                  variant="outline" 
                  className="mt-2 lbp-button bg-lbp-felt-blue text-white"
                  onClick={() => navigate("/events")}
                >
                  <Star className="mr-1 h-4 w-4" />
                  Create Adventure
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="lbp-card animate-lbp-pop" style={{animationDelay: "0.3s"}}>
          <CardHeader className="border-b-2 border-dashed border-lbp-stitch">
            <CardTitle className="font-heading text-xl">Your Progress</CardTitle>
            <CardDescription>Track your study achievements</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium font-heading">Level {user?.level || 1}</span>
                  <span className="text-sm font-medium">{user?.xp || 0}/100 XP</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 lbp-stitched p-0 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-next-purple to-next-purple/80 h-3 rounded-full transition-all duration-1000" 
                    style={{ width: `${user?.xp || 0}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-lbp-paper p-4 rounded-xl text-center shadow-lbp-button border-2 border-dashed border-lbp-stitch
                  hover:shadow-lbp-hover transition-all duration-200 lbp-popper">
                  <p className="text-2xl font-bold text-next-purple font-heading">
                    {studyTasks.filter(t => t.isCompleted).length}
                  </p>
                  <p className="text-sm text-gray-500">Quests Completed</p>
                </div>
                <div className="bg-lbp-paper p-4 rounded-xl text-center shadow-lbp-button border-2 border-dashed border-lbp-stitch
                  hover:shadow-lbp-hover transition-all duration-200 lbp-popper">
                  <p className="text-2xl font-bold text-next-purple font-heading">
                    {events.length}
                  </p>
                  <p className="text-sm text-gray-500">Total Adventures</p>
                </div>
              </div>

              <div className="bg-lbp-paper p-4 rounded-xl text-center shadow-lbp-button border-2 border-dashed border-lbp-stitch">
                <div className="flex justify-center space-x-2 mb-2">
                  {Array.from({ length: Math.min(5, Math.ceil((user?.level || 1) / 2)) }).map((_, i) => (
                    <Star key={i} className={`h-5 w-5 ${i < (user?.level || 1) % 5 || i === 0 ? 'text-lbp-felt-yellow fill-lbp-felt-yellow' : 'text-gray-300'}`} />
                  ))}
                </div>
                <p className="text-sm text-gray-500 font-body">Keep studying to earn more stars!</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="lbp-card animate-lbp-pop" style={{animationDelay: "0.4s"}}>
          <CardHeader className="border-b-2 border-dashed border-lbp-stitch">
            <CardTitle className="font-heading text-xl">AI Study Companion</CardTitle>
            <CardDescription>Your friendly study helper</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <p className="text-sm text-gray-600 font-body">
              Need help with your studies? Your AI Study Companion can provide tips, break down complex topics, or help you create a focused study plan.
            </p>
            <div className="bg-lbp-paper p-4 rounded-xl border-2 border-dashed border-lbp-stitch">
              <p className="text-sm font-medium mb-2 font-heading">Try asking:</p>
              <ul className="space-y-2 text-sm text-gray-600 font-body">
                <li className="flex items-center cursor-pointer transition-all hover:text-next-purple">
                  <Sparkles className="h-4 w-4 mr-2 text-lbp-felt-yellow" />
                  "How should I prepare for my upcoming math exam?"
                </li>
                <li className="flex items-center cursor-pointer transition-all hover:text-next-purple">
                  <Sparkles className="h-4 w-4 mr-2 text-lbp-felt-blue" />
                  "Break down my history essay into manageable steps"
                </li>
                <li className="flex items-center cursor-pointer transition-all hover:text-next-purple">
                  <Sparkles className="h-4 w-4 mr-2 text-lbp-felt-green" />
                  "Give me study tips for learning a new language"
                </li>
              </ul>
            </div>
            <Button className="w-full lbp-button bg-next-purple text-white" onClick={() => navigate("/plan")}>
              <Brain className="mr-2 h-4 w-4" /> 
              Talk to AI Companion
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
