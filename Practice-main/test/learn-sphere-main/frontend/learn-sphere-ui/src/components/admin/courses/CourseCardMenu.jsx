
// components/admin/courses/CourseCardMenu.jsx
import React from "react";

export default function CourseCardMenu({ course, onEdit, onDelete }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const menuRef = React.useRef(null);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-2 hover:bg-white/10 rounded-md transition"
        title="More actions"
      >
        <span className="text-lg">⋮</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-48 bg-black/80 border border-white/15 rounded-md shadow-lg z-50">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(course);
              setIsOpen(false);
            }}
            className="w-full text-left px-4 py-2 text-sm hover:bg-white/10 transition first:rounded-t-md"
          >
            Edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(course.id);
              setIsOpen(false);
            }}
            className="w-full text-left px-4 py-2 text-sm hover:bg-red-600/20 text-red-400 transition last:rounded-b-md"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
``
