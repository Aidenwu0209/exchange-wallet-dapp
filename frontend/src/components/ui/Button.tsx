"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger";
  icon?: ReactNode;
};

export function Button({ variant = "primary", icon, className = "", children, ...props }: ButtonProps) {
  return (
    <button className={`button ${variant === "secondary" ? "secondary" : ""} ${variant === "danger" ? "danger" : ""} ${className}`} {...props}>
      {icon}
      {children}
    </button>
  );
}
