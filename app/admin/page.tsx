"use client"

import type React from "react"
import { useState, useEffect } from "react"
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
} from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import ProtectedRoute from "@/components/ProtectedRoute"

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
  phonetic: string;
  status: "success" | "failed"
}

export default function AdminPage() {
  const [dictionary, setDictionary] = useState<DictionaryEntry[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [newEntry, setNewEntry] = useState({ chinese: "", english: "", pinyin: "", phonetic: "" })
  const [editEntry, setEditEntry] = useState({ chinese: "", english: "", pinyin: "" , phonetic: ""})
  const [isTranslating, setIsTranslating] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState<{ chinese: string; english: string; pinyin: string; phonetic: string } | null>(null)
  const [batchWords, setBatchWords] = useState("")
  const [batchResults, setBatchResults] = useState<BatchTranslationResult[]>([])
  const [isBatchTranslating, setIsBatchTranslating] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  const { user, logout } = useAuth()

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

  const handleAddEntry = async () => {
    if (newEntry.chinese && newEntry.english && newEntry.pinyin) {
      try {
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
          setNewEntry({ chinese: "", english: "", pinyin: "" , phonetic: ""})
          setAiSuggestion(null)
        } else {
          console.error("Failed to add entry:", data.message)
        }
      } catch (error) {
        console.error("Error adding entry:", error)
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
          setEditEntry({ chinese: "", english: "", pinyin: "" , phonetic: ""})
        } else {
          console.error("Failed to update entry:", data.message)
        }
      } catch (error) {
        console.error("Error updating entry:", error)
      }
    }
  }

  const handleEditCancel = () => {
    setEditingId(null)
    setEditEntry({ chinese: "", english: "", pinyin: "" , phonetic: ""})
  }

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/words/${id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        setDictionary(dictionary.filter((entry) => entry.id !== id))
      } else {
        console.error("Failed to delete entry:", data.message)
      }
    } catch (error) {
      console.error("Error deleting entry:", error)
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
          phonetic: prev.phonetic || data.result.phonetic
        }))
      }
    } catch (error) {
      console.error("AI translation failed:", error)
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
      // Process words in batches to optimize API calls
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
              phonetc: data.result?.phonetic || "Translation failed",
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
        results.push(...batchResults as any)
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
      const response = await fetch("/api/words/batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ entries }),
      })

      const data = await response.json()

      if (data.success) {
        // Refresh dictionary data
        await fetchDictionary()
        setBatchResults([])
        setBatchWords("")
        setUploadedFile(null)
      } else {
        console.error("Failed to add batch entries:", data.message)
      }
    } catch (error) {
      console.error("Error adding batch entries:", error)
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
                    <label htmlFor="new-pinyin" className="text-sm font-medium mb-1 block">
                      Phonetics
                    </label>
                    <input
                      id="Phonetics"
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
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Entry
                  </button>
                  <button
                    onClick={handleAITranslate}
                    disabled={isTranslating || (!newEntry.chinese && !newEntry.english)}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background border border-input hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 gap-2"
                  >
                    {isTranslating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
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
                          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background border border-input hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Add All to Dictionary ({batchResults.filter((r) => r.status === "success").length})
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
                  <h2 className="text-lg font-semibold">Dictionary Entries ({dictionary.length})</h2>
                </div>
                <div className="space-y-4">
                  {dictionary.map((entry, index) => (
                    <div
                      key={index}
                      className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                    >
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
                              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-3 py-2 gap-2"
                            >
                              <Save className="h-4 w-4" />
                              Save
                            </button>
                            <button
                              onClick={handleEditCancel}
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
                              className="inline-flex text-white items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-destructive hover:bg-destructive/90 h-9 px-3 py-2 gap-2"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {dictionary.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Plus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No dictionary entries yet. Add your first entry above.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </ProtectedRoute>
  )
}
