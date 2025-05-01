import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { useLBPNotification } from '@/hooks/use-lbp-notification';

// Event types and interfaces
export type EventCategory = 'exam' | 'assignment' | 'study' | 'break' | 'meeting' | 'personal' | 'custom';
export type PriorityLevel = 'High' | 'Medium' | 'Low';

export interface Event {
  id: string;
  title: string;
  category: EventCategory;
  startDate: string;
  duration: number;
  subject?: string;
  description?: string;
  location?: string;
  deadline?: string;
  resourceLink?: string;
  priority?: PriorityLevel;
  isStudyPlan?: boolean;
}

export interface StudyTask {
  id: string;
  title: string;
  category: 'study' | 'break' | 'personal';
  relatedEventId?: string;
  relatedPriorityTaskId?: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  isCompleted: boolean;
  priority?: number;
  dueDate?: string;
  subject?: string;
  estimatedDuration?: number;  // Changed from estimatedDurationMinutes
  description?: string;
  isBreak?: boolean;
}

export interface PriorityTask {
  id: string;
  title: string;
  description?: string;
  subject?: string;
  estimatedDurationMinutes: number;
  relatedEventId?: string;
  isCompleted: boolean;
  order: number;
  priority?: number;
  dueDate?: string;
}

// Interface for AI-generated study session events
export interface StudySessionEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  description: string;
  category: string;
  subject?: string;
  duration?: number;
  isBreak: boolean;
  isCompleted?: boolean;
}

// Interface for schedule events needed by Gemini API
export interface ScheduleEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  type?: string;
  priority?: number;
  description?: string;
  location?: string;
}

interface EventContextType {
  events: Event[];
  studyTasks: StudyTask[];
  priorityTasks: PriorityTask[];
  loading: boolean;
  addEvent: (event: Omit<Event, 'id'>) => void;
  updateEvent: (id: string, updates: Partial<Event>) => void;
  deleteEvent: (id: string) => void;
  addStudyTask: (task: Omit<StudyTask, 'id'>) => void;
  updateStudyTask: (id: string, updates: Partial<StudyTask>) => void;
  deleteStudyTask: (id: string) => void;
  generateStudyPlan: () => void;
  addPriorityTask: (task: Omit<PriorityTask, 'id' | 'order'>) => void;
  updatePriorityTask: (id: string, updates: Partial<PriorityTask>) => void;
  deletePriorityTask: (id: string) => void;
  reorderPriorityTasks: (sourceIndex: number, destinationIndex: number) => void;
  addStudyPlan: (session: StudySessionEvent) => void;
  clearStudyPlan: () => void;
}

export const EventContext = createContext<EventContextType>({
  events: [],
  studyTasks: [],
  priorityTasks: [],
  loading: false,
  addEvent: () => {},
  updateEvent: () => {},
  deleteEvent: () => {},
  addStudyTask: () => {},
  updateStudyTask: () => {},
  deleteStudyTask: () => {},
  generateStudyPlan: () => {},
  addPriorityTask: () => {},
  updatePriorityTask: () => {},
  deletePriorityTask: () => {},
  reorderPriorityTasks: () => {},
  addStudyPlan: () => {},
  clearStudyPlan: () => {},
});

// Sample data for development - will be replaced with real data from backend
const initialEvents: Event[] = [
  {
    id: '1',
    title: 'Math Midterm',
    category: 'exam',
    startDate: '2025-04-15T10:00:00Z',
    duration: 90,
    subject: 'Calculus II',
    priority: 'High',
    location: 'Room 301'
  },
  {
    id: '2',
    title: 'Physics Lab',
    category: 'meeting',
    startDate: '2025-04-09T14:00:00Z',
    duration: 120,
    subject: 'Physics',
    location: 'Science Building B12'
  },
  {
    id: '3',
    title: 'History Essay Due',
    category: 'assignment',
    startDate: '2025-04-20T23:59:00Z',
    duration: 0,
    subject: 'World History',
    description: 'Analysis of the Industrial Revolution impact on social structures'
  }
];

// Sample study tasks
const initialStudyTasks: StudyTask[] = [
  {
    id: 'st1',
    title: 'Review Calculus Lecture Notes',
    category: 'study',
    relatedEventId: '1',
    scheduledStartTime: '2025-04-12T14:00:00Z',
    scheduledEndTime: '2025-04-12T15:30:00Z',
    isCompleted: false
  },
  {
    id: 'st2',
    title: 'Practice Physics Problems',
    category: 'study',
    relatedEventId: '2',
    scheduledStartTime: '2025-04-08T10:00:00Z',
    scheduledEndTime: '2025-04-08T11:30:00Z',
    isCompleted: true
  },
  {
    id: 'st3',
    title: 'Break',
    category: 'break',
    scheduledStartTime: '2025-04-12T15:30:00Z',
    scheduledEndTime: '2025-04-12T16:00:00Z',
    isCompleted: false
  }
];

