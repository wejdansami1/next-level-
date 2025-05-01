import { useContext, useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { EventContext } from '@/contexts/EventContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  Plus, GripVertical, X, Edit, Check, Clock, BookOpen, 
  LucideListTodo, MoveVertical 
} from 'lucide-react';
import { Toaster } from '@/components/ui/toaster';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const PriorityList = () => {
  const { 
    priorityTasks, events, addPriorityTask, updatePriorityTask, 
    deletePriorityTask, reorderPriorityTasks 
  } = useContext(EventContext);
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [taskInput, setTaskInput] = useState({
    title: '',
    description: '',
    subject: '',
    estimatedDurationMinutes: 45,
    relatedEventId: ''
  });

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    reorderPriorityTasks(result.source.index, result.destination.index);
  };

  const openAddDialog = () => {
    setEditingTask(null);
    setTaskInput({
      title: '',
      description: '',
      subject: '',
      estimatedDurationMinutes: 45,
      relatedEventId: ''
    });
    setDialogOpen(true);
  };

  const openEditDialog = (task: any) => {
    setEditingTask(task);
    setTaskInput({
      title: task.title,
      description: task.description || '',
      subject: task.subject || '',
      estimatedDurationMinutes: task.estimatedDurationMinutes || 45,
      relatedEventId: task.relatedEventId || ''
    });
    setDialogOpen(true);
  };

  const handleSaveTask = () => {
    if (!taskInput.title.trim()) return;

    const taskData = {
      title: taskInput.title,
      description: taskInput.description || undefined,
      subject: taskInput.subject || undefined,
      estimatedDurationMinutes: taskInput.estimatedDurationMinutes,
      relatedEventId: taskInput.relatedEventId || undefined,
      isCompleted: false
    };

    if (editingTask) {
      updatePriorityTask(editingTask.id, taskData);
    } else {
      addPriorityTask(taskData);
    }
    setDialogOpen(false);
  };

  const handleToggleComplete = (task: any) => {
    updatePriorityTask(task.id, {
      isCompleted: !task.isCompleted
    });
  };

  const sortedTasks = [...priorityTasks].sort((a, b) => a.order - b.order);
  
  const getRelatedEventTitle = (eventId: string) => {
    const event = events.find(event => event.id === eventId);
    return event ? event.title : null;
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-heading">Priority / To-Do List</h1>
        <Button className="lbp-button bg-primary" onClick={openAddDialog}>
          <Plus className="mr-2 h-4 w-4" /> Add Task
        </Button>
      </div>

      <Tabs defaultValue="manage" className="lbp-card">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="manage" className="flex items-center gap-2">
            <LucideListTodo className="h-4 w-4" />
            <span>Task Management</span>
          </TabsTrigger>
          <TabsTrigger value="prioritize" className="flex items-center gap-2">
            <MoveVertical className="h-4 w-4" />
            <span>Prioritization</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="manage">
          <Card className="border-0 shadow-none mb-6">
            <CardHeader className="px-0 pt-0">
              <CardDescription>
                Manage your tasks, add details, and link them to your events.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 space-y-3">
              {sortedTasks.length > 0 ? (
                sortedTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`lbp-card p-4 border-2 ${
                      task.isCompleted ? 'border-gray-300 bg-opacity-50' : 'border-lbp-felt-green'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className={`flex-1 ${task.isCompleted ? 'text-gray-500 line-through' : ''}`}>
                        <div className="font-heading text-lg">{task.title}</div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                          {task.subject && (
                            <div className="text-sm flex items-center gap-1 text-muted-foreground">
                              <BookOpen className="h-3 w-3" /> {task.subject}
                            </div>
                          )}
                          {task.estimatedDurationMinutes && (
                            <div className="text-sm flex items-center gap-1 text-muted-foreground">
                              <Clock className="h-3 w-3" /> {task.estimatedDurationMinutes} minutes
                            </div>
                          )}
                        </div>
                        
                        {task.relatedEventId && (
                          <div className="mt-2 p-2 bg-primary/10 rounded-md text-sm">
                            <span className="font-medium">Related Event:</span> {getRelatedEventTitle(task.relatedEventId)}
                          </div>
                        )}
                        
                        {task.description && (
                          <div className="mt-2 text-sm text-muted-foreground">
                            {task.description}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleComplete(task)}
                          className="h-8 w-8"
                        >
                          <Check className={`h-4 w-4 ${task.isCompleted ? 'text-green-500' : 'text-gray-400'}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(task)}
                          className="h-8 w-8"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deletePriorityTask(task.id)}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyTaskList openAddDialog={openAddDialog} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="prioritize">
          <Card className="border-0 shadow-none mb-6">
            <CardHeader className="px-0 pt-0">
              <CardDescription>
                Drag and drop tasks to reorder them by priority. Higher tasks have higher priority. 
                This order directly influences your AI study plan.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="priority-list">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-3"
                    >
                      {sortedTasks.length > 0 ? (
                        sortedTasks.map((task, index) => (
                          <Draggable key={task.id} draggableId={task.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`lbp-card p-3 flex items-center gap-2 border-2 border-dashed ${
                                  task.isCompleted ? 'border-gray-300 bg-opacity-50' : 'border-lbp-felt-green'
                                } ${snapshot.isDragging ? 'shadow-lg' : ''}`}
                              >
                                <div
                                  {...provided.dragHandleProps}
                                  className="cursor-grab flex items-center justify-center p-1 rounded hover:bg-gray-100"
                                >
                                  <GripVertical className="h-5 w-5 text-gray-500" />
                                </div>

                                <div className={`flex-1 ${task.isCompleted ? 'text-gray-500 line-through' : ''}`}>
                                  <div className="font-heading">{task.title}</div>
                                  {task.subject && (
                                    <div className="text-sm flex items-center gap-1 text-muted-foreground">
                                      <BookOpen className="h-3 w-3" /> {task.subject}
                                    </div>
                                  )}
                                  
                                  {task.relatedEventId && (
                                    <div className="text-sm text-primary-600 mt-1 inline-block">
                                      <span className="text-xs bg-primary/10 px-2 py-0.5 rounded-full">
                                        {getRelatedEventTitle(task.relatedEventId)}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleToggleComplete(task)}
                                  className="h-8 w-8"
                                >
                                  <Check className={`h-4 w-4 ${task.isCompleted ? 'text-green-500' : 'text-gray-400'}`} />
                                </Button>
                              </div>
                            )}
                          </Draggable>
                        ))
                      ) : (
                        <EmptyTaskList openAddDialog={openAddDialog} />
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="lbp-card max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTask ? 'Edit Task' : 'Add New Task'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Task Title</Label>
              <Input
                id="title"
                value={taskInput.title}
                onChange={(e) => setTaskInput({ ...taskInput, title: e.target.value })}
                placeholder="Read Chapter 5"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject (Optional)</Label>
              <Input
                id="subject"
                value={taskInput.subject}
                onChange={(e) => setTaskInput({ ...taskInput, subject: e.target.value })}
                placeholder="Mathematics"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="relatedEvent">Related Event (Optional)</Label>
              <Select 
                value={taskInput.relatedEventId} 
                onValueChange={(value) => setTaskInput({ ...taskInput, relatedEventId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an event (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {events.map(event => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Estimated Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                min="5"
                max="480"
                value={taskInput.estimatedDurationMinutes}
                onChange={(e) =>
                  setTaskInput({
                    ...taskInput,
                    estimatedDurationMinutes: parseInt(e.target.value) || 45
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={taskInput.description}
                onChange={(e) => setTaskInput({ ...taskInput, description: e.target.value })}
                placeholder="Additional details about this task"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveTask}>{editingTask ? 'Save Changes' : 'Add Task'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Toaster />
    </div>
  );
};

const EmptyTaskList = ({ openAddDialog }: { openAddDialog: () => void }) => {
  return (
    <div className="text-center py-8 lbp-card bg-muted border-dashed border-2">
      <p className="font-heading text-xl mb-4">No priority tasks yet!</p>
      <p className="mb-4">Add tasks to your priority list to help the AI create a better study plan.</p>
      <Button onClick={openAddDialog}>Add Your First Task</Button>
    </div>
  );
};

export default PriorityList;
