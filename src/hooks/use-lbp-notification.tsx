
import { useToast } from './use-toast';
import { ToastActionElement } from '@/components/ui/toast';

// Extend the toast variant types to include all the types we need
type NotificationType = 'default' | 'success' | 'info' | 'warning' | 'destructive';

interface NotificationOptions {
  title?: string;
  description?: string;
  duration?: number;
  action?: ToastActionElement;
}

export function useLBPNotification() {
  const { toast } = useToast();
  
  const showNotification = (
    type: NotificationType = 'default', 
    options: NotificationOptions = {}
  ) => {
    const { title, description, duration = 5000, action } = options;
    
    // Convert our extended variant types to the limited types accepted by the toast component
    // Default to 'default' for success/info/warning
    const toastVariant = type === 'destructive' ? 'destructive' : 'default';
    
    toast({
      variant: toastVariant,
      title: title,
      description: description,
      duration: duration,
      action: action,
      // Store the original type as a custom class that we can use for styling
      className: `lbp-notification lbp-${type}`
    });
  };
  
  return {
    notify: (title: string, description?: string, duration?: number) => 
      showNotification('default', { title, description, duration }),
    
    success: (title: string, description?: string, duration?: number) => 
      showNotification('success', { title, description, duration }),
    
    info: (title: string, description?: string, duration?: number) => 
      showNotification('info', { title, description, duration }),
    
    warning: (title: string, description?: string, duration?: number) => 
      showNotification('warning', { title, description, duration }),
    
    error: (title: string, description?: string, duration?: number) => 
      showNotification('destructive', { title, description, duration }),
    
    custom: (type: NotificationType, options: NotificationOptions) => 
      showNotification(type, options)
  };
}
