import Hero from "../features/hero/hero";
import type { Transition } from "../NavigationContext";

type HomePageProps = {
    transition: Transition;
};

export default function HomePage({ transition }: HomePageProps) {
    return (
        <section className={`${transition}`}>
            <Hero />
        </section>
    );
}