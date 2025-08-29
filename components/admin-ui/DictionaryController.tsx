"use client";
import React, { useEffect, useState } from 'react'
import DictionaryTable from './DictionaryTable'
import AddEntryForm from './AddEntryForm';
import BatchTranslation from './BatchTranslate'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react';

type DictionaryEntry = {
    id: number
    chinese: string
    english: string
    pinyin: string
    phonetic: string
}

const DictionaryController = () => {
    const [dictionary, setDictionary] = useState<DictionaryEntry[]>([])
    const [isLoadingData, setIsLoadingData] = useState(true)

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

    if (isLoadingData) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>Loading dictionary entries...</span>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <AddEntryForm 
                onEntryAdded={fetchDictionary}
            />
            <BatchTranslation 
                onBatchAdded={fetchDictionary}
            />
            <DictionaryTable 
                dictionary={dictionary}
                onDictionaryUpdate={fetchDictionary}
            />
        </div>
    )
}

export default DictionaryController