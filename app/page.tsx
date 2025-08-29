"use client"

import { useState, useEffect, useRef } from "react"
import { Search, BookOpen, Sparkles, Zap, Brain, Loader2, ChevronDown, ChevronUp } from "lucide-react"

interface Example {
  chinese: string
  pinyin: string
  english: string
}

interface DictionaryEntry {
  id: number
  chinese: string
  english: string
  pinyin: string
  phonetic: string
  examples?: Example[]
}

export default function Home() {
  const [searchTerm, setSearchTerm] = useState("")
  const [results, setResults] = useState<DictionaryEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [expandedExamples, setExpandedExamples] = useState<number[]>([])
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    if (searchTerm.trim() === "") {
      setResults([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    timeoutRef.current = setTimeout(() => {
      performSearch(searchTerm)
    }, 300)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [searchTerm])

  const performSearch = async (value: string) => {
    try {
      const response = await fetch(`/api/words?q=${encodeURIComponent(value)}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setResults(data.data)
        } else {
          setResults([])
        }
      } else {
        setResults([])
      }
    } catch (error) {
      console.error("Search failed:", error)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }

  const toggleExamples = (index: number) => {
    setExpandedExamples((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <h2 className="text-4xl font-bold">Pinyin Dictionary</h2>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" />
              <span>AI-Powered</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <span>Instant Results</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <span>Community Verified</span>
            </div>
          </div>
        </div>

        {/* Search Section */}
        <div className="mb-8">
          <div className="relative max-w-2xl mx-auto">
            {isLoading ? (
              <Loader2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-primary animate-spin" />
            ) : (
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            )}
            <input
              type="text"
              placeholder="Enter Chinese characters, pinyin, or English words..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex w-full rounded-md border-2 border-input bg-transparent px-3 py-2 text-lg shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 pl-10 h-14 focus:border-primary"
            />
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                <span className="text-lg font-medium">Processing your search...</span>
              </div>
            </div>
          </div>
        )}

        {/* Search Results */}
        {!isLoading && searchTerm && results.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold mb-4">Search Results ({results.length})</h3>
            <div className="space-y-4">
              {results.map((item, index) => (
                <div
                  key={item.id}
                  className="border border-border rounded-lg hover:bg-muted/50 transition-colors animate-in fade-in-0 slide-in-from-bottom-2"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex flex-col sm:flex-row items-start justify-between p-4 gap-4">
                    <div className="flex-1 grid grid-cols-2 xs:grid-cols-3 gap-4 w-full">
                      <div className="flex flex-col">
                        <div className="text-xs text-muted-foreground mb-1">Chinese</div>
                        <div className="text-2xl font-bold break-all">{item.chinese}</div>
                      </div>
                      <div className="flex flex-col">
                        <div className="text-xs text-muted-foreground mb-1">Pinyin</div>
                        <div className="text-lg text-primary font-semibold break-words">{item.pinyin}</div>
                      </div>
                      <div className="flex flex-col">
                        <div className="text-xs text-muted-foreground mb-1">English</div>
                        <div className="text-lg text-muted-foreground break-words">{item.english}</div>
                      </div>
                      <div className="flex flex-col">
                        <div className="text-xs text-muted-foreground mb-1">Phonetic</div>
                        <div className="text-lg text-muted-foreground break-words">{item.phonetic}</div>
                      </div>
                    </div>
                    {item.examples && item.examples.length > 0 && (
                      <button
                        onClick={() => toggleExamples(index)}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background hover:bg-accent hover:text-accent-foreground h-9 px-3 gap-2 self-start sm:self-center flex-shrink-0"
                      >
                        <span className="hidden xs:inline text-sm">Examples</span>
                        <span className="xs:hidden text-sm">Ex</span>
                        {expandedExamples.includes(index) ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </div>

                  {item.examples && expandedExamples.includes(index) && (
                    <div className="border-t border-border bg-muted/20 p-4">
                      <h4 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wide">
                        Example Sentences
                      </h4>
                      <div className="space-y-3">
                        {item.examples.map((example, exampleIndex) => (
                          <div key={exampleIndex} className="space-y-1 p-3 bg-background rounded-md">
                            <div className="text-base sm:text-lg font-medium break-words">{example.chinese}</div>
                            <div className="text-sm text-primary font-medium break-words">{example.pinyin}</div>
                            <div className="text-sm text-muted-foreground italic break-words">{example.english}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Results */}
        {!isLoading && searchTerm && results.length === 0 && (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-4">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No results found for "{searchTerm}"</p>
              <p className="text-sm">Try searching with different terms or check the spelling.</p>
            </div>
          </div>
        )}

        {/* Intro (when no search) */}
        {!searchTerm && !isLoading && (
          <div className="text-center py-12">
            <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-8 mb-8">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Sparkles className="h-6 w-6 text-primary" />
                <h3 className="text-xl font-semibold">Powered by Advanced AI</h3>
              </div>
              <p className="text-muted-foreground max-w-md mx-auto">
                Our intelligent system provides accurate pinyin translations with community verification for the
                highest quality results.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="bg-secondary rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Search className="h-8 w-8" />
                </div>
                <h3 className="font-semibold mb-2">Smart Search</h3>
                <p className="text-sm text-muted-foreground">
                  AI-powered search understands context and provides accurate pinyin for any input
                </p>
              </div>
              <div className="text-center">
                <div className="bg-secondary rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Brain className="h-8 w-8" />
                </div>
                <h3 className="font-semibold mb-2">AI Translation</h3>
                <p className="text-sm text-muted-foreground">
                  Advanced machine learning ensures precise pronunciation guides
                </p>
              </div>
              <div className="text-center">
                <div className="bg-secondary rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="h-8 w-8" />
                </div>
                <h3 className="font-semibold mb-2">Community Verified</h3>
                <p className="text-sm text-muted-foreground">
                  Human experts review and verify AI translations for accuracy
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
