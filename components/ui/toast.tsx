"use client"

import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle, XCircle, AlertCircle, Info, X } from "lucide-react"

export function Toaster() {
  const { toasts, dismiss } = useToast()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const icons = {
    success: <CheckCircle className="h-4 w-4" />,
    error: <XCircle className="h-4 w-4" />,
    warning: <AlertCircle className="h-4 w-4" />,
    info: <Info className="h-4 w-4" />,
  }

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-start gap-3 rounded-lg border p-4 shadow-lg transition-all duration-300
            ${toast.type === "success" ? "bg-green-50 border-green-200 text-green-900" : ""}
            ${toast.type === "error" ? "bg-red-50 border-red-200 text-red-900" : ""}
            ${toast.type === "warning" ? "bg-yellow-50 border-yellow-200 text-yellow-900" : ""}
            ${toast.type === "info" ? "bg-blue-50 border-blue-200 text-blue-900" : ""}
          `}
        >
          <div className="mt-0.5">{icons[toast.type]}</div>
          <div className="flex-1">
            <div className="font-medium">{toast.title}</div>
            {toast.description && <div className="text-sm mt-1">{toast.description}</div>}
          </div>
          <button
            onClick={() => dismiss(toast.id)}
            className="rounded p-1 hover:bg-black/10 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}