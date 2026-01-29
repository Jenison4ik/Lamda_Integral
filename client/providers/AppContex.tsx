import { createContext, useContext, useState, ReactNode } from 'react';

export type AppState = "main" | "difficulty-pick" | "quiz" | "result"

export interface AppContextType {
    appState: AppState;
    setAppState: (state: AppState) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
    children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
    const [appState, setAppState] = useState<AppState>("main");

    return <AppContext.Provider value={{ appState, setAppState }}>{children}</AppContext.Provider>
}

export function useAppContext() {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
}

