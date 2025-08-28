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
import AdminsController from "@/components/ui/AdminsController"

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


  useEffect(() => {
    fetchDictionary()
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

      const response = await fetch("/api/words/batch/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ids: Array.from(selectedEntries),
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setDictionary((prev) =>
          prev.filter((entry) => !selectedEntries.has(entry.id))
        )
        setSelectedEntries(new Set())
        success(
          "Bulk Delete Complete",
          `Successfully deleted ${result.data.deletedCount} entries`
        )
      } else {
        error("Bulk Delete Failed", result.message || "Unknown error occurred")
      }
    } catch (err) {
      console.error("Bulk delete error:", err)
      error("Network Error", "Failed to delete entries")
    } finally {
      setIsBulkDeleting(false)
    }
  }


  const handleSearch = async (term: string) => {
    setSearchTerm(term)
    if (term.trim()) {
      setIsSearching(true)
      setTimeout(() => setIsSearching(false), 300)
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
              phonetic: "Translation failed",
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
              {isLoadingData ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>Loading dictionary entries...</span>
                  </div>
                </div>
              ) : (
                <>
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
                          placeholder="apple&#10;
                          book&#10;
                          car&#10;
                          dog&#10;..."
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
                  <div className="border rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold">
                        Dictionary Entries ({filteredDictionary.length})
                      </h2>
                      <button
                        onClick={() => setShowBatchActions(!showBatchActions)}
                        className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition hover:bg-accent hover:text-accent-foreground"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                        Batch Actions
                      </button>
                    </div>
                    <div className="relative mb-4">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2">
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
                        className="w-full rounded-md border px-3 py-2 pl-10 text-sm focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    </div>

                    {/* Batch Actions */}
                    {showBatchActions && (
                      <div className="mb-4 rounded-lg border border-primary/20 bg-primary/5 p-3 flex items-center justify-between">
                        <button
                          onClick={handleSelectAll}
                          className="inline-flex items-center gap-2 text-sm font-medium"
                        >
                          {selectedEntries.size === filteredDictionary.length ? (
                            <CheckSquare className="h-4 w-4" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                          {selectedEntries.size === filteredDictionary.length
                            ? "Deselect All"
                            : "Select All"}
                        </button>

                        {selectedEntries.size > 0 && (
                          <button
                            onClick={handleBulkDelete}
                            disabled={isBulkDeleting}
                            className="inline-flex items-center gap-2 rounded-md bg-destructive px-3 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
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
                    )}

                    {/* Table */}
                    <div className="overflow-x-auto rounded-lg border">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/40">
                          <tr>
                            {showBatchActions && <th className="w-12 px-3 py-2 text-left">Select</th>}
                            <th className="px-3 py-2 text-left">Chinese</th>
                            <th className="px-3 py-2 text-left">English</th>
                            <th className="px-3 py-2 text-left">Pinyin</th>
                            <th className="px-3 py-2 text-left">Phonetic</th>
                            <th className="px-3 py-2 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredDictionary.map((entry) => (
                            <tr
                              key={entry.id}
                              className="border-t hover:bg-muted/30 transition-colors"
                            >
                              {showBatchActions && (
                                <td className="px-3 py-2">
                                  <button onClick={() => handleSelectEntry(entry.id)}>
                                    {selectedEntries.has(entry.id) ? (
                                      <CheckSquare className="h-4 w-4 text-primary" />
                                    ) : (
                                      <Square className="h-4 w-4 text-muted-foreground" />
                                    )}
                                  </button>
                                </td>
                              )}

                              {/* Editable Row */}
                              {editingId === entry.id ? (
                                <>
                                  <td className="px-3 py-2">
                                    <input
                                      value={editEntry.chinese}
                                      onChange={(e) =>
                                        setEditEntry({ ...editEntry, chinese: e.target.value })
                                      }
                                      className="w-full rounded border px-2 py-1 text-sm"
                                    />
                                  </td>
                                  <td className="px-3 py-2">
                                    <input
                                      value={editEntry.english}
                                      onChange={(e) =>
                                        setEditEntry({ ...editEntry, english: e.target.value })
                                      }
                                      className="w-full rounded border px-2 py-1 text-sm"
                                    />
                                  </td>
                                  <td className="px-3 py-2">
                                    <input
                                      value={editEntry.pinyin}
                                      onChange={(e) =>
                                        setEditEntry({ ...editEntry, pinyin: e.target.value })
                                      }
                                      className="w-full rounded border px-2 py-1 text-sm"
                                    />
                                  </td>
                                  <td className="px-3 py-2">
                                    <input
                                      value={editEntry.phonetic}
                                      onChange={(e) =>
                                        setEditEntry({ ...editEntry, phonetic: e.target.value })
                                      }
                                      className="w-full rounded border px-2 py-1 text-sm"
                                    />
                                  </td>
                                  <td className="px-3 py-2 text-right space-x-2">
                                    <button
                                      onClick={handleEditSave}
                                      disabled={isSavingEdit}
                                      className="rounded bg-primary px-3 py-1 text-sm text-white hover:bg-primary/90"
                                    >
                                      {isSavingEdit ? <Loader2 className="h-4 w-4 animate-spin" /> : <SaveIcon className="h-4 w-4" />}
                                    </button>
                                    <button
                                      onClick={handleEditCancel}
                                      className="rounded border px-3 py-1 text-sm hover:bg-accent"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  </td>
                                </>
                              ) : (
                                <>
                                  <td className="px-3 py-2 font-medium">{entry.chinese}</td>
                                  <td className="px-3 py-2">{entry.english}</td>
                                  <td className="px-3 py-2 text-primary">{entry.pinyin}</td>
                                  <td className="px-3 py-2 text-primary">{entry.phonetic}</td>
                                  <td className="px-3 py-2 text-right space-x-2">
                                    <button
                                      onClick={() => handleEditStart(entry)}
                                      className="rounded border px-3 py-1 text-sm hover:bg-accent"
                                    >
                                      <Pen className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDelete(entry.id)}
                                      disabled={deletingIds.has(entry.id)}
                                      className="rounded px-3 py-1 text-sm text-white bg-red-400 hover:bg-destructive/90"
                                    >

                                      {deletingIds.has(entry.id) ? <Loader2 className="h-4 w-4 animate-spin" />
                                        : <Trash2 className="h-4 w-4" />}
                                    </button>
                                  </td>
                                </>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Empty States */}
                    {filteredDictionary.length === 0 && !searchTerm && (
                      <div className="py-12 text-center text-muted-foreground">
                        <Plus className="mx-auto mb-2 h-10 w-10 opacity-50" />
                        <p>No dictionary entries yet. Add your first entry above.</p>
                      </div>
                    )}

                    {filteredDictionary.length === 0 && searchTerm && (
                      <div className="py-12 text-center text-muted-foreground">
                        <Search className="mx-auto mb-2 h-10 w-10 opacity-50" />
                        <p>No entries found for "{searchTerm}"</p>
                        <p className="text-sm">Try different search terms or check spelling.</p>
                      </div>
                    )}
                  </div>

                </>
              )}
            </>
          ) : (<>
            <AdminsController />
          </>)
          }
        </main>
      </div>
    </ProtectedRoute>
  )
}
