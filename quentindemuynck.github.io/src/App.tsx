import { useEffect, useState } from "react";
import Hero from "./features/hero/hero";
import NavigationBar from "./features/NavigationBar.tsx";
import { NavigationProvider } from "./NavigationContext.tsx";
import {PageRenderer} from "./PageRenderer.tsx";

export default function App() {
    const [theme, setTheme] = useState(
        localStorage.getItem("theme") || "light"
    );

    useEffect(() => {
        const root = document.documentElement;

        root.classList.remove("dark");
        root.removeAttribute("data-theme");

        if (theme === "dark") {
            root.classList.add("dark");
        } else if (theme !== "light") {
            root.setAttribute("data-theme", theme);
        }
        
        localStorage.setItem("theme", theme);
    }, [theme]);


    return (
        <NavigationProvider>
            <div className="min-h-screen bg-background text-foreground">
                <NavigationBar />
                <main className="pt-20">
                    <PageRenderer />
                </main>
            </div>
        </NavigationProvider>
    );
}