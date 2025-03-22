export interface User {
    id: string; 
    email: string; 
    created_at?: string;
} 

export interface AuthContext {
    user: User | null; 
    isAuthenticated: boolean; 
}

export const AUTH_CONTEXT = 'authContext';