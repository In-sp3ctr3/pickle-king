import type { ButtonHTMLAttributes, ReactNode } from "react";

type ActionButtonVariant =
  "primary" | "secondary" | "quiet" | "danger" | "inverse";

export interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ActionButtonVariant;
}

const variantClasses: Record<ActionButtonVariant, string> = {
  primary: "action-button--primary bg-[#c8ff3d] text-[#090b08]",
  secondary: "action-button--secondary bg-[#f5f3e9] text-[#090b08]",
  quiet: "action-button--quiet bg-[#1a2017] text-[#f5f3e9]",
  danger: "action-button--danger bg-[#321912] text-[#ff9a78]",
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
      className={`action-button inline-flex min-h-13 items-center justify-center rounded-[14px] px-5 py-3 text-sm font-extrabold tracking-[0.035em] uppercase transition-[color,background-color,transform,box-shadow] duration-200 disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transform-none motion-reduce:transition-none ${variantClasses[variant]} ${className}`}
      type={type}
      {...props}
    >
      <span className="action-button__content">{children}</span>
    </button>
  );
}
