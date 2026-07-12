interface BadgeProps {
  label: string;
  variant?: "default" | "success" | "warning" | "danger";
}

const variantClasses: Record<NonNullable<BadgeProps["variant"]>, string> = {
  default: "bg-slate-100 text-slate-700",
  success: "bg-indigo-50 text-indigo-700",
  warning: "bg-slate-200 text-slate-800",
  danger: "bg-rose-50 text-rose-700",
};

export default function Badge({ label, variant = "default" }: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantClasses[variant],
      ].join(" ")}
    >
      {label}
    </span>
  );
}
