// components/admin/courses/SearchableSelect.jsx
import React from "react";

export default function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = "Select categories...",
  noScrollLock = false, // set to true if you don't want body scroll lock
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(0); // keyboard focus
  const triggerRef = React.useRef(null);
  const dropdownRef = React.useRef(null);
  const listRef = React.useRef(null);

  // --- Derived data ---
  const normalizedValue = Array.isArray(value) ? value : [];
  const normalizedOptions = Array.isArray(options) ? options : [];
  const filtered = normalizedOptions.filter((opt) =>
    opt.toLowerCase().includes(search.toLowerCase()),
  );

  // --- Helpers ---
  const isSelected = (option) => normalizedValue.includes(option);

  const toggleOption = (option) => {
    if (isSelected(option)) {
      onChange(normalizedValue.filter((v) => v !== option));
    } else {
      onChange([...normalizedValue, option]);
    }
  };

  const removeOption = (option) => {
    onChange(normalizedValue.filter((v) => v !== option));
  };

  const clearAll = () => {
    onChange([]);
  };

  // --- Open / close behavior ---
  const open = () => {
    setIsOpen(true);
    setSearch("");
    setActiveIndex(0);
  };

  const close = () => {
    setIsOpen(false);
    setSearch("");
    setActiveIndex(0);
    // Return focus to trigger for accessibility
    setTimeout(() => {
      triggerRef.current?.focus();
    }, 0);
  };

  // Click outside to close
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (!isOpen) return;
      const el = dropdownRef.current;
      if (el && !el.contains(event.target)) {
        close();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Optionally lock body scroll when open to prevent scroll bleed
  React.useEffect(() => {
    if (!isOpen || noScrollLock) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [isOpen, noScrollLock]);

  // Auto-focus the search field when opened
  React.useEffect(() => {
    if (isOpen) {
      const input = dropdownRef.current?.querySelector("input[type='text']");
      input?.focus();
    }
  }, [isOpen]);

  // Keep active item visible when navigating with keyboard
  React.useEffect(() => {
    if (!isOpen || !listRef.current) return;
    const items = listRef.current.querySelectorAll("[data-option-index]");
    const active = items[activeIndex];
    if (active && active.scrollIntoView) {
      active.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex, isOpen]);

  // --- Keyboard handling on trigger ---
  const onTriggerKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      open();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      open();
      setActiveIndex(0);
    }
  };

  // --- Keyboard handling within dropdown ---
  const onDropdownKeyDown = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[activeIndex]) {
        toggleOption(filtered[activeIndex]);
      }
      return;
    }
  };

  return (
    <div className="space-y-2">
      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => (isOpen ? close() : open())}
        onKeyDown={onTriggerKeyDown}
        className="w-full rounded-md px-3 py-2 bg-black/20 border border-white/15 text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-indigo-400"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span>
          {normalizedValue.length > 0
            ? `${normalizedValue.length} selected`
            : placeholder}
        </span>
        <span aria-hidden="true">▾</span>
      </button>

      {/* Selected chips */}
      {normalizedValue.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {normalizedValue.map((cat) => (
            <span
              key={cat}
              className="inline-flex items-center gap-2 px-2 py-1 rounded bg-indigo-600/20 border border-indigo-500/40 text-indigo-200 text-xs"
            >
              {cat}
              <button
                type="button"
                onClick={() => removeOption(cat)}
                className="hover:text-indigo-100 focus:outline-none"
                aria-label={`Remove ${cat}`}
                title="Remove"
              >
                ✕
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={clearAll}
            className="text-xs text-white/70 hover:text-white px-2 py-1"
            title="Clear all"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="relative"
          onKeyDown={onDropdownKeyDown}
          role="dialog"
          aria-label="Select categories"
        >
          <div className="absolute z-50 mt-1 w-full rounded-md bg-black/90 border border-white/15 shadow-lg">
            {/* Search input */}
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                // Reset active index when filter changes
                setActiveIndex(0);
              }}
              className="w-full px-3 py-2 bg-black/20 border-b border-white/15 rounded-t-md text-sm focus:outline-none"
              placeholder="Search category..."
              aria-label="Search category"
            />

            {/* Options list */}
            <ul
              ref={listRef}
              role="listbox"
              aria-multiselectable="true"
              className="max-h-48 overflow-auto py-1"
            >
              {filtered.length > 0 ? (
                filtered.map((option, i) => {
                  const selected = isSelected(option);
                  const isActive = i === activeIndex;
                  return (
                    <li
                      key={option}
                      role="option"
                      aria-selected={selected}
                      data-option-index={i}
                      onMouseEnter={() => setActiveIndex(i)}
                      onClick={() => toggleOption(option)}
                      className={`flex items-center gap-2 px-3 py-2 text-sm cursor-pointer
                        ${isActive ? "bg-white/10" : ""}
                        ${selected ? "text-indigo-300" : "text-white/90"}
                        hover:bg-white/10`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleOption(option)}
                        className="rounded"
                        aria-hidden="true"
                      />
                      <span>{option}</span>
                    </li>
                  );
                })
              ) : (
                <li className="px-3 py-2 text-sm text-white/60">No results</li>
              )}
            </ul>

            {/* Footer actions */}
            <div className="flex items-center justify-between px-3 py-2 border-t border-white/10">
              <button
                type="button"
                onClick={close}
                className="px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-sm"
              >
                Done
              </button>
              <div className="text-xs text-white/50">
                ↑/↓ to navigate • Enter to select • Esc to close
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
