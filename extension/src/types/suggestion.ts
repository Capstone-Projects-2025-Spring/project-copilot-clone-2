export interface Suggestion {
    id: string;
    createdAt?: Date | null;
    prompt: string;
    suggestionText: string;
    hasBug: boolean;
    model?: string;
}

export interface SuggestionResult {
    suggestions: string[];
    suggestionId: string; 
    hasBug: boolean;   
};