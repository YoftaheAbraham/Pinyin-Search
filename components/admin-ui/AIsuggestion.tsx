import { Sparkles } from 'lucide-react'

const AISuggestion = ({ 
    suggestion, 
    onAccept 
}: { 
    suggestion: { chinese: string; english: string; pinyin: string; phonetic: string }
    onAccept: () => void
}) => {
    return (
        <div className="mb-4 border border-primary/20 bg-primary/5 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">AI Suggestion</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                <div>
                    <div className="text-xs text-muted-foreground mb-1">Chinese</div>
                    <div className="font-medium">{suggestion.chinese}</div>
                </div>
                <div>
                    <div className="text-xs text-muted-foreground mb-1">English</div>
                    <div className="font-medium">{suggestion.english}</div>
                </div>
                <div>
                    <div className="text-xs text-muted-foreground mb-1">Pinyin</div>
                    <div className="font-medium text-primary">{suggestion.pinyin}</div>
                </div>
                <div>
                    <div className="text-xs text-muted-foreground mb-1">Phonetic</div>
                    <div className="font-medium text-primary">{suggestion.phonetic}</div>
                </div>
            </div>
            <button
                onClick={onAccept}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-3 py-2 gap-2"
            >
                <Sparkles className="h-4 w-4" />
                Accept Suggestion
            </button>
        </div>
    )
}

export default AISuggestion