// Sample priority tasks
const initialPriorityTasks: PriorityTask[] = [
  {
    id: 'pt1',
    title: 'Complete calculus problem set',
    subject: 'Calculus II',
    relatedEventId: '1',
    estimatedDurationMinutes: 120,
    isCompleted: false,
    order: 0
  },
  {
    id: 'pt2',
    title: 'Read history textbook chapter 7',
    subject: 'World History',
    relatedEventId: '3',
    estimatedDurationMinutes: 90,
    isCompleted: false,
    order: 1
  },
  {
    id: 'pt3',
    title: 'Start research for physics project',
    subject: 'Physics',
    description: 'Find 5 academic sources on quantum mechanics',
    estimatedDurationMinutes: 60,
    isCompleted: false,
    order: 2
  }
];

export const EventProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [studyTasks, setStudyTasks] = useState<StudyTask[]>(initialStudyTasks);
  const [priorityTasks, setPriorityTasks] = useState<PriorityTask[]>(initialPriorityTasks);
  const [loading, setLoading] = useState(false);
  const { success, info, error } = useLBPNotification();

  // Event operations
  const addEvent = (event: Omit<Event, 'id'>) => {
    const newEvent = { ...event, id: uuidv4() };
    setEvents(prevEvents => [...prevEvents, newEvent]);
    success("Event Added", `${event.title} has been added to your schedule`);
  };

  const updateEvent = (id: string, updates: Partial<Event>) => {
    setEvents(prevEvents => 
      prevEvents.map(event => 
        event.id === id ? { ...event, ...updates } : event
      )
    );
    info("Event Updated", "Your event has been updated");
  };

  const deleteEvent = (id: string) => {
    setEvents(prevEvents => prevEvents.filter(event => event.id !== id));
    // Also delete any associated study tasks
    setStudyTasks(prevTasks => prevTasks.filter(task => task.relatedEventId !== id));
    error("Event Deleted", "Your event has been removed");
  };

  // Study task operations
  const addStudyTask = (task: Omit<StudyTask, 'id'>) => {
    const newTask = { ...task, id: uuidv4() };
    setStudyTasks(prevTasks => [...prevTasks, newTask]);
  };

  const updateStudyTask = (id: string, updates: Partial<StudyTask>) => {
    setStudyTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === id ? { ...task, ...updates } : task
      )
    );
    
    if (updates.isCompleted !== undefined) {
      if (updates.isCompleted) {
        success("Task Completed", "Great job! Keep up the good work!");
      } else {
        info("Task Incomplete", "Task marked as incomplete");
      }
    }
  };

  const deleteStudyTask = (id: string) => {
    setStudyTasks(prevTasks => prevTasks.filter(task => task.id !== id));
  };

  // Priority task operations
  const addPriorityTask = (task: Omit<PriorityTask, 'id' | 'order'>) => {
    const maxOrder = priorityTasks.length > 0 
      ? Math.max(...priorityTasks.map(t => t.order)) 
      : -1;
    
    const newTask = { 
      ...task, 
      id: uuidv4(),
      order: maxOrder + 1 
    };
    
    setPriorityTasks(prevTasks => [...prevTasks, newTask]);
    success("Task Added to Priority List", `"${task.title}" has been added to your priorities`);
  };

  const updatePriorityTask = (id: string, updates: Partial<PriorityTask>) => {
    setPriorityTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === id ? { ...task, ...updates } : task
      )
    );

    if (updates.isCompleted !== undefined) {
      if (updates.isCompleted) {
        success("Priority Task Completed", "Great progress on your priorities!");
      } else {
        info("Priority Task Reopened", "Task returned to your active priorities");
      }
    } else {
      info("Priority Task Updated", "Your task details have been updated");
    }
  };

  const deletePriorityTask = (id: string) => {
    setPriorityTasks(prevTasks => {
      const tasksAfterDelete = prevTasks.filter(task => task.id !== id);
      // Re-order remaining tasks to avoid gaps
      return tasksAfterDelete.map((task, index) => ({
        ...task,
        order: index
      }));
    });
    error("Priority Task Removed", "Task has been removed from your priority list");
  };

  const reorderPriorityTasks = (sourceIndex: number, destinationIndex: number) => {
    setPriorityTasks(prevTasks => {
      const result = Array.from(prevTasks);
      const [removed] = result.splice(sourceIndex, 1);
      result.splice(destinationIndex, 0, removed);
      
      // Update order property for all tasks
      return result.map((task, index) => ({
        ...task,
        order: index
      }));
    });
    info("Priorities Reordered", "Your priority list has been updated");
  };

  // Mock AI study plan generation
  const generateStudyPlan = () => {
    setLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      // Here we would normally call the backend API which would use Gemini
      // For now, we'll just generate a simple mock plan
      
      const newTasks: StudyTask[] = [];
      const today = new Date();
      
      // Generate study tasks for each upcoming event
      events.forEach((event, idx) => {
        const eventDate = new Date(event.startDate);
        
        // Only create study tasks for future events
        if (eventDate > today) {
          // Calculate days before the event
          const daysDiff = Math.floor((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysDiff > 0) {
            // Create 1-3 study sessions per event depending on priority
            const numSessions = event.priority === 'High' ? 3 : 
                                event.priority === 'Medium' ? 2 : 1;
            
            for (let i = 0; i < numSessions; i++) {
              const sessionDate = new Date(today);
              sessionDate.setDate(today.getDate() + i + 1); // Space them out
              sessionDate.setHours(14 + i, 0, 0); // Afternoon sessions
              
              const endTime = new Date(sessionDate);
              endTime.setMinutes(endTime.getMinutes() + 90); // 90-minute sessions
              
              newTasks.push({
                id: uuidv4(),
                title: `Study for ${event.title}`,
                category: 'study',
                relatedEventId: event.id,
                scheduledStartTime: sessionDate.toISOString(),
                scheduledEndTime: endTime.toISOString(),
                isCompleted: false
              });
              
              // Add a break after each study session
              const breakStart = new Date(endTime);
              const breakEnd = new Date(breakStart);
              breakEnd.setMinutes(breakEnd.getMinutes() + 15); // 15-minute break
              
              newTasks.push({
                id: uuidv4(),
                title: 'Break',
                category: 'break',
                scheduledStartTime: breakStart.toISOString(),
                scheduledEndTime: breakEnd.toISOString(),
                isCompleted: false
              });
            }
          }
        }
      });
      
      // Also create tasks for priority items
      priorityTasks.forEach((task, idx) => {
        if (!task.isCompleted) {
          const taskDate = new Date(today);
          taskDate.setDate(today.getDate() + Math.floor(idx / 2) + 1);
          taskDate.setHours(10 + (idx % 2) * 3, 0, 0);
          
          const endTime = new Date(taskDate);
          endTime.setMinutes(endTime.getMinutes() + task.estimatedDurationMinutes);
          
          newTasks.push({
            id: uuidv4(),
            title: task.title,
            category: 'study',
            relatedPriorityTaskId: task.id,
            relatedEventId: task.relatedEventId,
            scheduledStartTime: taskDate.toISOString(),
            scheduledEndTime: endTime.toISOString(),
            isCompleted: false
          });
        }
      });
      
      // Replace existing study tasks with new ones
      setStudyTasks(newTasks);
      setLoading(false);
      
      success("Study Plan Generated", `Created ${newTasks.length} study sessions based on your events and priorities`);
    }, 2000);
  };

  // Add a study plan session to the schedule
  const addStudyPlan = (session: StudySessionEvent) => {
    // Calculate duration in minutes
    const startDate = new Date(session.startTime);
    const endDate = new Date(session.endTime);
    const durationMinutes = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60));
    
    // Create a new study task with all required fields
    const newTask: StudyTask = {
      id: session.id || uuidv4(),
      title: session.title,
      category: session.isBreak ? 'break' : 'study',
      scheduledStartTime: session.startTime,
      scheduledEndTime: session.endTime,
      subject: session.subject,
      isCompleted: false,
      estimatedDuration: durationMinutes,
      description: session.description || ''
    };
    
    // Update state with the new task
    setStudyTasks(prevTasks => {
      // Filter out any existing tasks with the same ID to prevent duplicates
      const filteredTasks = prevTasks.filter(task => task.id !== newTask.id);
      return [...filteredTasks, newTask];
    });

    // Show success notification
    success(
      session.isBreak ? "Break Added" : "Study Session Added",
      `${session.title} scheduled for ${format(startDate, "h:mm a")}`
    );
  };

  // Clear all study plan sessions from the schedule
  const clearStudyPlan = () => {
    setEvents(prev => prev.filter(event => !event.isStudyPlan));
  };

  return (
    <EventContext.Provider value={{
      events,
      studyTasks,
      priorityTasks,
      loading,
      addEvent,
      updateEvent,
      deleteEvent,
      addStudyTask,
      updateStudyTask,
      deleteStudyTask,
      generateStudyPlan,
      addPriorityTask,
      updatePriorityTask,
      deletePriorityTask,
      reorderPriorityTasks,
      addStudyPlan,
      clearStudyPlan
    }}>
      {children}
    </EventContext.Provider>
  );
};

export const useEvents = () => useContext(EventContext);
