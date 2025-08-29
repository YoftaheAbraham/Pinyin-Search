"use client";
import React, { useState, useEffect } from 'react'
import { Search, MoreHorizontal, CheckSquare, Square, Trash2, Loader2, Plus } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import DictionaryRow from './DictionaryRow'

type DictionaryEntry = {
    id: number
    chinese: string
    english: string
    pinyin: string
    phonetic: string
}

const DictionaryTable = ({ 
    dictionary, 
    onDictionaryUpdate 
}: { 
    dictionary: DictionaryEntry[]
    onDictionaryUpdate: () => void
}) => {
    const [searchTerm, setSearchTerm] = useState("")
    const [entries, setEntries] = useState<DictionaryEntry[]>(Array.isArray(dictionary) ? dictionary : [])
    const [selectedEntries, setSelectedEntries] = useState<Set<number>>(new Set())
    const [isSearching, setIsSearching] = useState(false)
    const [isBulkDeleting, setIsBulkDeleting] = useState(false)
    const [showBatchActions, setShowBatchActions] = useState(false)
    const { success, error } = useToast()
    const fetchWords = async (query = "") => {
        setIsSearching(true)
        try {
            const res = await fetch(`/api/words${query ? `?q=${encodeURIComponent(query)}` : ''}`)
            const data = await res.json()
            
            if (res.ok) {
                setEntries(data.data)
            } else {
                error("Fetch Failed", data?.message || "Failed to fetch dictionary entries")
                setEntries([])
            }
        } catch (err) {
            console.error("Fetch error:", err)
            error("Network Error", "Failed to fetch dictionary entries")
            setEntries([])
        } finally {
            setIsSearching(false)
        }
    }

    useEffect(() => {
        fetchWords()
    }, [])

    const handleSearch = (term: string) => {
        setSearchTerm(term)
        fetchWords(term)
    }

    const handleSelectAll = () => {
        if (selectedEntries.size === entries.length) {
            setSelectedEntries(new Set())
        } else {
            setSelectedEntries(new Set(entries.map((entry) => entry.id)))
        }
    }

    const handleSelectEntry = (entryId: number) => {
        const newSelected = new Set(selectedEntries)
        if (newSelected.has(entryId)) newSelected.delete(entryId)
        else newSelected.add(entryId)
        setSelectedEntries(newSelected)
    }

    const handleBulkDelete = async () => {
        if (selectedEntries.size === 0) return
        try {
            setIsBulkDeleting(true)
            const res = await fetch("/api/words/batch/delete", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ids: Array.from(selectedEntries) }),
            })
            const result = await res.json()
            if (res.ok && result.success) {
                setSelectedEntries(new Set())
                success("Bulk Delete Complete", `Deleted ${result.data.deletedCount} entries`)
                onDictionaryUpdate()
                fetchWords(searchTerm)
            } else {
                error("Bulk Delete Failed", result?.message || "Unknown error occurred")
            }
        } catch (err) {
            console.error(err)
            error("Network Error", "Failed to delete entries")
        } finally {
            setIsBulkDeleting(false)
        }
    }

    return (
        <div className="border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">
                    Dictionary Entries ({entries.length})
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

            {showBatchActions && (
                <div className="mb-4 rounded-lg border border-primary/20 bg-primary/5 p-3 flex items-center justify-between">
                    <button onClick={handleSelectAll} className="inline-flex items-center gap-2 text-sm font-medium">
                        {selectedEntries.size === entries.length ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                        {selectedEntries.size === entries.length ? "Deselect All" : "Select All"}
                    </button>
                    {selectedEntries.size > 0 && (
                        <button
                            onClick={handleBulkDelete}
                            disabled={isBulkDeleting}
                            className="inline-flex items-center gap-2 rounded-md bg-destructive px-3 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
                        >
                            {isBulkDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            {isBulkDeleting ? "Deleting..." : `Delete ${selectedEntries.size}`}
                        </button>
                    )}
                </div>
            )}

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
                        {Array.isArray(entries) && entries.length > 0 ? (
                            entries.map((entry) => (
                                <DictionaryRow
                                    key={entry.id}
                                    entry={entry}
                                    isSelectable={showBatchActions}
                                    isSelected={selectedEntries.has(entry.id)}
                                    onSelect={handleSelectEntry}
                                    onUpdate={onDictionaryUpdate}
                                />
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6}>
                                    <EmptyState type={searchTerm ? "noResults" : "noEntries"} searchTerm={searchTerm} />
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

const EmptyState = ({ type, searchTerm }: { type: 'noEntries' | 'noResults'; searchTerm?: string }) => (
    <div className="py-12 text-center text-muted-foreground">
        {type === 'noEntries' ? (
            <>
                <Plus className="mx-auto mb-2 h-10 w-10 opacity-50" />
                <p>No dictionary entries yet. Add your first entry above.</p>
            </>
        ) : (
            <>
                <Search className="mx-auto mb-2 h-10 w-10 opacity-50" />
                <p>No entries found for "{searchTerm}"</p>
                <p className="text-sm">Try different search terms or check spelling.</p>
            </>
        )}
    </div>
)

export default DictionaryTable
