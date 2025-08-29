"use client";
import React, { useState } from 'react'
import { Plus, Sparkles, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import AISuggestion from './AIsuggestion';

const AddEntryForm = ({ onEntryAdded }: { onEntryAdded: (data: any) => void }) => {
    const [newEntry, setNewEntry] = useState({ chinese: "", english: "", pinyin: "", phonetic: "" })
    const [isTranslating, setIsTranslating] = useState(false)
    const [aiSuggestion, setAiSuggestion] = useState<{
        chinese: string
        english: string
        pinyin: string
        phonetic: string
    } | null>(null)
    const [isAddingEntry, setIsAddingEntry] = useState(false)
    const { success, error } = useToast()

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
                    setNewEntry({ chinese: "", english: "", pinyin: "", phonetic: "" })
                    setAiSuggestion(null)
                    success("Entry Added", "Dictionary entry created successfully")
                    onEntryAdded(data.data)
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

    const handleAITranslate = async () => {
        if (!newEntry.chinese && !newEntry.english) return

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
                setNewEntry(prev => ({
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

    return (
        <div className="border rounded-lg p-6">
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
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
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
                <AISuggestion
                    suggestion={aiSuggestion}
                    onAccept={acceptAISuggestion}
                />
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
    )
}

export default AddEntryForm