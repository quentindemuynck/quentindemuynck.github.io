import React, { createContext, useContext, useState } from "react";

type Page = "home" | "about" | "projects" | "contact";
type Transition = "slide-left" | "slide-right" | "fade" | "zoom";

type NavigationContextType = {
    currentPage: Page;
    previousPage: Page | null;
    transition: Transition;
    goToPage: (page: Page) => void;
};

const NavigationContext = createContext<NavigationContextType | null>(null);

export function NavigationProvider({ children }: { children: React.ReactNode }) {
    const [currentPage, setCurrentPage] = useState<Page>("home");
    const [previousPage, setPreviousPage] = useState<Page | null>(null);
    const [transition, setTransition] = useState<Transition>("fade");

    const transitionMap: Record<string, Transition> = {
        "home-about": "slide-left",
        "about-home": "slide-right",
        "home-projects": "zoom",
        "projects-home": "fade",
    };

    const goToPage = (nextPage: Page) => {
        if (nextPage === currentPage) return;

        const key = `${currentPage}-${nextPage}`;
        const animation = transitionMap[key] ?? "fade";

        setPreviousPage(currentPage);
        setTransition(animation);
        setCurrentPage(nextPage);
    };

    return (
        <NavigationContext.Provider
        value={{ currentPage, previousPage, transition, goToPage }}
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