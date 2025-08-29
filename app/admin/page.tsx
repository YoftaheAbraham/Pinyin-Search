"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  ArrowLeft,
  Sparkles,
  Loader2,
  Upload,
  FileText,
  Download,
  LogOut,
  Users,
  Shield,
  ShieldCheck,
  ShieldX,
  Eye,
  EyeOff,
  Search,
  CheckSquare,
  Square,
  MoreHorizontal,
  Pen,
  SaveIcon,
} from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import ProtectedRoute from "@/components/ProtectedRoute"
import { useToast } from "@/hooks/use-toast"
import AdminsController from "@/components/admin-ui/AdminsController"
import DictionaryController from "@/components/admin-ui/DictionaryController"

type DictionaryEntry = {
  id: number
  chinese: string
  english: string
  pinyin: string
  phonetic: string
}

type BatchTranslationResult = {
  original: string
  chinese: string
  english: string
  pinyin: string
  phonetic: string
  status: "success" | "failed"
}

type AdminUser = {
  id: number
  username: string
  email: string
  role: string
  isActive: boolean
  createdAt?: string
}

export default function AdminPage() {
  const [dictionary, setDictionary] = useState<DictionaryEntry[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [activeTab, setActiveTab] = useState<"dictionary" | "admins">("dictionary")

  const { user, logout } = useAuth()
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <header className=" bg-card">
          <div className="max-w-6xl mx-auto py-2">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex gap-2 items-center">
                <Link href="/">
                  <button className="inline-flex cursor-pointer text-gray-700 items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background hover:bg-accent h-9 px-3 py-2 gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Search
                  </button>
                </Link>
                /<h1 className="text-sm font-semibold">Admin Dashboard</h1>
              </div>
              <div className="ml-auto flex items-center gap-4">
                <span className="text-sm text-muted-foreground">Welcome, {user?.username}</span>
                <button
                  onClick={logout}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background hover:bg-accent h-9 px-3 py-2 gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex gap-1 mb-8 border-b">
            <button
              onClick={() => setActiveTab("dictionary")}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === "dictionary"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
            >
              <FileText className="h-4 w-4 inline mr-2" />
              Dictionary Management
            </button>
            {
              user && user.role == "super_admin" && <>
                <button
                  onClick={() => setActiveTab("admins")}
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === "admins"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                >
                  <Users className="h-4 w-4 inline mr-2" />
                  Admin Management
                </button>
              </>
            }
          </div>

          {activeTab === "dictionary" ? (
            <>
              <DictionaryController />
            </>
          ) : (<>
            {
              user && user.role == "super_admin" && <>
                <AdminsController />
              </>
            }
          </>)
          }
        </main>
      </div>
    </ProtectedRoute>
  )
}
