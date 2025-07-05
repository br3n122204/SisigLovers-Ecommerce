"use client"

import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { CheckCircle, XCircle, Info } from "lucide-react"

export function Toaster() {
  const { toasts } = useToast()

  // Helper to pick icon based on variant
  function getToastIcon(variant: string | undefined) {
    if (variant === 'destructive') {
      return <XCircle className="text-red-500 animate-pop-in" size={28} />;
    }
    if (variant === 'success') {
      return <CheckCircle className="text-green-500 animate-pop-in" size={28} />;
    }
    return <Info className="text-blue-400 animate-pop-in" size={28} />;
  }

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="flex items-start gap-3">
              <span className="mt-1">{getToastIcon(variant || undefined)}</span>
              <div className="grid gap-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
