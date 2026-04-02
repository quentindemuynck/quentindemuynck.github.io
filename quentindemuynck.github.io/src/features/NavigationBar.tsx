import NavigationBarButton from "../components/Buttons/NavigationBarButton.tsx";
import { useNavigation } from "../NavigationContext";

export default function NavigationBar() {

    const { goToPage } = useNavigation();
    
    return (
        <>
            <section className="fixed top-0 left-0 w-full z-50 navbar flex items-center h-20 px-6 ">
                <NavigationBarButton 
                    className="navbar-title"
                    onClick={() => goToPage("home")}
                >
                    Quentin Demuynck
                </NavigationBarButton>

                <div className="ml-auto flex gap-4">
                    <NavigationBarButton
                        onClick={() => goToPage("projects")}
                    >Projects</NavigationBarButton>
                    <NavigationBarButton
                        onClick={() => goToPage("about")}
                    >About</NavigationBarButton>
                </div>
            </section>
        </>
        )
    
}