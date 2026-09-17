import React from "react";

// ─── Badge ────────────────────────────────────────────────────────────────────
type BadgeVariant = "active" | "inactive" | "pending" | "closed" | "evaluation" | "draft" | "published" | "warning" | "info";

const badgeStyles: Record<BadgeVariant, string> = {
  active: "bg-emerald-100 text-emerald-800 border border-emerald-200",
  inactive: "bg-gray-100 text-gray-600 border border-gray-200",
  pending: "bg-amber-100 text-amber-800 border border-amber-200",
  closed: "bg-red-100 text-red-700 border border-red-200",
  evaluation: "bg-blue-100 text-blue-800 border border-blue-200",
  draft: "bg-gray-100 text-gray-600 border border-gray-200",
  published: "bg-emerald-100 text-emerald-800 border border-emerald-200",
  warning: "bg-orange-100 text-orange-800 border border-orange-200",
  info: "bg-sky-100 text-sky-700 border border-sky-200",
};

const badgeLabels: Record<string, string> = {
  active: "Activo",
  inactive: "Inactivo",
  pending: "Pendiente",
  closed: "Cerrado",
  evaluation: "En Evaluación",
  draft: "Borrador",
  published: "Publicado",
  warning: "Alerta",
  info: "Info",
};

export function Badge({ variant, children, className = "" }: { variant: BadgeVariant; children?: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeStyles[variant]} ${className}`}>
      {children ?? badgeLabels[variant]}
    </span>
  );
}

// ─── Button ───────────────────────────────────────────────────────────────────
type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "gold";
type ButtonSize = "sm" | "md" | "lg";

const btnBase = "inline-flex items-center gap-2 font-medium rounded-lg cursor-pointer border-0 transition-all duration-150";

const btnVariants: Record<ButtonVariant, string> = {
  primary: "bg-[#1E6B3C] text-white hover:bg-[#155230] shadow-sm hover:shadow-md",
  secondary: "bg-[#EBF5EF] text-[#1E6B3C] hover:bg-[#D4EBD9]",
  outline: "bg-white text-[#1E6B3C] border border-[#1E6B3C] hover:bg-[#EBF5EF]",
  ghost: "bg-transparent text-[#637068] hover:bg-[#F2F5F3]",
  danger: "bg-red-600 text-white hover:bg-red-700",
  gold: "bg-[#F2A900] text-[#1A2B22] hover:bg-[#D4930B] shadow-sm",
};

const btnSizes: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  children,
  onClick,
  disabled,
  className = "",
  type = "button",
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      className={`${btnBase} ${btnVariants[variant]} ${btnSizes[size]} ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({
  children,
  className = "",
  padding = true,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-[#DDE4DF] shadow-sm ${padding ? "p-5" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
export function KpiCard({
  title,
  value,
  sub,
  icon,
  color = "green",
  trend,
}: {
  title: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  color?: "green" | "gold" | "blue" | "purple";
  trend?: { value: string; up: boolean };
}) {
  const colors = {
    green: { bg: "#EBF5EF", icon: "#1E6B3C", border: "#C8E6D2" },
    gold: { bg: "#FFF8E6", icon: "#D4930B", border: "#FFE5A0" },
    blue: { bg: "#EFF6FF", icon: "#2563EB", border: "#BFDBFE" },
    purple: { bg: "#F5F3FF", icon: "#7C3AED", border: "#DDD6FE" },
  };
  const c = colors[color];

  return (
    <div
      className="bg-white rounded-xl border shadow-sm p-5 flex items-start gap-4 hover:shadow-md transition-shadow"
      style={{ borderColor: c.border }}
    >
      <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: c.bg }}>
        <span style={{ color: c.icon }}>{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-[#637068] mb-0.5">{title}</p>
        <p className="text-2xl font-700 text-[#1A2B22] font-bold leading-tight">{value}</p>
        {sub && <p className="text-xs text-[#637068] mt-0.5">{sub}</p>}
        {trend && (
          <div className={`inline-flex items-center gap-1 mt-1 text-xs font-medium ${trend.up ? "text-emerald-600" : "text-red-500"}`}>
            <span>{trend.up ? "↑" : "↓"}</span>
            <span>{trend.value}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
export function PageHeader({
  title,
  subtitle,
  actions,
  breadcrumb,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  breadcrumb?: string[];
}) {
  return (
    <div className="mb-6">
      {breadcrumb && (
        <div className="flex items-center gap-1.5 text-xs text-[#637068] mb-2">
          {breadcrumb.map((crumb, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span>/</span>}
              <span className={i === breadcrumb.length - 1 ? "text-[#1E6B3C] font-medium" : ""}>{crumb}</span>
            </React.Fragment>
          ))}
        </div>
      )}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#1A2B22]">{title}</h1>
          {subtitle && <p className="text-sm text-[#637068] mt-0.5">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
      </div>
    </div>
  );
}

// ─── Search + Filter bar ──────────────────────────────────────────────────────
export function SearchBar({
  placeholder,
  value,
  onChange,
}: {
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9BAD9F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        className="w-full pl-9 pr-4 py-2 text-sm border border-[#DDE4DF] rounded-lg bg-white text-[#1A2B22] placeholder-[#9BAD9F] focus:outline-none focus:border-[#1E6B3C] focus:ring-1 focus:ring-[#1E6B3C]"
        placeholder={placeholder ?? "Buscar..."}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
export function ProgressBar({ value, color = "green" }: { value: number; color?: "green" | "gold" | "blue" | "red" }) {
  const colors = {
    green: "#1E6B3C",
    gold: "#F2A900",
    blue: "#2563EB",
    red: "#DC2626",
  };
  return (
    <div className="w-full h-2 bg-[#EBF5EF] rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, backgroundColor: colors[color] }}
      />
    </div>
  );
}

// ─── Tab bar ──────────────────────────────────────────────────────────────────
export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: string; label: string; icon?: React.ReactNode }[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex gap-1 bg-[#F2F5F3] p-1 rounded-xl">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            active === tab.id
              ? "bg-white text-[#1E6B3C] shadow-sm border border-[#DDE4DF]"
              : "text-[#637068] hover:text-[#1A2B22]"
          }`}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// ─── Table ────────────────────────────────────────────────────────────────────
export function Table({
  columns,
  rows,
  onRowClick,
}: {
  columns: { key: string; label: string; width?: string }[];
  rows: Record<string, React.ReactNode>[];
  onRowClick?: (row: Record<string, React.ReactNode>, i: number) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#DDE4DF]">
            {columns.map((col) => (
              <th
                key={col.key}
                className="text-left py-3 px-4 text-xs font-600 text-[#637068] uppercase tracking-wide font-semibold"
                style={col.width ? { width: col.width } : undefined}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className={`border-b border-[#F2F5F3] ${onRowClick ? "cursor-pointer hover:bg-[#F8FAFB]" : ""} transition-colors`}
              onClick={() => onRowClick?.(row, i)}
            >
              {columns.map((col) => (
                <td key={col.key} className="py-3.5 px-4 text-[#1A2B22]">
                  {row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
export function Modal({
  open,
  onClose,
  title,
  children,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  if (!open) return null;
  const sizes = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-2xl", xl: "max-w-4xl" };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full ${sizes[size]} flex flex-col max-h-[90vh]`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#DDE4DF]">
          <h2 className="text-lg font-bold text-[#1A2B22]">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[#637068] hover:bg-[#F2F5F3] hover:text-[#1A2B22]"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

// ─── Form Field ───────────────────────────────────────────────────────────────
export function Field({
  label,
  children,
  required,
  hint,
  error,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  hint?: string;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-[#1A2B22]">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-red-600 font-medium flex items-center gap-1 mt-0.5">
          <span>⚠</span> {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-[#637068]">{hint}</p>
      ) : null}
    </div>
  );
}

export function Input({
  placeholder,
  value,
  onChange,
  type = "text",
  hasError,
  disabled,
  className = "",
}: {
  placeholder?: string;
  value?: string;
  onChange?: (v: string) => void;
  type?: string;
  hasError?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      disabled={disabled}
      className={`w-full px-3 py-2 text-sm border rounded-lg text-[#1A2B22] placeholder-[#9BAD9F] focus:outline-none transition-colors ${
        disabled
          ? "bg-[#F2F5F3] border-[#DDE4DF] text-[#637068] cursor-not-allowed select-none"
          : hasError
          ? "border-red-400 bg-red-50/20 focus:border-red-500 focus:ring-1 focus:ring-red-400"
          : "border-[#DDE4DF] bg-white focus:border-[#1E6B3C] focus:ring-1 focus:ring-[#1E6B3C]"
      } ${className}`}
    />
  );
}

export function Select({
  options,
  value,
  onChange,
  placeholder,
  hasError,
  disabled,
  className = "",
}: {
  options: { value: string; label: string }[];
  value?: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  hasError?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      disabled={disabled}
      className={`w-full px-3 py-2 text-sm border rounded-lg text-[#1A2B22] focus:outline-none appearance-none cursor-pointer transition-colors ${
        disabled
          ? "bg-[#F2F5F3] border-[#DDE4DF] text-[#637068] cursor-not-allowed select-none"
          : hasError
          ? "border-red-400 bg-red-50/20 focus:border-red-500 focus:ring-1 focus:ring-red-400"
          : "border-[#DDE4DF] bg-white focus:border-[#1E6B3C] focus:ring-1 focus:ring-[#1E6B3C]"
      } ${className}`}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

export function Textarea({
  placeholder,
  value,
  onChange,
  rows = 3,
  hasError,
  disabled,
  className = "",
}: {
  placeholder?: string;
  value?: string;
  onChange?: (v: string) => void;
  rows?: number;
  hasError?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <textarea
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      rows={rows}
      disabled={disabled}
      className={`w-full px-3 py-2 text-sm border rounded-lg text-[#1A2B22] placeholder-[#9BAD9F] focus:outline-none resize-none transition-colors ${
        disabled
          ? "bg-[#F2F5F3] border-[#DDE4DF] text-[#637068] cursor-not-allowed select-none"
          : hasError
          ? "border-red-400 bg-red-50/20 focus:border-red-500 focus:ring-1 focus:ring-red-400"
          : "border-[#DDE4DF] bg-white focus:border-[#1E6B3C] focus:ring-1 focus:ring-[#1E6B3C]"
      } ${className}`}
    />
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, description, action }: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#EBF5EF] flex items-center justify-center mb-4 text-[#1E6B3C]">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-[#1A2B22] mb-2">{title}</h3>
      {description && <p className="text-sm text-[#637068] mb-4 max-w-xs">{description}</p>}
      {action}
    </div>
  );
}

// ─── Section divider ──────────────────────────────────────────────────────────
export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <h2 className="text-sm font-semibold text-[#637068] uppercase tracking-widest">{children}</h2>
      <div className="flex-1 h-px bg-[#DDE4DF]" />
    </div>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
export function Avatar({ name, size = "sm" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  const colors = ["#1E6B3C", "#D4930B", "#2563EB", "#7C3AED", "#BE185D"];
  const colorIndex = name.charCodeAt(0) % colors.length;
  const sizes = { sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-12 h-12 text-base" };
  return (
    <div
      className={`${sizes[size]} rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0`}
      style={{ backgroundColor: colors[colorIndex] }}
    >
      {initials}
    </div>
  );
}
