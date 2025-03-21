export interface Suggestion {
    id: string;
    createdAt?: Date | null;
    prompt: string;
    suggestionText: string;
    hasBug: boolean;
    vendor?: string;
    model?: string;
}

export interface SuggestionResult {
    suggestions: string[];
    suggestionId: string; 
    hasBug: boolean;   
};