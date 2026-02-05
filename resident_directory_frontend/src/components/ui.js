import React from "react";

// PUBLIC_INTERFACE
export function Loading({ label = "Loading…" }) {
  /** Simple loading indicator. */
  return <div className="card">{label}</div>;
}

// PUBLIC_INTERFACE
export function ErrorBox({ error }) {
  /** Error presenter for API errors or string errors. */
  if (!error) return null;
  const text = typeof error === "string" ? error : error.message || "Error";
  return <div className="card"><div className="errorText">{text}</div></div>;
}

// PUBLIC_INTERFACE
export function TextField({ label, value, onChange, type = "text", placeholder, required }) {
  /** Controlled text input with label. */
  return (
    <div className="formRow">
      <div className="label">
        {label} {required ? <span className="errorText">*</span> : null}
      </div>
      <input
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        placeholder={placeholder}
        required={required}
      />
    </div>
  );
}

// PUBLIC_INTERFACE
export function TextArea({ label, value, onChange, placeholder }) {
  /** Controlled textarea with label. */
  return (
    <div className="formRow">
      <div className="label">{label}</div>
      <textarea
        className="textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

// PUBLIC_INTERFACE
export function SelectField({ label, value, onChange, options }) {
  /** Controlled select with label. */
  return (
    <div className="formRow">
      <div className="label">{label}</div>
      <select className="select" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// PUBLIC_INTERFACE
export function Button({ children, variant = "default", ...props }) {
  /** Button with app variants. */
  const cls =
    variant === "primary"
      ? "btn btnPrimary"
      : variant === "danger"
        ? "btn btnDanger"
        : variant === "ghost"
          ? "btn btnGhost"
          : "btn";
  return (
    <button className={cls} {...props}>
      {children}
    </button>
  );
}
