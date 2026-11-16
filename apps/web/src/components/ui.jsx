import { useEffect } from "react";
import { AlertTriangle, Inbox, X } from "lucide-react";

export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

const buttonVariants = {
  primary:
    "bg-emerald-700 text-white shadow-sm hover:bg-emerald-800 focus-visible:ring-emerald-600",
  secondary:
    "border border-stone-300 bg-white text-stone-700 shadow-sm hover:bg-stone-50 focus-visible:ring-stone-400",
  subtle:
    "bg-stone-100 text-stone-700 hover:bg-stone-200 focus-visible:ring-stone-400",
  ghost: "text-stone-500 hover:bg-stone-100 hover:text-stone-800 focus-visible:ring-stone-300",
  danger: "bg-red-600 text-white shadow-sm hover:bg-red-700 focus-visible:ring-red-500",
  dangerGhost: "text-red-600 hover:bg-red-50 focus-visible:ring-red-300",
  success: "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 focus-visible:ring-emerald-500",
};

const buttonSizes = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2.5 text-sm",
  lg: "px-5 py-3 text-sm",
  icon: "h-9 w-9 p-0",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}) {
  return (
    <button
      type={type}
      className={cn(buttonBase, buttonVariants[variant], buttonSizes[size], className)}
      {...props}
    />
  );
}

export function Card({ className, children }) {
  return (
    <div className={cn("rounded-2xl border border-stone-200 bg-white shadow-sm", className)}>
      {children}
    </div>
  );
}

export const inputClass =
  "w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-900 shadow-sm outline-none transition placeholder:text-stone-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:bg-stone-100";

export function Input({ className, ...props }) {
  return <input className={cn(inputClass, className)} {...props} />;
}

export function Select({ className, children, ...props }) {
  return (
    <select className={cn(inputClass, "appearance-none pr-9", className)} {...props}>
      {children}
    </select>
  );
}

export function Textarea({ className, ...props }) {
  return <textarea className={cn(inputClass, "min-h-24 resize-y", className)} {...props} />;
}

export function Field({ label, hint, htmlFor, className, children }) {
  return (
    <label htmlFor={htmlFor} className={cn("block space-y-1.5", className)}>
      <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">
        {label}
      </span>
      {children}
      {hint && <span className="block text-xs text-stone-400">{hint}</span>}
    </label>
  );
}

const badgeTones = {
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
  red: "border-red-200 bg-red-50 text-red-700",
  amber: "border-amber-200 bg-amber-50 text-amber-800",
  stone: "border-stone-200 bg-stone-100 text-stone-600",
  sky: "border-sky-200 bg-sky-50 text-sky-700",
};

export function Badge({ tone = "stone", className, children }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        badgeTones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function PageHeader({ title, subtitle, icon: Icon, actions }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 sm:flex">
            <Icon className="h-6 w-6" />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-stone-500">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

const statTones = {
  emerald: {
    card: "border-emerald-200 bg-emerald-50",
    label: "text-emerald-700",
    value: "text-emerald-950",
    icon: "bg-emerald-100 text-emerald-700",
  },
  red: {
    card: "border-red-200 bg-red-50",
    label: "text-red-700",
    value: "text-red-950",
    icon: "bg-red-100 text-red-700",
  },
  amber: {
    card: "border-amber-200 bg-amber-50",
    label: "text-amber-800",
    value: "text-amber-950",
    icon: "bg-amber-100 text-amber-800",
  },
  stone: {
    card: "border-stone-200 bg-white",
    label: "text-stone-500",
    value: "text-stone-900",
    icon: "bg-stone-100 text-stone-600",
  },
};

export function StatCard({ label, value, hint, tone = "stone", icon: Icon, className }) {
  const styles = statTones[tone];

  return (
    <div className={cn("rounded-2xl border p-4 shadow-sm", styles.card, className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={cn("text-xs font-semibold uppercase tracking-wide", styles.label)}>
            {label}
          </p>
          <p className={cn("mt-1 truncate text-2xl font-bold tracking-tight", styles.value)}>
            {value}
          </p>
          {hint && <p className={cn("mt-1 text-xs", styles.label)}>{hint}</p>}
        </div>
        {Icon && (
          <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", styles.icon)}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );
}

const modalSizes = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
  xl: "sm:max-w-4xl",
};

export function Modal({ open, onClose, title, subtitle, children, footer, size = "md" }) {
  useEffect(() => {
    if (!open) return undefined;

    function handleKeyDown(event) {
      if (event.key === "Escape") onClose?.();
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 sm:items-center sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className={cn(
          "flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-2xl",
          modalSizes[size]
        )}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between gap-4 border-b border-stone-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-stone-900">{title}</h2>
            {subtitle && <p className="mt-0.5 text-sm text-stone-500">{subtitle}</p>}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Cerrar">
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <div className="flex flex-wrap justify-end gap-2 border-t border-stone-200 bg-stone-50 px-5 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  onConfirm,
  onCancel,
  tone = "primary",
  loading = false,
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === "danger" ? "danger" : "primary"}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Procesando..." : confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex gap-3">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
            tone === "danger" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-700"
          )}
        >
          <AlertTriangle className="h-5 w-5" />
        </div>
        <p className="pt-1 text-sm leading-6 text-stone-600">{message}</p>
      </div>
    </Modal>
  );
}

const bannerTones = {
  error: "border-red-200 bg-red-50 text-red-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  info: "border-amber-200 bg-amber-50 text-amber-800",
};

export function Banner({ tone = "info", className, children }) {
  return (
    <div className={cn("rounded-xl border px-3 py-2 text-sm", bannerTones[tone], className)}>
      {children}
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100 text-stone-400">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mt-3 text-sm font-semibold text-stone-800">{title}</h3>
      {message && <p className="mt-1 max-w-sm text-sm text-stone-500">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
