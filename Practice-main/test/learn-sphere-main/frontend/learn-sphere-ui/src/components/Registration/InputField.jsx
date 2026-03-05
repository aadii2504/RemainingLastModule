import React, { useState } from "react";
import { HiOutlineEye, HiOutlineEyeOff } from "react-icons/hi";

export const InputField = ({
  label,
  name,
  type = "text",
  value,
  onChange,
  error,
  placeholder,
  required = false,
  disabled = false,
  className = "",
}) => {
  const [show, setShow] = useState(false);
  const errorId = error ? `${name}-error` : undefined;
  const inputType = type === "password" ? (show ? "text" : "password") : type;

  return (
    <div className="mb-4">
      <label
        htmlFor={name}
        className="block text-sm font-medium text-slate-200 mb-1"
      >
        {label}
      </label>

      <div className="relative">
        <input
          id={name}
          name={name}
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={errorId}
          autoComplete={name}
          className={[
            "w-full rounded-lg bg-black/20 text-slate-100",
            "border px-3 py-2 outline-none",
            error
              ? "border-red-500 focus:ring-2 focus:ring-red-400"
              : "border-white/15 focus:ring-2 focus:ring-blue-500",
            "placeholder:text-slate-400",
            type === "password" ? "pr-10" : "",
            className,
          ].join(" ")}
        />

        {type === "password" && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Hide password" : "Show password"}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-200"
          >
            {show ? <HiOutlineEyeOff size={18} /> : <HiOutlineEye size={18} />}
          </button>
        )}
      </div>

      {Array.isArray(error) ? (
        <ul
          id={errorId}
          className="mt-1 text-sm text-red-400 list-disc list-inside"
        >
          {error.map((msg, idx) => (
            <li key={idx}>{msg}</li>
          ))}
        </ul>
      ) : (
        error && (
          <small id={errorId} className="mt-1 block text-sm text-red-400">
            {error}
          </small>
        )
      )}
    </div>
  );
};
