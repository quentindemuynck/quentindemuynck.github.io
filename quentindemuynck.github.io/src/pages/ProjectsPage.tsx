import type { Transition } from "../NavigationContext";

type ProjectsPageProps = {
    transition: Transition;
};

export default function ProjectsPage({ transition }: ProjectsPageProps) {
    return <div className={transition}>Projects</div>;
}