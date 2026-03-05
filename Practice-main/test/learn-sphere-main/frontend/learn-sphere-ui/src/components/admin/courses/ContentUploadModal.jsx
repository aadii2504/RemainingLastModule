import React, { useState } from "react";

export default function ContentUploadModal({
  courseId,
  chapterId,
  lessonId,
  onUpload,
  onClose,
  isLoading = false
}) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    order: 0,
    file: null,
    contentType: "video",
  });

  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const dropZoneRef = React.useRef(null);
  const fileInputRef = React.useRef(null);

  const contentTypeOptions = [
    { value: "video", label: "📹 Video", accept: ".mp4,.avi,.mov,.mkv,.webm" },
    { value: "audio", label: "🎵 Audio", accept: ".mp3,.wav,.aac,.flac" },
    { value: "document", label: "📄 Document", accept: ".pdf,.docx,.pptx,.xlsx" },
    { value: "image", label: "🖼️ Image", accept: ".jpg,.jpeg,.png,.gif,.webp" },
  ];

  const currentContentType = contentTypeOptions.find(
    (c) => c.value === formData.contentType
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "order" ? parseInt(value) || 0 : value,
    }));
    setError("");
  };

  const handleFileChange = (file) => {
    if (!file) return;

    // Validate file size (500MB max)
    if (file.size > 500 * 1024 * 1024) {
      setError("File size exceeds 500MB limit");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      file,
    }));

    // Show file preview
    const fileName = file.name;
    const fileSize = (file.size / 1024 / 1024).toFixed(2);
    setPreview({ name: fileName, size: fileSize });
    setError("");
  };

  const handleInputFileChange = (e) => {
    handleFileChange(e.target.files?.[0]);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.title.trim()) {
      setError("Title is required");
      return;
    }
    if (!formData.file) {
      setError("Please select a file");
      return;
    }

    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", formData.file);
      uploadFormData.append("title", formData.title);
      uploadFormData.append("description", formData.description);
      uploadFormData.append("contentType", formData.contentType);
      uploadFormData.append("order", formData.order);

      await onUpload(uploadFormData);
      setFormData({
        title: "",
        description: "",
        order: 0,
        file: null,
        contentType: "video",
      });
      setPreview(null);
    } catch (err) {
      setError(err.message || "Upload failed");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700 bg-slate-900/80 shrink-0">
          <h2 className="text-2xl font-bold text-white">Upload Lesson Content</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-red-600/20 hover:text-red-400 rounded-md transition text-slate-400"
            disabled={isLoading}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g., Introduction to React"
              className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              disabled={isLoading}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Add a brief description (optional)"
              rows="3"
              className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
              disabled={isLoading}
            />
          </div>

          {/* Content Type */}
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">
              Content Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {contentTypeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      contentType: option.value,
                    }))
                  }
                  className={`px-4 py-2 rounded-lg font-medium transition ${formData.contentType === option.value
                      ? "bg-blue-600 text-white border-2 border-blue-400"
                      : "bg-slate-800 text-slate-300 border-2 border-slate-600 hover:border-slate-500"
                    }`}
                  disabled={isLoading}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">
              File <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                ref={fileInputRef}
                type="file"
                id="file-input"
                onChange={handleInputFileChange}
                accept={currentContentType?.accept}
                className="hidden"
                disabled={isLoading}
              />
              <div
                ref={dropZoneRef}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`w-full px-4 py-8 border-2 border-dashed rounded-lg transition-all duration-200 cursor-pointer flex items-center justify-center ${
                  dragActive
                    ? "border-blue-400 bg-blue-500/20 shadow-lg shadow-blue-500/20"
                    : "border-slate-600 hover:border-blue-500 hover:bg-slate-800/50"
                }`}
              >
                <div className="text-center">
                  {preview ? (
                    <>
                      <div className="text-3xl mb-2">✓</div>
                      <p className="text-white font-medium">{preview.name}</p>
                      <p className="text-slate-400 text-sm">{preview.size} MB</p>
                    </>
                  ) : (
                    <>
                      <div className="text-3xl mb-2">📁</div>
                      <p className="text-slate-200 font-medium">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-slate-400 text-sm">
                        Max file size: 500MB
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Order */}
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">
              Order
            </label>
            <input
              type="number"
              name="order"
              value={formData.order}
              onChange={handleInputChange}
              min="0"
              className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              disabled={isLoading}
            />
            <p className="text-xs text-slate-400 mt-1">Used for sorting content</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-600/20 border border-red-600/50 rounded-lg text-red-300 text-sm">
              ⚠️ {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isLoading || !formData.file}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-400 text-white font-medium rounded-lg transition"
            >
              {isLoading ? "Uploading..." : "Upload Content"}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-lg transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
