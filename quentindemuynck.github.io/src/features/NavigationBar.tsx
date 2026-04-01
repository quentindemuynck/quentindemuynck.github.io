import NavigationBarButton from "../components/Buttons/NavigationBarButton.tsx";
import { useNavigation } from "../NavigationContext";

export default function NavigationBar() {

    const { goToPage } = useNavigation();
    
    return (
        <>
            <section className="navbar flex items-center ">
                <NavigationBarButton 
                    className="navbar-title"
                    onClick={() => goToPage("home")}
                >
                    Quentin Demuynck
                </NavigationBarButton>

                <div className="ml-auto flex gap-4">
                    <NavigationBarButton>Projects</NavigationBarButton>
                    <NavigationBarButton>About</NavigationBarButton>
                </div>
            </section>
        </>
        )
    
}