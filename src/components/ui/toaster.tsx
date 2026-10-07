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

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, action, ...props }) => (
        <Toast key={id} {...props}>
          <div className="flex w-full items-start justify-between gap-4">
            
            {/* Toast Content */}
            <div className="grid gap-1">
              {title && (
                <ToastTitle className="text-sm font-semibold">
                  {title}
                </ToastTitle>
              )}

              {description && (
                <ToastDescription className="text-sm opacity-90">
                  {description}
                </ToastDescription>
              )}
            </div>

            {/* Action Button */}
            {action && (
              <div className="shrink-0">
                {action}
              </div>
            )}
          </div>

          {/* Close Button */}
          <ToastClose />
        </Toast>
      ))}

      <ToastViewport />
    </ToastProvider>
  )
}