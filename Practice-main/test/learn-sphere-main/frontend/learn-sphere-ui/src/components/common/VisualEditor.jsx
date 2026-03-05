import React, { useRef, useEffect, useState } from "react";

/**
 * VisualEditor (WYSIWYG)
 * Replaces the markdown-based editor with a direct visual experience.
 * Applies rich text formatting using contentEditable.
 */
export const VisualEditor = ({ value, onChange, placeholder }) => {
  const editorRef = useRef(null);
  const [localContent, setLocalContent] = useState(value || "");

  // Sync state to editor only on initial mount or if value is significantly different
  // (to avoid cursor jumps)
  useEffect(() => {
    if (editorRef.current && value !== undefined && value !== null) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value;
        setLocalContent(value);
      }
    }
  }, []);

  const handleInput = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      setLocalContent(content);
      onChange(content);
    }
  };

  const handlePaste = (e) => {
    // Allow paste, but let the editor handle it normally
    e.preventDefault();
    const text =
      e.clipboardData?.getData("text/html") ||
      e.clipboardData?.getData("text/plain");
    if (text) {
      document.execCommand("insertHTML", false, text);
      handleInput();
    }
  };

  const exec = (cmd, val = null) => {
    document.execCommand(cmd, false, val);
    editorRef.current?.focus();
    handleInput();
  };

  const btnClass =
    "px-3 py-1.5 rounded-md text-xs bg-white/5 hover:bg-white/10 border border-white/5 text-white/80 hover:text-white transition-all font-semibold active:bg-white/20";

  return (
    <div className="flex flex-col gap-2">
      {/* Toolbar */}
      <div className="flex gap-1.5 p-2 rounded-t-lg bg-white/5 border border-white/10 flex-wrap">
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => exec("bold")}
          className={`${btnClass} font-bold`}
          title="Bold (Ctrl+B)"
        >
          B
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => exec("italic")}
          className={`${btnClass} italic`}
          title="Italic (Ctrl+I)"
        >
          I
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => exec("underline")}
          className={`${btnClass} underline`}
          title="Underline (Ctrl+U)"
        >
          U
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => exec("strikeThrough")}
          className={`${btnClass} line-through`}
          title="Strikethrough"
        >
          S
        </button>
        <div className="w-[1px] h-6 bg-white/10 mx-1" />
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => exec("formatBlock", "h1")}
          className={btnClass}
          title="Heading 1"
        >
          H1
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => exec("formatBlock", "h2")}
          className={btnClass}
          title="Heading 2"
        >
          H2
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => exec("formatBlock", "h3")}
          className={btnClass}
          title="Heading 3"
        >
          H3
        </button>
        <div className="w-[1px] h-6 bg-white/10 mx-1" />
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => exec("insertUnorderedList")}
          className={btnClass}
          title="Bullet List"
        >
          • List
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => exec("insertOrderedList")}
          className={btnClass}
          title="Numbered List"
        >
          1. List
        </button>
        <div className="w-[1px] h-6 bg-white/10 mx-1" />
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            const url = prompt("Enter URL:");
            if (url) exec("createLink", url);
          }}
          className={btnClass}
          title="Link"
        >
          🔗 Link
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => exec("removeFormat")}
          className={btnClass}
          title="Clear Formatting"
        >
          Clear
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => exec("undo")}
          className={btnClass}
          title="Undo"
        >
          ↶ Undo
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => exec("redo")}
          className={btnClass}
          title="Redo"
        >
          ↷ Redo
        </button>
      </div>

      {/* Editable Area with Rich Formatting */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onPaste={handlePaste}
        className="w-full min-h-[300px] h-[400px] bg-white/5 border border-white/10 border-t-0 rounded-b-lg p-6 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none overflow-y-auto text-white/90 leading-relaxed"
        data-placeholder={placeholder}
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(255,255,255,0.2) transparent",
        }}
      />

      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: rgba(255,255,255,0.3);
          pointer-events: none;
        }
        
        /* Rich text formatting styles */
        [contenteditable] h1 { 
          font-size: 1.875rem; 
          font-weight: 800; 
          margin-top: 1.5rem; 
          margin-bottom: 0.75rem; 
          color: #fff;
          line-height: 1.2;
        }
        [contenteditable] h2 { 
          font-size: 1.5rem; 
          font-weight: 700; 
          margin-top: 1.25rem; 
          margin-bottom: 0.5rem; 
          color: #fff;
          line-height: 1.3;
        }
        [contenteditable] h3 { 
          font-size: 1.25rem; 
          font-weight: 600; 
          margin-top: 1rem; 
          margin-bottom: 0.5rem; 
          color: #fff;
          line-height: 1.4;
        }
        [contenteditable] strong { 
          color: #fff; 
          font-weight: 700; 
        }
        [contenteditable] em { 
          font-style: italic;
          color: #e0e7ff;
        }
        [contenteditable] u { 
          text-decoration: underline;
          text-decoration-color: #818cf8;
          text-decoration-thickness: 2px;
        }
        [contenteditable] del { 
          text-decoration: line-through;
          color: #9ca3af;
        }
        [contenteditable] a { 
          color: #818cf8; 
          text-decoration: underline;
          cursor: pointer;
        }
        [contenteditable] a:hover { 
          color: #a5b4fc;
          text-decoration: none;
        }
        [contenteditable] ul { 
          list-style-type: disc; 
          margin-left: 1.5rem;
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
        }
        [contenteditable] ol { 
          list-style-type: decimal; 
          margin-left: 1.5rem;
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
        }
        [contenteditable] li { 
          margin-bottom: 0.25rem;
          line-height: 1.6;
        }
        [contenteditable] blockquote {
          border-left: 4px solid #818cf8;
          padding-left: 1rem;
          color: #d1d5db;
          font-style: italic;
          margin-left: 0;
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
        }
        [contenteditable] p {
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
          line-height: 1.6;
        }
        [contenteditable]:focus {
          outline: none;
        }
        
        /* Scrollbar styling */
        [contenteditable]::-webkit-scrollbar {
          width: 8px;
        }
        [contenteditable]::-webkit-scrollbar-track {
          background: transparent;
        }
        [contenteditable]::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
        }
        [contenteditable]::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </div>
  );
};
