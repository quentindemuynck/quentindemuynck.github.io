

type NavigationBarButtonProps = {
    children: React.ReactNode;
    className?: string;
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
};


export default function NavigationBarButton({ children, className, onClick, }: NavigationBarButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`text-foreground  hover:text-hover-link hover:scale-105 transition-transform duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-95 ${className ?? ""}`}>
            {children}
        </button>
    );
}