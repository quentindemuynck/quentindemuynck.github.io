import React, { createContext, useContext, useState } from "react";

export type Page = "home" | "projects" | "about";
export type Transition = "none" | "star-zoom" | "fade";

type NavigationContextType = {
    currentPage: Page;
    previousPage: Page | null;
    transition: Transition;
    isTransitioning: boolean;
    goToPage: (nextPage: Page) => void;
};

const NavigationContext = createContext<NavigationContextType | null>(null);

export function NavigationProvider({ children }: { children: React.ReactNode }) {
    const [currentPage, setCurrentPage] = useState<Page>("home");
    const [previousPage, setPreviousPage] = useState<Page | null>(null);
    const [transition, setTransition] = useState<Transition>("none");
    const [isTransitioning, setIsTransitioning] = useState(false);

    const getTransition = (from: Page, to: Page): Transition => {
        if (from === "home") return "star-zoom";
        return "fade";
    };

    const goToPage = (nextPage: Page) => {
        if (nextPage === currentPage || isTransitioning) return;

        const nextTransition = getTransition(currentPage, nextPage);

        setPreviousPage(currentPage);
        setTransition(nextTransition);
        setIsTransitioning(true);

        const duration = nextTransition === "star-zoom" ? 2500 : 400;

        window.setTimeout(() => {
            setCurrentPage(nextPage);
            setIsTransitioning(false);
            setTransition("none");
        }, duration);
    };

    return (
        <NavigationContext.Provider
            value={{
                currentPage,
                previousPage,
                transition,
                isTransitioning,
                goToPage,
            }}
        >
            {children}
        </NavigationContext.Provider>
    );
}

export function useNavigation() {
    const context = useContext(NavigationContext);

    if (!context) {
        throw new Error("useNavigation must be used inside NavigationProvider");
    }

    return context;
}