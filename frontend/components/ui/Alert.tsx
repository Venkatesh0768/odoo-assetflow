interface AlertProps {
  type?: "error" | "success" | "info";
  message: string;
}

const styles: Record<NonNullable<AlertProps["type"]>, string> = {
  error: "bg-rose-50 border-rose-300 text-rose-800",
  success: "bg-indigo-50 border-indigo-300 text-indigo-800",
  info: "bg-slate-50 border-slate-300 text-slate-700",
};

export default function Alert({ type = "error", message }: AlertProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className={[
        "rounded-md border px-4 py-3 text-sm",
        styles[type],
      ].join(" ")}
    >
      {message}
    </div>
  );
}
