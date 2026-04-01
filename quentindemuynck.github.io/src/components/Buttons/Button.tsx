type ButtonVariant = "primary" | "secondary";

type PrimaryButtonProps = {
    children: React.ReactNode;
    className?: string;
    variant?: ButtonVariant;
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
};

export default function Button({
                                          children,
                                          className,
                                          variant = "primary",
                                          onClick,
                                      }: PrimaryButtonProps) {
    const baseClasses =
        "inline-flex items-center justify-center rounded-full px-[1.4rem] py-[0.9rem] font-semibold no-underline transition-all duration-200 ease-out hover:-translate-y-[2px] active:scale-95";

    const variantClasses =
        variant === "primary"
            ? "bg-gradient-to-r from-ge to-gs text-white shadow-[0_10px_30px_rgba(0,0,0,0.18)]"
            : "border border-white/12 text-foreground bg-white/3 backdrop-blur-[6px] hover:bg-white/6";

    return (
        <button
            type="button"
            onClick={onClick}
            className={` ${baseClasses} ${variantClasses} ${className ?? ""}`}
        >
            {children}
        </button>
    );
}