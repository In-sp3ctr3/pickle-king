import type { ButtonHTMLAttributes, ReactNode } from "react";

type ActionButtonVariant =
  "primary" | "secondary" | "quiet" | "danger" | "inverse";

export interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ActionButtonVariant;
}

const variantClasses: Record<ActionButtonVariant, string> = {
  primary: "bg-[#c8ff3d] text-[#090b08] hover:bg-[#d5ff6d] active:bg-[#95c721]",
  secondary:
    "border border-[#3b4436] bg-[#11150f] text-[#f5f3e9] hover:border-[#9da494] hover:bg-[#171d14] active:bg-[#20281b]",
  quiet: "bg-transparent text-[#f5f3e9] hover:bg-[#1a2017] active:bg-[#242c20]",
  danger:
    "border border-[#ff7a4d]/60 bg-transparent text-[#ff9a78] hover:bg-[#ff7a4d]/10 active:bg-[#ff7a4d]/20",
  inverse: "bg-[#090b08] text-[#f5f3e9] hover:bg-[#20281b] active:bg-[#2b3227]",
};

export function ActionButton({
  children,
  className = "",
  type = "button",
  variant = "primary",
  ...props
}: ActionButtonProps) {
  return (
    <button
      className={`inline-flex min-h-13 items-center justify-center gap-2 rounded-[18px] px-5 py-3 text-sm font-extrabold tracking-[0.08em] uppercase transition-colors duration-100 disabled:cursor-not-allowed disabled:opacity-45 ${variantClasses[variant]} ${className}`}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}
