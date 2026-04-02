import { useNavigation } from "./NavigationContext";
import HomePage from "./pages/HomePage";
import ProjectsPage from "./pages/ProjectsPage";
import AboutPage from "./pages/AboutPage";

export function PageRenderer() {
    const { currentPage, transition } = useNavigation();

    if (currentPage === "home") {
        return <HomePage transition={transition} />;
    }

    if (currentPage === "projects") {
        return <ProjectsPage transition={transition} />;
    }

    return <AboutPage transition={transition} />;
}