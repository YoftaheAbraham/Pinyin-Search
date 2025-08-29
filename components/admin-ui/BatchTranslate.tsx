"use client";
import React, { useState } from 'react'
import { FileText, Sparkles, Loader2, Download, Plus, Upload } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

type BatchTranslationResult = {
    original: string
    chinese: string
    english: string
    pinyin: string
    phonetic: string
    status: "success" | "failed"
}

const BatchTranslation = ({ onBatchAdded }: { onBatchAdded: () => void }) => {
    const [batchWords, setBatchWords] = useState("")
    const [batchResults, setBatchResults] = useState<BatchTranslationResult[]>([])
    const [isBatchTranslating, setIsBatchTranslating] = useState(false)
    const [uploadedFile, setUploadedFile] = useState<File | null>(null)
    const [isAddingBatch, setIsAddingBatch] = useState(false)
    const { success, error } = useToast()

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
                            status: data.success ? "success" as const : "failed" as const,
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
                setBatchResults([])
                setBatchWords("")
                setUploadedFile(null)
                success("Batch Added", `Successfully added ${successfulResults.length} entries to dictionary`)
                onBatchAdded()
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
        <div className="border rounded-lg p-6">
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

            {batchResults.length > 0 && (
                <BatchResults results={batchResults} />
            )}
        </div>
    )
}

const BatchResults = ({ results }: { results: BatchTranslationResult[] }) => {
    return (
        <div className="mt-6">
            <h3 className="font-semibold mb-4">
                Translation Results ({results.filter((r) => r.status === "success").length} successful,{" "}
                {results.filter((r) => r.status === "failed").length} failed)
            </h3>
            <div className="max-h-96 overflow-y-auto space-y-2">
                {results.map((result, index) => (
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
    )
}

export default BatchTranslation