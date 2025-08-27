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
} from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import ProtectedRoute from "@/components/ProtectedRoute"
import { useToast } from "@/hooks/use-toast"

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
  const [editingId, setEditingId] = useState<number | null>(null)
  const [newEntry, setNewEntry] = useState({ chinese: "", english: "", pinyin: "", phonetic: "" })
  const [editEntry, setEditEntry] = useState({ chinese: "", english: "", pinyin: "", phonetic: "" })
  const [isTranslating, setIsTranslating] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState<{
    chinese: string
    english: string
    pinyin: string
    phonetic: string
  } | null>(null)
  const [batchWords, setBatchWords] = useState("")
  const [batchResults, setBatchResults] = useState<BatchTranslationResult[]>([])
  const [isBatchTranslating, setIsBatchTranslating] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isAddingEntry, setIsAddingEntry] = useState(false)
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set())
  const [isAddingBatch, setIsAddingBatch] = useState(false)

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedEntries, setSelectedEntries] = useState<Set<number>>(new Set())
  const [isSearching, setIsSearching] = useState(false)
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  const [showBatchActions, setShowBatchActions] = useState(false)

  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(false)
  const [newAdmin, setNewAdmin] = useState({ username: "", email: "", password: "", role: "admin" })
  const [isAddingAdmin, setIsAddingAdmin] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [updatingAdminIds, setUpdatingAdminIds] = useState<Set<number>>(new Set())
  const [activeTab, setActiveTab] = useState<"dictionary" | "admins">("dictionary")

  const { user, logout } = useAuth()
  const { success, error } = useToast()

  const filteredDictionary = useMemo(() => {
    if (!searchTerm.trim()) return dictionary

    const term = searchTerm.toLowerCase()
    return dictionary.filter(
      (entry) =>
        entry.chinese.toLowerCase().includes(term) ||
        entry.english.toLowerCase().includes(term) ||
        entry.pinyin.toLowerCase().includes(term) ||
        entry.phonetic.toLowerCase().includes(term),
    )
  }, [dictionary, searchTerm])

  const fetchDictionary = async () => {
    try {
      setIsLoadingData(true)
      const response = await fetch("/api/words")
      const data = await response.json()

      if (data.success) {
        setDictionary(data.data)
      } else {
        console.error("Failed to fetch dictionary:", data.message)
      }
    } catch (error) {
      console.error("Error fetching dictionary:", error)
    } finally {
      setIsLoadingData(false)
    }
  }

  const fetchAdmins = async () => {
    try {
      setIsLoadingAdmins(true)
      const response = await fetch("/api/admins")
      const data = await response.json()

      console.log(data);
      
      if (data.success) {
        setAdmins(data.data)
      } else {
        console.error("Failed to fetch admins:", data.message)
      }
    } catch (error) {
      console.error("Error fetching admins:", error)
    } finally {
      setIsLoadingAdmins(false)
    }
  }

  useEffect(() => {
    fetchDictionary()
    fetchAdmins()
  }, [])

  const handleSelectAll = () => {
    if (selectedEntries.size === filteredDictionary.length) {
      setSelectedEntries(new Set())
    } else {
      setSelectedEntries(new Set(filteredDictionary.map((entry) => entry.id)))
    }
  }

  const handleSelectEntry = (entryId: number) => {
    const newSelected = new Set(selectedEntries)
    if (newSelected.has(entryId)) {
      newSelected.delete(entryId)
    } else {
      newSelected.add(entryId)
    }
    setSelectedEntries(newSelected)
  }

  const handleBulkDelete = async () => {
    if (selectedEntries.size === 0) return

    try {
      setIsBulkDeleting(true)
      const deletePromises = Array.from(selectedEntries).map(async (id) => {
        const response = await fetch(`/api/words/${id}`, {
          method: "DELETE",
        })
        return response.json()
      })

      const results = await Promise.all(deletePromises)
      const successCount = results.filter((result) => result.success).length

      if (successCount > 0) {
        setDictionary(dictionary.filter((entry) => !selectedEntries.has(entry.id)))
        setSelectedEntries(new Set())
        success("Bulk Delete Complete", `Successfully deleted ${successCount} entries`)
      }

      if (successCount < selectedEntries.size) {
        error("Partial Failure", `${selectedEntries.size - successCount} entries failed to delete`)
      }
    } catch (err) {
      error("Network Error", "Failed to delete entries")
    } finally {
      setIsBulkDeleting(false)
    }
  }

  const handleSearch = async (term: string) => {
    setSearchTerm(term)
    if (term.trim()) {
      setIsSearching(true)
      // Simulate search delay for better UX
      setTimeout(() => setIsSearching(false), 300)
    }
  }

  const handleAddAdmin = async () => {
    if (newAdmin.username && newAdmin.email && newAdmin.password) {
      try {
        setIsAddingAdmin(true)
        const response = await fetch("/api/admins", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newAdmin),
        })

        const data = await response.json()

        if (data.success) {
          setAdmins([...admins, data.data])
          setNewAdmin({ username: "", email: "", password: "", role: "admin" })
          success("Admin Added", "New admin created successfully")
        } else {
          error("Failed to Add Admin", data.message || "An error occurred while creating the admin")
        }
      } catch (err) {
        error("Network Error", "Failed to connect to the server")
      } finally {
        setIsAddingAdmin(false)
      }
    }
  }

  const handleToggleAdminStatus = async (adminId: number, currentStatus: boolean) => {
    try {
      setUpdatingAdminIds((prev) => new Set(prev).add(adminId))
      const response = await fetch(`/api/admins/${adminId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      })

      const data = await response.json()

      if (data.success) {
        setAdmins(admins.map((admin) => (admin.id === adminId ? { ...admin, isActive: !currentStatus } : admin)))
        success(
          !currentStatus ? "Admin Activated" : "Admin Deactivated",
          `Admin has been ${!currentStatus ? "activated" : "deactivated"} successfully`,
        )
      } else {
        error("Failed to Update Admin", data.message || "An error occurred while updating the admin")
      }
    } catch (err) {
      error("Network Error", "Failed to connect to the server")
    } finally {
      setUpdatingAdminIds((prev) => {
        const newSet = new Set(prev)
        newSet.delete(adminId)
        return newSet
      })
    }
  }

  const handleAddEntry = async () => {
    if (newEntry.chinese && newEntry.english && newEntry.pinyin) {
      try {
        setIsAddingEntry(true)
        const response = await fetch("/api/words", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newEntry),
        })

        const data = await response.json()

        if (data.success) {
          setDictionary([...dictionary, data.data])
          setNewEntry({ chinese: "", english: "", pinyin: "", phonetic: "" })
          setAiSuggestion(null)
          success("Entry Added", "Dictionary entry created successfully")
        } else {
          error("Failed to Add Entry", data.message || "An error occurred while adding the entry")
        }
      } catch (err) {
        error("Network Error", "Failed to connect to the server")
      } finally {
        setIsAddingEntry(false)
      }
    }
  }

  const handleEditStart = (entry: DictionaryEntry) => {
    setEditingId(entry.id)
    setEditEntry({ chinese: entry.chinese, english: entry.english, pinyin: entry.pinyin, phonetic: entry.phonetic })
  }

  const handleEditSave = async () => {
    if (editingId && editEntry.chinese && editEntry.english && editEntry.pinyin) {
      try {
        setIsSavingEdit(true)
        const response = await fetch(`/api/words/${editingId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(editEntry),
        })

        const data = await response.json()

        if (data.success) {
          setDictionary(dictionary.map((entry) => (entry.id === editingId ? data.data : entry)))
          setEditingId(null)
          setEditEntry({ chinese: "", english: "", pinyin: "", phonetic: "" })
          success("Entry Updated", "Dictionary entry updated successfully")
        } else {
          error("Failed to Update Entry", data.message || "An error occurred while updating the entry")
        }
      } catch (err) {
        error("Network Error", "Failed to connect to the server")
      } finally {
        setIsSavingEdit(false)
      }
    }
  }

  const handleEditCancel = () => {
    setEditingId(null)
    setEditEntry({ chinese: "", english: "", pinyin: "", phonetic: "" })
  }

  const handleDelete = async (id: number) => {
    try {
      setDeletingIds((prev) => new Set(prev).add(id))
      const response = await fetch(`/api/words/${id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        setDictionary(dictionary.filter((entry) => entry.id !== id))
        success("Entry Deleted", "Dictionary entry deleted successfully")
      } else {
        error("Failed to Delete Entry", data.message || "An error occurred while deleting the entry")
      }
    } catch (err) {
      error("Network Error", "Failed to connect to the server")
    } finally {
      setDeletingIds((prev) => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
    }
  }

  const handleAITranslate = async () => {
    if (!newEntry.chinese && !newEntry.english) {
      return
    }

    setIsTranslating(true)
    try {
      const input = newEntry.chinese || newEntry.english
      const type = newEntry.chinese ? "chinese" : "english"

      const response = await fetch("/api/ai-translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input, type }),
      })

      const data = await response.json()

      if (data.success) {
        setAiSuggestion(data.result)
        setNewEntry((prev) => ({
          chinese: prev.chinese || data.result.chinese,
          english: prev.english || data.result.english,
          pinyin: prev.pinyin || data.result.pinyin,
          phonetic: prev.phonetic || data.result.phonetic,
        }))
        success("AI Translation Complete", "Translation suggestions generated successfully")
      } else {
        error("AI Translation Failed", data.message || "Failed to generate translation")
      }
    } catch (err) {
      error("Network Error", "Failed to connect to AI translation service")
    } finally {
      setIsTranslating(false)
    }
  }

  const acceptAISuggestion = () => {
    if (aiSuggestion) {
      setNewEntry(aiSuggestion)
      setAiSuggestion(null)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === "text/plain") {
      setUploadedFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        setBatchWords(content)
      }
      reader.readAsText(file)
    }
  }

  const handleBatchTranslate = async () => {
    if (!batchWords.trim()) return

    setIsBatchTranslating(true)
    const words = batchWords.split("\n").filter((word) => word.trim())
    const results: BatchTranslationResult[] = []

    try {
      const batchSize = 10
      for (let i = 0; i < words.length; i += batchSize) {
        const batch = words.slice(i, i + batchSize)

        const batchPromises = batch.map(async (word) => {
          try {
            const response = await fetch("/api/ai-translate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ input: word.trim(), type: "english" }),
            })

            const data = await response.json()

            return {
              original: word.trim(),
              chinese: data.result?.chinese || "Translation failed",
              english: data.result?.english || word.trim(),
              pinyin: data.result?.pinyin || "Translation failed",
              phonetic: data.result?.phonetic || "Translation failed",
              status: data.success ? ("success" as const) : ("failed" as const),
            }
          } catch (error) {
            return {
              original: word.trim(),
              chinese: "Translation failed",
              english: word.trim(),
              pinyin: "Translation failed",
              status: "failed" as const,
            }
          }
        })

        const batchResults = await Promise.all(batchPromises)
        results.push(...(batchResults as any))
        if (i + batchSize < words.length) {
          await new Promise((resolve) => setTimeout(resolve, 500))
        }
      }

      setBatchResults(results)
    } catch (error) {
      console.error("Batch translation failed:", error)
    } finally {
      setIsBatchTranslating(false)
    }
  }

  const addBatchResultsToDictionary = async () => {
    const successfulResults = batchResults.filter((result) => result.status === "success")
    const entries = successfulResults.map((result) => ({
      chinese: result.chinese,
      english: result.english,
      pinyin: result.pinyin,
    }))

    try {
      setIsAddingBatch(true)
      const response = await fetch("/api/words/batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ entries }),
      })

      const data = await response.json()

      if (data.success) {
        await fetchDictionary()
        setBatchResults([])
        setBatchWords("")
        setUploadedFile(null)
        success("Batch Added", `Successfully added ${successfulResults.length} entries to dictionary`)
      } else {
        error("Failed to Add Batch", data.message || "An error occurred while adding batch entries")
      }
    } catch (err) {
      error("Network Error", "Failed to connect to the server")
    } finally {
      setIsAddingBatch(false)
    }
  }

  const exportResults = () => {
    const csv = [
      "Original,Chinese,English,Pinyin,Status",
      ...batchResults.map(
        (result) =>
          `"${result.original}","${result.chinese}","${result.english}","${result.pinyin}","${result.status}"`,
      ),
    ].join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "batch_translations.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

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
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === "dictionary"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <FileText className="h-4 w-4 inline mr-2" />
              Dictionary Management
            </button>
            <button
              onClick={() => setActiveTab("admins")}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === "admins"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Users className="h-4 w-4 inline mr-2" />
              Admin Management
            </button>
          </div>

          {activeTab === "dictionary" ? (
            <>
              {isLoadingData ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>Loading dictionary entries...</span>
                  </div>
                </div>
              ) : (
                <>
                  {/* Add New Entry Form */}
                  <div className="border rounded-lg p-6 mb-8">
                    <div className="mb-6">
                      <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Plus className="h-5 w-5" />
                        Add New Dictionary Entry
                        <div className="ml-auto">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                            <Sparkles className="h-3 w-3" />
                            AI Assisted
                          </div>
                        </div>
                      </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label htmlFor="new-chinese" className="text-sm font-medium mb-1 block">
                          Chinese Characters
                        </label>
                        <input
                          id="new-chinese"
                          placeholder="你好"
                          value={newEntry.chinese}
                          onChange={(e) => setNewEntry({ ...newEntry, chinese: e.target.value })}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </div>
                      <div>
                        <label htmlFor="new-english" className="text-sm font-medium mb-1 block">
                          English Translation
                        </label>
                        <input
                          id="new-english"
                          placeholder="hello"
                          value={newEntry.english}
                          onChange={(e) => setNewEntry({ ...newEntry, english: e.target.value })}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </div>
                      <div>
                        <label htmlFor="new-pinyin" className="text-sm font-medium mb-1 block">
                          Pinyin
                        </label>
                        <input
                          id="new-pinyin"
                          placeholder="nǐ hǎo"
                          value={newEntry.pinyin}
                          onChange={(e) => setNewEntry({ ...newEntry, pinyin: e.target.value })}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </div>
                      <div>
                        <label htmlFor="new-phonetic" className="text-sm font-medium mb-1 block">
                          Phonetic
                        </label>
                        <input
                          id="new-phonetic"
                          placeholder="hāló"
                          value={newEntry.phonetic}
                          onChange={(e) => setNewEntry({ ...newEntry, phonetic: e.target.value })}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </div>
                    </div>

                    {aiSuggestion && (
                      <div className="mb-4 border border-primary/20 bg-primary/5 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Sparkles className="h-4 w-4 text-primary" />
                          <span className="font-medium text-sm">AI Suggestion</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Chinese</div>
                            <div className="font-medium">{aiSuggestion.chinese}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">English</div>
                            <div className="font-medium">{aiSuggestion.english}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Pinyin</div>
                            <div className="font-medium text-primary">{aiSuggestion.pinyin}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Phonetic</div>
                            <div className="font-medium text-primary">{aiSuggestion.phonetic}</div>
                          </div>
                        </div>
                        <button
                          onClick={acceptAISuggestion}
                          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-3 py-2 gap-2"
                        >
                          <Sparkles className="h-4 w-4" />
                          Accept Suggestion
                        </button>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={handleAddEntry}
                        disabled={isAddingEntry}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 gap-2"
                      >
                        {isAddingEntry ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        {isAddingEntry ? "Adding..." : "Add Entry"}
                      </button>
                      <button
                        onClick={handleAITranslate}
                        disabled={isTranslating || (!newEntry.chinese && !newEntry.english)}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background border border-input hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 gap-2"
                      >
                        {isTranslating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Sparkles className="h-4 w-4" />
                        )}
                        {isTranslating ? "Translating..." : "AI Translate"}
                      </button>
                    </div>
                  </div>

                  {/* Batch Translation Section */}
                  <div className="border rounded-lg p-6 mb-8">
                    <div className="mb-6">
                      <h2 className="text-lg font-semibold flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Batch Translation
                        <div className="ml-auto">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                            <Sparkles className="h-3 w-3" />
                            Mass AI Translation
                          </div>
                        </div>
                      </h2>
                    </div>
                    <div className="space-y-4">
                      {/* File Upload */}
                      <div>
                        <label htmlFor="file-upload" className="text-sm font-medium mb-1 block">
                          Upload .txt file with words (one per line)
                        </label>
                        <div className="flex items-center gap-2 mt-2">
                          <input
                            id="file-upload"
                            type="file"
                            accept=".txt"
                            onChange={handleFileUpload}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          />
                          {uploadedFile && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Upload className="h-4 w-4" />
                              {uploadedFile.name}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Manual Input */}
                      <div>
                        <label htmlFor="batch-words" className="text-sm font-medium mb-1 block">
                          Or enter words manually (one per line)
                        </label>
                        <textarea
                          id="batch-words"
                          placeholder="apple&#10;book&#10;car&#10;dog&#10;..."
                          value={batchWords}
                          onChange={(e) => setBatchWords(e.target.value)}
                          rows={6}
                          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-2"
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={handleBatchTranslate}
                          disabled={isBatchTranslating || !batchWords.trim()}
                          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 gap-2"
                        >
                          {isBatchTranslating ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Sparkles className="h-4 w-4" />
                          )}
                          {isBatchTranslating ? "Translating..." : "Batch Translate"}
                        </button>

                        {batchResults.length > 0 && (
                          <>
                            <button
                              onClick={addBatchResultsToDictionary}
                              disabled={isAddingBatch}
                              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background border border-input hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 gap-2"
                            >
                              {isAddingBatch ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Plus className="h-4 w-4" />
                              )}
                              {isAddingBatch
                                ? "Adding..."
                                : `Add All to Dictionary (${batchResults.filter((r) => r.status === "success").length})`}
                            </button>
                            <button
                              onClick={exportResults}
                              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background border border-input hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 gap-2"
                            >
                              <Download className="h-4 w-4" />
                              Export CSV
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Batch Results */}
                    {batchResults.length > 0 && (
                      <div className="mt-6">
                        <h3 className="font-semibold mb-4">
                          Translation Results ({batchResults.filter((r) => r.status === "success").length} successful,{" "}
                          {batchResults.filter((r) => r.status === "failed").length} failed)
                        </h3>
                        <div className="max-h-96 overflow-y-auto space-y-2">
                          {batchResults.map((result, index) => (
                            <div
                              key={index}
                              className={`border rounded-lg p-3 ${result.status === "success" ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-500/20" : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-500/20"}`}
                            >
                              <div className="grid grid-cols-4 gap-4 text-sm">
                                <div>
                                  <div className="text-muted-foreground">Original</div>
                                  <div className="font-medium">{result.original}</div>
                                </div>
                                <div>
                                  <div className="text-muted-foreground">Chinese</div>
                                  <div className="font-medium">{result.chinese}</div>
                                </div>
                                <div>
                                  <div className="text-muted-foreground">English</div>
                                  <div className="font-medium">{result.english}</div>
                                </div>
                                <div>
                                  <div className="text-muted-foreground">Pinyin</div>
                                  <div className="font-medium text-primary">{result.pinyin}</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Dictionary Entries Table */}
                  <div className="border rounded-lg p-6">
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold">Dictionary Entries ({filteredDictionary.length})</h2>
                        <button
                          onClick={() => setShowBatchActions(!showBatchActions)}
                          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background border border-input hover:bg-accent hover:text-accent-foreground h-9 px-3 py-2 gap-2"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          Batch Actions
                        </button>
                      </div>

                      <div className="relative mb-4">
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                          {isSearching ? (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          ) : (
                            <Search className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <input
                          type="text"
                          placeholder="Search dictionary entries..."
                          value={searchTerm}
                          onChange={(e) => handleSearch(e.target.value)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-10 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </div>

                      {showBatchActions && (
                        <div className="border border-primary/20 bg-primary/5 rounded-lg p-4 mb-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={handleSelectAll}
                                className="inline-flex items-center gap-2 text-sm font-medium"
                              >
                                {selectedEntries.size === filteredDictionary.length ? (
                                  <CheckSquare className="h-4 w-4" />
                                ) : (
                                  <Square className="h-4 w-4" />
                                )}
                                {selectedEntries.size === filteredDictionary.length ? "Deselect All" : "Select All"}
                              </button>
                              {selectedEntries.size > 0 && (
                                <span className="text-sm text-muted-foreground">({selectedEntries.size} selected)</span>
                              )}
                            </div>
                            <div className="flex gap-2">
                              {selectedEntries.size > 0 && (
                                <button
                                  onClick={handleBulkDelete}
                                  disabled={isBulkDeleting}
                                  className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-destructive text-destructive-foreground hover:bg-destructive/90 h-8 px-3 py-2 gap-2"
                                >
                                  {isBulkDeleting ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                  {isBulkDeleting ? "Deleting..." : `Delete ${selectedEntries.size}`}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      {filteredDictionary.map((entry, index) => (
                        <div
                          key={index}
                          className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-start gap-4">
                            {showBatchActions && (
                              <button
                                onClick={() => handleSelectEntry(entry.id)}
                                className="mt-1 p-1 hover:bg-accent rounded"
                              >
                                {selectedEntries.has(entry.id) ? (
                                  <CheckSquare className="h-4 w-4 text-primary" />
                                ) : (
                                  <Square className="h-4 w-4 text-muted-foreground" />
                                )}
                              </button>
                            )}

                            <div className="flex-1">
                              {editingId === entry.id ? (
                                // Edit Mode
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                  <div>
                                    <label className="text-sm font-medium mb-1 block">Chinese Characters</label>
                                    <input
                                      value={editEntry.chinese}
                                      onChange={(e) => setEditEntry({ ...editEntry, chinese: e.target.value })}
                                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium mb-1 block">English Translation</label>
                                    <input
                                      value={editEntry.english}
                                      onChange={(e) => setEditEntry({ ...editEntry, english: e.target.value })}
                                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium mb-1 block">Pinyin</label>
                                    <input
                                      value={editEntry.pinyin}
                                      onChange={(e) => setEditEntry({ ...editEntry, pinyin: e.target.value })}
                                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium mb-1 block">Phonetic</label>
                                    <input
                                      value={editEntry.phonetic}
                                      onChange={(e) => setEditEntry({ ...editEntry, phonetic: e.target.value })}
                                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    />
                                  </div>
                                </div>
                              ) : (
                                // View Mode
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                  <div>
                                    <div className="text-sm text-muted-foreground mb-1">Chinese</div>
                                    <div className="text-lg font-semibold">{entry.chinese}</div>
                                  </div>
                                  <div>
                                    <div className="text-sm text-muted-foreground mb-1">English</div>
                                    <div className="text-lg">{entry.english}</div>
                                  </div>
                                  <div>
                                    <div className="text-sm text-muted-foreground mb-1">Pinyin</div>
                                    <div className="text-lg text-primary">{entry.pinyin}</div>
                                  </div>
                                  <div>
                                    <div className="text-sm text-muted-foreground mb-1">Phonetic</div>
                                    <div className="text-lg text-primary">{entry.phonetic}</div>
                                  </div>
                                </div>
                              )}

                              {/* Action Buttons */}
                              <div className="flex gap-2">
                                {editingId === entry.id ? (
                                  <>
                                    <button
                                      onClick={handleEditSave}
                                      disabled={isSavingEdit}
                                      className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-3 py-2 gap-2"
                                    >
                                      {isSavingEdit ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <Save className="h-4 w-4" />
                                      )}
                                      {isSavingEdit ? "Saving..." : "Save"}
                                    </button>
                                    <button
                                      onClick={handleEditCancel}
                                      disabled={isSavingEdit}
                                      className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background border border-input hover:bg-accent hover:text-accent-foreground h-9 px-3 py-2 gap-2"
                                    >
                                      <X className="h-4 w-4" />
                                      Cancel
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => handleEditStart(entry)}
                                      className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background border border-input hover:bg-accent hover:text-accent-foreground h-9 px-3 py-2 gap-2"
                                    >
                                      <Edit className="h-4 w-4" />
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => handleDelete(entry.id)}
                                      disabled={deletingIds.has(entry.id)}
                                      className="inline-flex text-white items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-destructive hover:bg-destructive/90 h-9 px-3 py-2 gap-2"
                                    >
                                      {deletingIds.has(entry.id) ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <Trash2 className="h-4 w-4" />
                                      )}
                                      {deletingIds.has(entry.id) ? "Deleting..." : "Delete"}
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {filteredDictionary.length === 0 && !searchTerm && (
                      <div className="text-center py-12 text-muted-foreground">
                        <Plus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No dictionary entries yet. Add your first entry above.</p>
                      </div>
                    )}

                    {filteredDictionary.length === 0 && searchTerm && (
                      <div className="text-center py-12 text-muted-foreground">
                        <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No entries found for "{searchTerm}"</p>
                        <p className="text-sm">Try different search terms or check spelling.</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
          ) : (<>
          <div className="border rounded-lg p-6 mb-8">
            <div className="mb-6">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add New Admin
                <div className="ml-auto">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                    <Shield className="h-3 w-3" />
                    Secure Access
                  </div>
                </div>
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="new-admin-username" className="text-sm font-medium mb-1 block">
                  Username
                </label>
                <input
                  id="new-admin-username"
                  placeholder="admin_user"
                  value={newAdmin.username}
                  onChange={(e) => setNewAdmin({ ...newAdmin, username: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <div>
                <label htmlFor="new-admin-email" className="text-sm font-medium mb-1 block">
                  Email
                </label>
                <input
                  id="new-admin-email"
                  type="email"
                  placeholder="admin@example.com"
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <div>
                <label htmlFor="new-admin-password" className="text-sm font-medium mb-1 block">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="new-admin-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={newAdmin.password}
                    onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="new-admin-role" className="text-sm font-medium mb-1 block">
                  Role
                </label>
                <select
                  id="new-admin-role"
                  value={newAdmin.role}
                  onChange={(e) => setNewAdmin({ ...newAdmin, role: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                  <option value="moderator">Moderator</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleAddAdmin}
                disabled={isAddingAdmin || !newAdmin.username || !newAdmin.email || !newAdmin.password}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 gap-2"
              >
                {isAddingAdmin ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {isAddingAdmin ? "Creating..." : "Create Admin"}
              </button>
            </div>
          </div>
          <div className="border rounded-lg p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Users className="h-5 w-5" />
                Admin Users ({admins.length})
              </h2>
            </div>

            {isLoadingAdmins ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span>Loading admin users...</span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {admins.map((admin) => (
                  <div
                    key={admin.id}
                    className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1">
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Username</div>
                          <div className="font-semibold">{admin.username}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Email</div>
                          <div className="text-sm">{admin.email}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Role</div>
                          <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                            <Shield className="h-3 w-3" />
                            {admin.role}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Status</div>
                          <div
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                              admin.isActive
                                ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                                : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                            }`}
                          >
                            {admin.isActive ? <ShieldCheck className="h-3 w-3" /> : <ShieldX className="h-3 w-3" />}
                            {admin.isActive ? "Active" : "Inactive"}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleToggleAdminStatus(admin.id, admin.isActive)}
                          disabled={updatingAdminIds.has(admin.id) ||(admin.id as any) === user?.id}
                          className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background h-9 px-3 py-2 gap-2 ${
                            admin.isActive
                              ? "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
                              : "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30"
                          }`}
                        >
                          {updatingAdminIds.has(admin.id) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : admin.isActive ? (
                            <ShieldX className="h-4 w-4" />
                          ) : (
                            <ShieldCheck className="h-4 w-4" />
                          )}
                          {updatingAdminIds.has(admin.id) ? "Updating..." : admin.isActive ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                    </div>
                    {(admin.id as any) === user?.id && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        This is your account - you cannot deactivate yourself
                      </div>
                    )}
                  </div>
                ))}

                {admins.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No admin users found. Create your first admin above.</p>
                  </div>
                )}
              </div>
            )}
          </div>
          </>)}
        </main>
      </div>
    </ProtectedRoute>
  )
}
