import type { ButtonHTMLAttributes, ReactNode } from "react";

type ActionButtonVariant =
  "primary" | "secondary" | "quiet" | "danger" | "inverse";

export interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ActionButtonVariant;
}

const variantClasses: Record<ActionButtonVariant, string> = {
  primary: "action-button--primary bg-[#c8ff3d] text-[#090b08]",
  secondary: "action-button--secondary bg-[#171d14] text-[#f5f3e9]",
  quiet: "action-button--quiet bg-transparent text-[#f5f3e9]",
  danger: "action-button--danger bg-transparent text-[#ff9a78]",
  inverse: "action-button--inverse bg-[#090b08] text-[#f5f3e9]",
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
      className={`action-button inline-flex min-h-13 items-center justify-center rounded-full px-5 py-3 text-sm font-extrabold tracking-[0.045em] uppercase transition-[color,background-color,transform] duration-200 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transform-none motion-reduce:transition-none ${variantClasses[variant]} ${className}`}
      type={type}
      {...props}
    >
      <span className="action-button__content">{children}</span>
    </button>
  );
}
