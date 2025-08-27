"use client"

import { useState, useCallback } from "react"

export type ToastType = "success" | "error" | "warning" | "info"

export interface Toast {
  id: string
  type: ToastType
  title: string
  description?: string
  duration?: number
}

interface ToastOptions {
  title: string
  description?: string
  duration?: number
}

interface UseToastReturn {
  toasts: Toast[]
  success: (title: string, description?: string) => void
  error: (title: string, description?: string) => void
  warning: (title: string, description?: string) => void
  info: (title: string, description?: string) => void
  dismiss: (id: string) => void
  toast: (options: ToastOptions & { type: ToastType }) => void
}

export const useToast = (): UseToastReturn => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback(({ type, title, description, duration = 5000 }: ToastOptions & { type: ToastType }) => {
    const id = Math.random().toString(36).substring(2, 9)
    
    setToasts((prevToasts) => [...prevToasts, { id, type, title, description, duration }])
    
    // Auto-dismiss after duration
    if (duration > 0) {
      setTimeout(() => {
        dismiss(id)
      }, duration)
    }
  }, [])

  const success = useCallback((title: string, description?: string) => {
    toast({ type: "success", title, description })
  }, [toast])

  const error = useCallback((title: string, description?: string) => {
    toast({ type: "error", title, description })
  }, [toast])

  const warning = useCallback((title: string, description?: string) => {
    toast({ type: "warning", title, description })
  }, [toast])

  const info = useCallback((title: string, description?: string) => {
    toast({ type: "info", title, description })
  }, [toast])

  const dismiss = useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id))
  }, [])

  return {
    toasts,
    success,
    error,
    warning,
    info,
    dismiss,
    toast,
  }
}