
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { cva } from "class-variance-authority";
import { X } from "lucide-react";
import { useEffect, useState } from "react";

// Define toast variants with LBP-inspired styling
const toastVariants = cva(
  "group relative border-2 border-dashed shadow-lg rounded-xl data-[state=open]:animate-lbp-pop data-[state=closed]:animate-fade-out data-[swipe=end]:animate-fade-out",
  {
    variants: {
      variant: {
        default: "bg-lbp-paper border-lbp-stitch",
        destructive: "bg-lbp-paper border-lbp-felt-red",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export function LBPToaster() {
  const { toasts } = useToast();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, className, ...props }) {
        return (
          <Toast 
            key={id} 
            {...props} 
            className={cn(
              toastVariants({ variant }),
              "fixed top-4 right-4 z-50 min-w-[300px] p-4 animate-lbp-pop",
              // Custom styling for the extended types we're using via classes
              className?.includes('lbp-success') ? "border-lbp-felt-green" : "",
              className?.includes('lbp-info') ? "border-lbp-felt-blue" : "",
              className?.includes('lbp-warning') ? "border-lbp-felt-yellow" : "",
              className
            )}
          >
            <div className="grid gap-1">
              {title && (
                <ToastTitle className="font-heading text-lg flex justify-between items-center">
                  {title}
                </ToastTitle>
              )}
              {description && (
                <ToastDescription className="font-body text-sm">{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose className="absolute right-2 top-2 rounded-full p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 border border-lbp-stitch">
              <X className="h-4 w-4" />
            </ToastClose>
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
