"use client"

import { useState, useEffect } from "react"
import { CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface SuccessNotificationProps {
  message: string
  isVisible: boolean
  onClose: () => void
  title?: string
  buttonText?: string
  className?: string
}

interface SuccessNotificationProps {
  message: string
  description?: string
  isVisible: boolean
  onClose: () => void
  position?: string
  duration?: number
}

export function SuccessNotification({
  message,
  isVisible,
  onClose,
  title = "SUKSES",
  buttonText = "OK",
  className,
}: SuccessNotificationProps) {
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true)
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }

    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isVisible])

  const handleClose = () => {
    setIsAnimating(false)
    setTimeout(() => {
      onClose()
    }, 200)
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className={cn(
          "absolute inset-0 bg-black transition-opacity duration-200",
          isAnimating ? "opacity-50" : "opacity-0",
        )}
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className={cn(
          "relative bg-white rounded-lg shadow-xl p-8 mx-4 w-full max-w-sm transition-all duration-200",
          isAnimating ? "opacity-100 scale-100" : "opacity-0 scale-95",
          className,
        )}
      >
        {/* Success Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>

        {/* Message */}
        <div className="text-center mb-6">
          <p className="text-gray-600">{message}</p>
        </div>

        {/* OK Button */}
        <div className="flex justify-center">
          <button
            onClick={handleClose}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-8 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  )
}

// Hook for managing success notifications
export function useSuccessNotification() {
  const [notification, setNotification] = useState<{
    description: string | undefined
    message: string
    isVisible: boolean
    title?: string
    buttonText?: string
  }>({
    message: "",
    isVisible: false,
    description: undefined,
  })

  const showSuccess = (message: string, title?: string, buttonText?: string) => {
    setNotification({
      message,
      title,
      buttonText,
      isVisible: true,
      description: undefined,
    })
  }

  const hideSuccess = () => {
    setNotification((prev) => ({
      ...prev,
      isVisible: false,
    }))
  }

  return {
    notification,
    showSuccess,
    hideSuccess,
  }
}

// Utility function for showing success modal globally
export function showSuccessModal(message: string, title?: string, buttonText?: string) {
  // This would typically be used with a global state management solution
  // For now, it's a placeholder for the modal functionality
  console.log("Success:", { message, title, buttonText })
}
