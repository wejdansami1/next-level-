import { useEffect, useState } from "react";
import { useEvents, Event, StudyTask } from "@/contexts/EventContext";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  BookOpen, 
  FileText, 
  Calendar, 
  Users, 
  Coffee, 
  Clock, 
  CheckCircle2, 
  MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameDay, 
  addDays, 
  subDays,
  addWeeks,
  subWeeks,
  isWithinInterval,
  parseISO,
  addMinutes
} from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const Schedule = () => {
  const { events, studyTasks, updateStudyTask } = useEvents();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<"day" | "week">("week");
  const [selectedEvent, setSelectedEvent] = useState<Event | StudyTask | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [animateDirection, setAnimateDirection] = useState<"left" | "right" | null>(null);
  
  const today = new Date();
  
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
  
  const goToToday = () => {
    setAnimateDirection(null);
    setSelectedDate(new Date());
  };
  
  const goToPrevious = () => {
    setAnimateDirection("left");
    if (view === "day") {
      setSelectedDate(subDays(selectedDate, 1));
    } else {
      setSelectedDate(subWeeks(selectedDate, 1));
    }
  };
  
  const goToNext = () => {
    setAnimateDirection("right");
    if (view === "day") {
      setSelectedDate(addDays(selectedDate, 1));
    } else {
      setSelectedDate(addWeeks(selectedDate, 1));
    }
  };
  
  // Reset animation direction after animation completes
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimateDirection(null);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [animateDirection]);
  
  const isEventOnDay = (event: Event, day: Date) => {
    const eventDate = new Date(event.startDate);
    return isSameDay(eventDate, day);
  };
  
  const isTaskOnDay = (task: StudyTask, day: Date) => {
    const taskDate = new Date(task.scheduledStartTime);
    return isSameDay(taskDate, day);
  };
  
  const getEventsForDay = (day: Date) => {
    return events.filter(event => isEventOnDay(event, day))
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  };
  
  const getTasksForDay = (day: Date) => {
    return studyTasks
      .filter(task => {
        // First check if the task is scheduled for this day
        if (!isTaskOnDay(task, day)) return false;
        
        // Then check if the task is related to an event that has already passed
        if (task.relatedEventId) {
          const relatedEvent = events.find(event => event.id === task.relatedEventId);
          if (relatedEvent) {
            const eventDate = new Date(relatedEvent.startDate);
            // If the event has passed, don't show related tasks
            if (eventDate < new Date()) return false;
          }
        }
        
        return true;
      })
      .sort((a, b) => new Date(a.scheduledStartTime).getTime() - new Date(b.scheduledStartTime).getTime());
  };
  
  const handleMarkComplete = (e: React.MouseEvent, taskId: string, isCompleted: boolean) => {
    e.stopPropagation(); // Prevent opening the dialog
    updateStudyTask(taskId, { isCompleted });
  };
  
  const timeBlocks = view === "day" 
    ? Array.from({ length: 24 }, (_, i) => i) 
    : Array.from({ length: 24 }, (_, i) => i);
  
  const calculateEventPosition = (event: Event) => {
    const startTime = new Date(event.startDate);
    const hours = startTime.getHours() + startTime.getMinutes() / 60;
    const topPosition = (hours / 24) * 100;
    
    const heightPercentage = (event.duration / (24 * 60)) * 100;
    
    return {
      top: `${topPosition}%`,
      height: `${heightPercentage}%`,
    };
  };
  
  const calculateTaskPosition = (task: StudyTask) => {
    const startTime = new Date(task.scheduledStartTime);
    const endTime = new Date(task.scheduledEndTime);
    const startHours = startTime.getHours() + startTime.getMinutes() / 60;
    const endHours = endTime.getHours() + endTime.getMinutes() / 60;
    
    const topPosition = (startHours / 24) * 100;
    const heightPercentage = ((endHours - startHours) / 24) * 100;
    
    return {
      top: `${topPosition}%`,
      height: `${heightPercentage}%`,
    };
  };
  
  const showDetails = (item: Event | StudyTask) => {
    setSelectedEvent(item);
    setDialogOpen(true);
  };
  
  const isEvent = (item: Event | StudyTask): item is Event => {
    return 'startDate' in item;
  };
  
  const getFormattedTime = (dateStr: string) => {
    return format(new Date(dateStr), "h:mm a");
  };
  
  const getDuration = (item: Event | StudyTask) => {
    if (isEvent(item)) {
      return `${item.duration} minutes`;
    } else {
      const start = new Date(item.scheduledStartTime);
      const end = new Date(item.scheduledEndTime);
      const diffInMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
      return `${diffInMinutes} minutes`;
    }
  };

  const getCategoryIcon = (category: string, isCompleted: boolean = false) => {
    if (isCompleted) {
      return <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />;
    }
    
    switch(category) {
      case 'exam':
        return <FileText className="h-3 w-3 mr-1" />;
      case 'assignment':
        return <FileText className="h-3 w-3 mr-1" />;
      case 'study':
        return <BookOpen className="h-3 w-3 mr-1" />;
      case 'meeting':
        return <Users className="h-3 w-3 mr-1" />;
      case 'break':
        return <Coffee className="h-3 w-3 mr-1" />;
      default:
        return <Calendar className="h-3 w-3 mr-1" />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Schedule</h1>
          <p className="text-muted-foreground">Manage your events and study plan</p>
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline" size="icon" onClick={goToPrevious} 
            className="transition-transform hover:scale-105 active:scale-95">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={goToToday}
            className="transition-transform hover:scale-105 active:scale-95">Today</Button>
          <Button variant="outline" size="icon" onClick={goToNext}
            className="transition-transform hover:scale-105 active:scale-95">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="week" onValueChange={(value) => setView(value as "day" | "week")}>
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="day">Day</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
          </TabsList>
          
          <div className="text-lg font-semibold">
            {view === "day" 
              ? format(selectedDate, "MMMM d, yyyy") 
              : `${format(weekStart, "MMMM d")} - ${format(weekEnd, "MMMM d, yyyy")}`}
          </div>
        </div>
        
        <TabsContent value="day" className="mt-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center">
                <CalendarIcon className="mr-2 h-5 w-5" /> 
                {format(selectedDate, "EEEE, MMMM d")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`relative border rounded-lg min-h-[600px] bg-gray-50 transition-opacity duration-300 
                ${animateDirection === "left" ? "animate-slide-out-right" : 
                 animateDirection === "right" ? "animate-slide-in-right" : ""}`}>
                <div className="absolute left-0 top-0 w-16 h-full border-r">
                  {timeBlocks.map((hour) => (
                    <div 
                      key={hour} 
                      className="absolute text-xs text-gray-500 font-medium"
                      style={{ top: `${(hour / 24) * 100}%` }}
                    >
                      {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                    </div>
                  ))}
                </div>
                
                <div className="ml-16 relative h-full">
                  {timeBlocks.map((hour) => (
                    <div 
                      key={hour} 
                      className="absolute w-full border-t border-gray-200"
                      style={{ top: `${(hour / 24) * 100}%` }}
                    />
                  ))}
                  
                  {getEventsForDay(selectedDate).map((event) => {
                    const position = calculateEventPosition(event);
                    return (
                      <HoverCard key={event.id}>
                        <HoverCardTrigger asChild>
                          <div 
                            className={`absolute left-0 right-0 mx-2 p-2 rounded-md border event-${event.category} 
                              cursor-pointer shadow-sm hover:shadow-md transition-all duration-200 hover:translate-x-1`}
                            style={{ 
                              top: position.top, 
                              height: position.height,
                              minHeight: '24px'
                            }}
                            onClick={() => showDetails(event)}
                          >
                            <div className="text-sm font-medium truncate flex items-center">
                              {getCategoryIcon(event.category)}
                              {event.title}
                            </div>
                            <div className="text-xs flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {getFormattedTime(event.startDate)} ({event.duration} min)
                            </div>
                            {event.location && (
                              <div className="text-xs flex items-center mt-1">
                                <MapPin className="h-3 w-3 mr-1" />
                                {event.location}
                              </div>
                            )}
                          </div>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-80 p-2">
                          <div className="font-medium">{event.title}</div>
                          <div className="text-sm">{format(new Date(event.startDate), "EEEE, MMMM d")}</div>
                          <div className="text-sm">{getFormattedTime(event.startDate)} ({event.duration} min)</div>
                          {event.subject && <div className="text-sm mt-1">Subject: {event.subject}</div>}
                          {event.location && <div className="text-sm mt-1">Location: {event.location}</div>}
                          {event.description && (
                            <div className="text-sm mt-1 text-gray-600 overflow-hidden text-ellipsis">
                              {event.description.length > 100 
                                ? `${event.description.substring(0, 100)}...` 
                                : event.description}
                            </div>
                          )}
                        </HoverCardContent>
                      </HoverCard>
                    );
                  })}
                  
                  {getTasksForDay(selectedDate).map((task) => {
                    const position = calculateTaskPosition(task);
                    return (
                      <HoverCard key={task.id}>
                        <HoverCardTrigger asChild>
                          <div 
                            className={`absolute left-0 right-0 mx-2 p-2 rounded-md border 
                              ${task.category === 'study' ? 'event-study' : 
                                task.category === 'break' ? 'event-break' : 'event-custom'} 
                              ${task.isCompleted ? 'opacity-60 bg-opacity-50' : ''}
                              cursor-pointer shadow-sm hover:shadow-md transition-all duration-200 
                              hover:translate-x-1 group`}
                            style={{ 
                              top: position.top, 
                              height: position.height,
                              minHeight: '24px',
                              textDecoration: task.isCompleted ? 'line-through' : 'none'
                            }}
                            // onClick={() => showDetails(task)} // Removed to prevent dialog opening
                          >
                            <div className="flex justify-between items-center">
                              <div className="text-sm font-medium truncate flex items-center">
                                {getCategoryIcon(task.category, task.isCompleted)}
                                {task.title}
                              </div>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className={`h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity ${task.isCompleted ? 'text-green-500' : ''}`}
                                onClick={(e) => handleMarkComplete(e, task.id, !task.isCompleted)}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="text-xs flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {getFormattedTime(task.scheduledStartTime)} - {getFormattedTime(task.scheduledEndTime)}
                            </div>
                          </div>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-80 p-2">
                          <div className="font-medium flex items-center">
                            {task.isCompleted && <CheckCircle2 className="h-4 w-4 mr-1 text-green-500" />}
                            {task.title}
                          </div>
                          <div className="text-sm">{format(new Date(task.scheduledStartTime), "EEEE, MMMM d")}</div>
                          <div className="text-sm">
                            {getFormattedTime(task.scheduledStartTime)} - {getFormattedTime(task.scheduledEndTime)}
                          </div>
                          <div className="mt-2">
                            <Button 
                              size="sm" 
                              variant={task.isCompleted ? "outline" : "default"}
                              className="text-xs h-7 transition-all duration-200"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkComplete(e, task.id, !task.isCompleted);
                              }}
                            >
                              {task.isCompleted ? "Mark as Incomplete" : "Mark as Complete"}
                            </Button>
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                    );
                  })}
                  
                  {isSameDay(selectedDate, today) && (
                    <div 
                      className="absolute left-0 right-0 border-t-2 border-red-500 z-10"
                      style={{ 
                        top: `${((today.getHours() + (today.getMinutes() / 60)) / 24) * 100}%` 
                      }}
                    >
                      <div className="absolute -top-2 -left-1 w-2 h-2 rounded-full bg-red-500" />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="week" className="mt-6">
          <Card className="shadow-md">
            <CardContent className="pt-6">
              <div className={`grid grid-cols-7 gap-2 transition-opacity duration-300 
                ${animateDirection === "left" ? "animate-slide-out-right" : 
                 animateDirection === "right" ? "animate-slide-in-right" : ""}`}>
                {weekDays.map((day, index) => (
                  <div key={index} className="flex flex-col">
                    <div className={`text-center py-2 font-medium ${
                      isSameDay(day, today) ? 'bg-next-purple text-white rounded-t-md' : 
                      'bg-gray-100 text-gray-700 rounded-t-md'
                    }`}>
                      <div>{format(day, "EEE")}</div>
                      <div>{format(day, "d")}</div>
                    </div>
                    
                    <div 
                      className="border rounded-b-md bg-gray-50 flex-1 min-h-[600px] relative overflow-hidden
                        hover:bg-gray-100 transition-colors duration-200 cursor-pointer"
                      onClick={() => {
                        setSelectedDate(day);
                        setView("day");
                      }}
                    >
                      {getEventsForDay(day).map((event, i) => {
                        const position = calculateEventPosition(event);
                        return (
                          <HoverCard key={event.id}>
                            <HoverCardTrigger asChild>
                              <div 
                                className={`absolute left-0 right-0 mx-1 p-1 text-xs rounded-md border 
                                  event-${event.category} cursor-pointer shadow-sm hover:shadow-md 
                                  transition-all duration-200 hover:scale-[1.02]`}
                                style={{ 
                                  top: position.top, 
                                  height: position.height,
                                  minHeight: '22px',
                                  zIndex: 10 + i
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  showDetails(event);
                                }}
                              >
                                <div className="font-medium truncate flex items-center">
                                  {getCategoryIcon(event.category)}
                                  {event.title}
                                </div>
                                <div className="truncate flex items-center">
                                  <Clock className="h-2 w-2 mr-1" />
                                  {getFormattedTime(event.startDate)}
                                </div>
                              </div>
                            </HoverCardTrigger>
                            <HoverCardContent className="w-64 p-2">
                              <div className="font-medium">{event.title}</div>
                              <div className="text-sm">{format(new Date(event.startDate), "EEEE, MMMM d")}</div>
                              <div className="text-sm">{getFormattedTime(event.startDate)}</div>
                              {event.subject && <div className="text-xs mt-1">Subject: {event.subject}</div>}
                              {event.location && <div className="text-xs mt-1">Location: {event.location}</div>}
                            </HoverCardContent>
                          </HoverCard>
                        );
                      })}
                      
                      {getTasksForDay(day).map((task, i) => {
                        const position = calculateTaskPosition(task);
                        return (
                          <HoverCard key={task.id}>
                            <HoverCardTrigger asChild>
                              <div 
                                className={`absolute left-0 right-0 mx-1 p-1 text-xs rounded-md border 
                                  ${task.category === 'study' ? 'event-study' : 
                                    task.category === 'break' ? 'event-break' : 'event-custom'} 
                                  ${task.isCompleted ? 'opacity-60 bg-opacity-50' : ''}
                                  cursor-pointer shadow-sm hover:shadow-md transition-all duration-200 
                                  hover:scale-[1.02] group`}
                                style={{ 
                                  top: position.top, 
                                  height: position.height,
                                  minHeight: '22px',
                                  zIndex: 20 + i,
                                  textDecoration: task.isCompleted ? 'line-through' : 'none'
                                }}
                                // onClick={(e) => { // Removed to prevent dialog opening
                                //   e.stopPropagation();
                                //   showDetails(task);
                                // }}
                              >
                                <div className="flex justify-between items-center">
                                  <div className="font-medium truncate flex items-center">
                                    {getCategoryIcon(task.category, task.isCompleted)}
                                    {task.title}
                                  </div>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className={`h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity ${task.isCompleted ? 'text-green-500' : ''}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMarkComplete(e, task.id, !task.isCompleted);
                                    }}
                                  >
                                    <CheckCircle2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </HoverCardTrigger>
                            <HoverCardContent className="w-64 p-2">
                              <div className="font-medium flex items-center">
                                {task.isCompleted && <CheckCircle2 className="h-4 w-4 mr-1 text-green-500" />}
                                {task.title}
                              </div>
                              <div className="text-sm">{format(new Date(task.scheduledStartTime), "EEEE, MMMM d")}</div>
                              <div className="text-xs">
                                {getFormattedTime(task.scheduledStartTime)} - {getFormattedTime(task.scheduledEndTime)}
                              </div>
                              <div className="mt-2">
                                <Button 
                                  size="sm" 
                                  variant={task.isCompleted ? "outline" : "default"}
                                  className="text-xs h-6 transition-all duration-200"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMarkComplete(e, task.id, !task.isCompleted);
                                  }}
                                >
                                  {task.isCompleted ? "Mark Incomplete" : "Mark Complete"}
                                </Button>
                              </div>
                            </HoverCardContent>
                          </HoverCard>
                        );
                      })}
                      
                      {isSameDay(day, today) && (
                        <div 
                          className="absolute left-0 right-0 border-t border-red-500 z-30"
                          style={{ 
                            top: `${((today.getHours() + (today.getMinutes() / 60)) / 24) * 100}%` 
                          }}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedEvent ? selectedEvent.title : ""}
            </DialogTitle>
            <DialogDescription>
              {selectedEvent && (
                isEvent(selectedEvent)
                  ? `${format(new Date(selectedEvent.startDate), "EEEE, MMMM d, yyyy")} at ${getFormattedTime(selectedEvent.startDate)}`
                  : `${format(new Date(selectedEvent.scheduledStartTime), "EEEE, MMMM d, yyyy")} from ${getFormattedTime(selectedEvent.scheduledStartTime)} to ${getFormattedTime(selectedEvent.scheduledEndTime)}`
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedEvent && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Category</p>
                    <p className="text-sm flex items-center">
                      {getCategoryIcon(selectedEvent.category, !isEvent(selectedEvent) && selectedEvent.isCompleted)}
                      {selectedEvent.category}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Duration</p>
                    <p className="text-sm flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {getDuration(selectedEvent)}
                    </p>
                  </div>
                </div>
                
                {isEvent(selectedEvent) && selectedEvent.subject && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Subject</p>
                    <p className="text-sm">{selectedEvent.subject}</p>
                  </div>
                )}
                
                {isEvent(selectedEvent) && selectedEvent.location && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Location</p>
                    <p className="text-sm flex items-center">
                      <MapPin className="h-3 w-3 mr-1" />
                      {selectedEvent.location}
                    </p>
                  </div>
                )}
                
                {isEvent(selectedEvent) && selectedEvent.description && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Description</p>
                    <p className="text-sm">{selectedEvent.description}</p>
                  </div>
                )}
                
                {!isEvent(selectedEvent) && (
                  <div className="flex justify-end">
                    <Button
                      variant={selectedEvent.isCompleted ? "outline" : "default"}
                      onClick={() => handleMarkComplete(new MouseEvent('click') as any, selectedEvent.id, !selectedEvent.isCompleted)}
                      className="transition-all duration-200 hover:scale-105 active:scale-95"
                    >
                      {selectedEvent.isCompleted ? "Mark as Incomplete" : "Mark as Complete"}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Schedule;
