import { Link } from "react-router-dom";

export function Btn({ children, variant = "primary", className = "", ...rest }) {
  const base =
    "inline-flex items-center justify-center px-4 py-2.5 text-[15px] font-medium rounded-[6px] transition border disabled:opacity-50";
  const styles =
    variant === "secondary"
      ? "bg-white text-primary border-primary hover:bg-[#EFF6FF]"
      : variant === "ghost"
        ? "bg-transparent border-transparent text-body hover:bg-surface"
        : "bg-primary text-white border-primary hover:bg-blue-700";
  return (
    <button type="button" className={`${base} ${styles} ${className}`} {...rest}>
      {children}
    </button>
  );
}

export function BtnLink({ to, variant = "primary", className = "", children, ...rest }) {
  const base =
    "inline-flex items-center justify-center px-4 py-2.5 text-[15px] font-medium rounded-[6px] transition border text-center";
  const styles =
    variant === "secondary"
      ? "bg-white text-primary border-primary hover:bg-[#EFF6FF]"
      : "bg-primary text-white border-primary hover:bg-blue-700";
  return (
    <Link to={to} className={`${base} ${styles} ${className}`} {...rest}>
      {children}
    </Link>
  );
}

export function ConditionBadge({ condition }) {
  const c = String(condition || "EXCELLENT").toUpperCase();
  const map = {
    EXCELLENT: { label: "Excellent", cls: "bg-[#ECFDF3] text-excellent border-[#BBF7D0]" },
    GOOD: { label: "Good", cls: "bg-[#EFF6FF] text-good border-[#BFDBFE]" },
    FAIR: { label: "Fair", cls: "bg-[#FFFBEB] text-fair border-[#FDE68A]" },
  };
  const m = map[c] || map.EXCELLENT;
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${m.cls}`}>{m.label}</span>
  );
}
