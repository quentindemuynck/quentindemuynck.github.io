import type { Transition } from "../NavigationContext";

type AboutPageProps = {
    transition: Transition;
};

export default function AboutPage({ transition }: AboutPageProps) 
{
    return (
        <>
        <div className={transition}>About</div>
            <div className={transition}>About</div>
            <div className={transition}>About</div>
            <div className={transition}>About</div>
            <div className={transition}>About</div>
            <div className={transition}>About</div>
            <div className={transition}>About</div>
            
        </>
    );
}