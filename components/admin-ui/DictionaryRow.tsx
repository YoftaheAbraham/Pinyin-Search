"use client";
import React, { useState } from 'react'
import { CheckSquare, Square, Pen, Trash2, Loader2, SaveIcon, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

type DictionaryEntry = {
    id: number
    chinese: string
    english: string
    pinyin: string
    phonetic: string
}

const DictionaryRow = ({ 
    entry, 
    isSelectable, 
    isSelected, 
    onSelect, 
    onUpdate 
}: { 
    entry: DictionaryEntry
    isSelectable: boolean
    isSelected: boolean
    onSelect: (id: number) => void
    onUpdate: () => void
}) => {
    const [editingId, setEditingId] = useState<number | null>(null)
    const [editEntry, setEditEntry] = useState({ chinese: "", english: "", pinyin: "", phonetic: "" })
    const [isSavingEdit, setIsSavingEdit] = useState(false)
    const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set())
    const { success, error } = useToast()

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
                    setEditingId(null)
                    setEditEntry({ chinese: "", english: "", pinyin: "", phonetic: "" })
                    success("Entry Updated", "Dictionary entry updated successfully")
                    onUpdate()
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
                success("Entry Deleted", "Dictionary entry deleted successfully")
                onUpdate()
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

    return (
        <tr className="border-t hover:bg-muted/30 transition-colors">
            {isSelectable && (
                <td className="px-3 py-2">
                    <button onClick={() => onSelect(entry.id)}>
                        {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-primary" />
                        ) : (
                            <Square className="h-4 w-4 text-muted-foreground" />
                        )}
                    </button>
                </td>
            )}

            {editingId === entry.id ? (
                <>
                    <td className="px-3 py-2">
                        <input
                            value={editEntry.chinese}
                            onChange={(e) => setEditEntry({ ...editEntry, chinese: e.target.value })}
                            className="w-full rounded border px-2 py-1 text-sm"
                        />
                    </td>
                    <td className="px-3 py-2">
                        <input
                            value={editEntry.english}
                            onChange={(e) => setEditEntry({ ...editEntry, english: e.target.value })}
                            className="w-full rounded border px-2 py-1 text-sm"
                        />
                    </td>
                    <td className="px-3 py-2">
                        <input
                            value={editEntry.pinyin}
                            onChange={(e) => setEditEntry({ ...editEntry, pinyin: e.target.value })}
                            className="w-full rounded border px-2 py-1 text-sm"
                        />
                    </td>
                    <td className="px-3 py-2">
                        <input
                            value={editEntry.phonetic}
                            onChange={(e) => setEditEntry({ ...editEntry, phonetic: e.target.value })}
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
    )
}

export default DictionaryRow