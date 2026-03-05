// components/admin/courses/CourseForm.jsx
import React from "react";
import SearchableSelect from "./SearchableSelect";
import { normalizeSlug } from "./slug";
import { VisualEditor } from "../../common/VisualEditor";
import { validateTitle } from "./titleValidator";

export default function CourseForm({
  form,
  setForm,
  errors,
  editing,
  onSave,
  onCancel,
  categoryOptions,
  canSave,
  titleRef,
}) {
  const fileInputRef = React.useRef(null);
  const dropZoneRef = React.useRef(null);
  const [dragActive, setDragActive] = React.useState(false);
  const [titleValidationWarning, setTitleValidationWarning] =
    React.useState("");

  const onChange = (e) => {
    const { name, value } = e.target;
    if (name === "students" || name === "price") {
      setForm((p) => ({ ...p, [name]: Number(value) }));
    } else if (name === "title") {
      // Validate title in real-time
      const validation = validateTitle(value);
      setTitleValidationWarning(validation.isValid ? "" : validation.error);
      setForm((p) => ({ ...p, [name]: value }));
    } else {
      setForm((p) => ({ ...p, [name]: value }));
    }
  };

  const handleFileChange = (file) => {
    if (!file) return;

    // Validate file is an image
    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setForm((p) => ({ ...p, thumbnail: e.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleDragEnter = React.useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragOver = React.useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
    setDragActive(true);
  }, []);

  const handleDragLeave = React.useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.target === dropZoneRef.current) {
      setDragActive(false);
    }
  }, []);

  const handleDrop = React.useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      handleFileChange(files[0]);
    }
  }, []);

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="mb-6 rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
      <h2 className="text-lg font-semibold mb-4">
        {editing === "new" ? "New Course" : "Edit Course"}
      </h2>
      <div className="space-y-3 max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm mb-1">Title</label>
          <input
            ref={titleRef}
            name="title"
            value={form.title}
            onChange={onChange}
            className="w-full rounded-md px-3 py-2 bg-black/20 border border-white/15"
            placeholder="Course title (no special characters)"
          />
          {titleValidationWarning && (
            <small className="text-blue-300 text-xs mt-1 block">
              {titleValidationWarning}
            </small>
          )}
          {errors.title && (
            <small className="text-red-400 text-sm block">{errors.title}</small>
          )}
          <p className="text-xs text-white/40 mt-1">
            Allowed characters: letters, numbers, spaces, hyphens (-),
            apostrophes ('), periods (.), and ampersands (&)
          </p>
        </div>

        <div>
          <label className="block text-sm mb-1">Slug</label>
          <div className="flex gap-2">
            <input
              name="slug"
              value={form.slug}
              onChange={onChange}
              className="flex-1 rounded-md px-3 py-2 bg-black/20 border border-white/15"
              placeholder="course-slug"
            />
            <button
              type="button"
              onClick={() => {
                if (form.title.trim()) {
                  setForm((p) => ({
                    ...p,
                    slug: normalizeSlug(form.title),
                  }));
                }
              }}
              className="px-3 py-2 rounded-md bg-blue-600/30 border border-blue-500/50 text-sm hover:bg-blue-600/50"
            >
              Generate
            </button>
          </div>
          {errors.slug && (
            <small className="text-red-400 text-sm">{errors.slug}</small>
          )}
          {form.slug && (
            <small className="block mt-1 text-[var(--text)]/60">
              Preview URL: /courses/{normalizeSlug(form.slug || form.title)}
            </small>
          )}
        </div>

        <div>
          <label className="block text-sm mb-1">Duration (e.g., 4 weeks)</label>
          <input
            name="duration"
            value={form.duration}
            onChange={onChange}
            className="w-full rounded-md px-3 py-2 bg-black/20 border border-white/15"
            placeholder="4 weeks"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm mb-1">Summary</label>
          <input
            name="summary"
            value={form.summary}
            onChange={onChange}
            className="w-full rounded-md px-3 py-2 bg-black/20 border border-white/15"
            placeholder="Brief one-line description"
          />
          {errors.summary && (
            <small className="text-red-400 text-sm">{errors.summary}</small>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm sm:text-base mb-2">
            Thumbnail Image
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleFileChange(e.target.files?.[0])}
            className="hidden"
          />
          {form.thumbnail ? (
            <div className="relative w-full max-w-xs sm:max-w-sm md:max-w-md rounded-lg overflow-hidden border border-white/15">
              <img
                src={form.thumbnail}
                alt="Thumbnail preview"
                className="w-full h-32 sm:h-40 md:h-48 object-cover"
                onError={(e) => (e.target.style.display = "none")}
              />
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, thumbnail: "" }))}
                className="absolute top-1 right-1 sm:top-2 sm:right-2 p-0.5 sm:p-1 bg-red-600 hover:bg-red-700 rounded-full text-white text-xs sm:text-sm"
                title="Remove image"
              >
                ✕
              </button>
            </div>
          ) : (
            <div
              ref={dropZoneRef}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={triggerFileInput}
              className={`w-full rounded-lg border-2 border-dashed p-4 sm:p-6 md:p-8 transition-all duration-200 cursor-pointer flex flex-col items-center justify-center min-h-32 sm:min-h-40 md:min-h-48 ${
                dragActive
                  ? "border-blue-400 bg-blue-500/30 shadow-lg shadow-blue-500/20"
                  : "border-white/30 bg-white/5 hover:bg-white/10"
              }`}
            >
              <svg
                className="w-6 sm:w-7 md:w-8 h-6 sm:h-7 md:h-8 mb-2 text-white/70"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-xs sm:text-sm font-medium text-white">
                Drag and drop your image here
              </p>
              <p className="text-xs text-white/60 mt-1">or click to browse</p>
            </div>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="text-sm font-medium opacity-70 block mb-2">
            Detailed Description (Visual Editor)
          </label>
          <VisualEditor
            value={form.description}
            onChange={(val) => setForm((f) => ({ ...f, description: val }))}
            placeholder="Describe your course in detail..."
          />
          <p className="mt-2 text-[10px] opacity-40 italic">
            Formatting is applied directly in the editor above.
          </p>
          {errors.description && (
            <small className="text-yellow-300 text-sm">
              {errors.description}
            </small>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm mb-1">Categories</label>
          <SearchableSelect
            value={form.categories}
            onChange={(cats) => setForm((p) => ({ ...p, categories: cats }))}
            options={categoryOptions}
            placeholder="Select categories..."
          />

          {errors.categories && (
            <div className="mt-1 text-xs text-red-400">{errors.categories}</div>
          )}
        </div>

        <div>
          <label className="block text-sm mb-1">Level</label>
          <select
            name="level"
            value={form.level}
            onChange={onChange}
            className="w-full rounded-md px-3 py-2 bg-black/20 border border-white/15"
          >
            <option>beginner</option>
            <option>intermediate</option>
            <option>advanced</option>
          </select>
        </div>

        <div>
          <label className="block text-sm mb-1">Price (0 or Free)</label>
          <div className="flex items-center gap-2">
            <input
              name="price"
              type="number"
              value={form.price}
              onChange={onChange}
              className="flex-1 rounded-md px-3 py-2 bg-black/20 border border-white/15"
              disabled
            />
            <span className="text-sm text-[var(--text)]/70">Free</span>
          </div>
        </div>

        <div>
          <label className="block text-sm mb-1">Status</label>
          <select
            name="status"
            value={form.status}
            onChange={onChange}
            className="w-full rounded-md px-3 py-2 bg-black/20 border border-white/15"
          >
            <option>published</option>
            <option>draft</option>
            <option>archived</option>
          </select>
        </div>

        <div className="md:col-span-2 flex gap-2 pt-2">
          <button
            onClick={onSave}
            disabled={!canSave}
            className={`px-3 py-2 rounded-md text-white ${
              canSave ? "bg-indigo-600" : "bg-indigo-600/40 cursor-not-allowed"
            }`}
          >
            Save
          </button>
          <button
            onClick={onCancel}
            className="px-3 py-2 rounded-md border border-[var(--border)]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
