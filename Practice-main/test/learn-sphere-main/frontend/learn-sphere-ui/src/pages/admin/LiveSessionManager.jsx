import React, { useState, useEffect, useRef } from "react";
import { liveSessionApi, courseApi } from "../../api/courseApi";
import { toast } from "react-toastify";
import { FaPlus, FaTrash, FaEdit, FaVideo } from "react-icons/fa";

const LiveSessionManager = () => {
  const [sessions, setSessions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    videoUrl: "",
    thumbnailUrl: "",
    startTime: "",
    endTime: "",
    courseId: "",
    videoFile: null,
    thumbnailFile: null,
  });

  const [videoPreview, setVideoPreview] = useState(null);
  const [thumbPreview, setThumbPreview] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [s, c] = await Promise.all([
        liveSessionApi.getAll(),
        courseApi.getAll(),
      ]);
      setSessions(s);
      setCourses(c);
    } catch (err) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
      const start = new Date(formData.startTime);
      const end = new Date(formData.endTime);
      const now = new Date();

      if (!editingSession && start < new Date(now.getTime() - 60000)) {
        toast.error("Start time cannot be in the past");
        return;
      }

      if (end <= start) {
        toast.error("End time must be after start time");
        return;
      }

      data.append("title", formData.title);
      data.append("description", formData.description || "");
      data.append("startTime", start.toISOString());
      data.append("endTime", end.toISOString());
      if (formData.courseId) data.append("courseId", formData.courseId);

      if (formData.videoFile) {
        data.append("videoFile", formData.videoFile);
      } else {
        data.append("videoUrl", formData.videoUrl || "");
      }

      if (formData.thumbnailFile) {
        data.append("thumbnailFile", formData.thumbnailFile);
      } else {
        data.append("thumbnailUrl", formData.thumbnailUrl || "");
      }

      if (editingSession) {
        await liveSessionApi.update(editingSession.id, data);
        // toast.success("Session updated");
      } else {
        await liveSessionApi.create(data);
        // toast.success("Session created");
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      toast.error(
        err.response?.data?.error || err.message || "Operation failed"
      );
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await liveSessionApi.delete(id);
      toast.success("Session deleted");
      loadData();
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  const normalizeDate = (isoString) => {
    if (!isoString) return new Date();
    const s = String(isoString);
    const normalized =
      s.includes("Z") || s.includes("+") || (s.includes("-") && s.indexOf("-", 5) > 0)
        ? s
        : s + "Z";
    return new Date(normalized);
  };

  const formatDateTime = (dateString) => {
    const d = normalizeDate(dateString);
    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const toLocalISOString = (dateString) => {
    if (!dateString) return "";
    const date = normalizeDate(dateString);
    const tzOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  const openModal = (session = null) => {
    setVideoPreview(null);
    setThumbPreview(null);
    if (session) {
      setEditingSession(session);
      setFormData({
        title: session.title,
        description: session.description || "",
        videoUrl: session.videoUrl,
        thumbnailUrl: session.thumbnailUrl || "",
        startTime: toLocalISOString(session.startTime),
        endTime: toLocalISOString(session.endTime),
        courseId: session.courseId || "",
        videoFile: null,
        thumbnailFile: null,
      });
      if (session.videoUrl)
        setVideoPreview({ name: "Current Video", size: "remote" });
      if (session.thumbnailUrl)
        setThumbPreview({ name: "Current Thumbnail", size: "remote" });
    } else {
      setEditingSession(null);
      setFormData({
        title: "",
        description: "",
        videoUrl: "",
        thumbnailUrl: "",
        startTime: "",
        endTime: "",
        courseId: "",
        videoFile: null,
        thumbnailFile: null,
      });
    }
    setShowModal(true);
  };

  const FileDropZone = ({ label, type, preview, onFileSelect }) => {
    const [dragActive, setDragActive] = useState(false);
    const inputRef = useRef(null);

    const handleFile = (file) => {
      if (!file) return;
      onFileSelect(file);
    };

    return (
      <div className="col-span-2 md:col-span-1">
        <label className="block text-xs font-black uppercase text-white/40 mb-2">
          {label}
        </label>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            handleFile(e.dataTransfer.files[0]);
          }}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${dragActive
              ? "border-indigo-500 bg-indigo-500/10"
              : "border-white/10 hover:border-white/20 hover:bg-white/5"
            }`}
        >
          <input
            type="file"
            ref={inputRef}
            className="hidden"
            accept={type === "video" ? "video/*" : "image/*"}
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          {preview ? (
            <div className="flex flex-col items-center">
              <span className="text-indigo-400 text-xl mb-1">✓</span>
              <p className="text-[10px] font-bold truncate max-w-full">
                {preview.name}
              </p>
            </div>
          ) : (
            <div className="py-2">
              <p className="text-[10px] text-white/60">
                Drag &amp; drop or <span className="text-indigo-400">browse</span>
              </p>
              <p className="text-[8px] text-white/20 mt-1">
                {type === "video" ? "MP4, MKV..." : "JPG, PNG..."}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto text-white">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black">Live Session Manager</h1>
          <p className="text-white/40">Schedule and upload timed content</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/20"
        >
          <FaPlus /> Schedule New Session
        </button>
      </div>

      {loading ? (
        <p className="text-white/60">Loading...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.map((s) => (
            <div
              key={s.id}
              className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden group hover:border-indigo-500/50 transition-all"
            >
              <div
                className="h-40 bg-zinc-900 bg-cover bg-center relative"
                style={{ backgroundImage: `url(${s.thumbnailUrl || ""})` }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <span className="bg-indigo-600 text-[10px] font-black uppercase px-2 py-1 rounded mb-2 inline-block">
                    {courses.find((c) => c.id === s.courseId)?.title || "General"}
                  </span>
                  <h3 className="font-bold line-clamp-1">{s.title}</h3>
                </div>
              </div>
              <div className="p-4">
                <div className="flex justify-between items-center text-xs text-white/60 mb-4">
                  <span>{formatDateTime(s.startTime)}</span>
                  <span className="text-indigo-400">
                    {Math.round(
                      (normalizeDate(s.endTime) - normalizeDate(s.startTime)) / 60000
                    )}{" "}
                    mins
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openModal(s)}
                    className="flex-1 flex items-center justify-center gap-2 p-2 bg-white/5 hover:bg-white/10 rounded-lg transition"
                  >
                    <FaEdit size={12} /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="p-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg transition"
                  >
                    <FaTrash size={12} />
                  </button>
                  <a
                    href={`/session/${s.id}`}
                    className="p-2 bg-indigo-500/10 hover:bg-indigo-500 text-indigo-400 hover:text-white rounded-lg transition"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FaVideo size={12} />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-white/10 flex justify-between items-center shrink-0">
              <h2 className="text-2xl font-black">
                {editingSession ? "Edit Session" : "Schedule Session"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-white/40 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 grid grid-cols-2 gap-6 overflow-y-auto">
              <div className="col-span-2 text-center text-[10px] bg-indigo-500/10 border border-indigo-500/20 py-1 rounded text-indigo-400 uppercase font-black">
                Basic Information
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-black uppercase text-white/40 mb-2">
                  Title
                </label>
                <input
                  required
                  className="w-full bg-black border border-white/10 rounded-xl p-3 focus:border-indigo-500 outline-none transition"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-black uppercase text-white/40 mb-2">
                  Description
                </label>
                <textarea
                  className="w-full bg-black border border-white/10 rounded-xl p-3 focus:border-indigo-500 outline-none transition h-20"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              <div className="col-span-2 text-center text-[10px] bg-indigo-500/10 border border-indigo-500/20 py-1 rounded text-indigo-400 uppercase font-black mt-2">
                Content Assets
              </div>

              <FileDropZone
                label="Video File"
                type="video"
                preview={videoPreview}
                onFileSelect={(file) => {
                  setFormData({ ...formData, videoFile: file });
                  setVideoPreview({
                    name: file.name,
                    size: (file.size / 1024 / 1024).toFixed(2) + "MB",
                  });
                }}
              />

              <FileDropZone
                label="Thumbnail Image"
                type="image"
                preview={thumbPreview}
                onFileSelect={(file) => {
                  setFormData({ ...formData, thumbnailFile: file });
                  setThumbPreview({
                    name: file.name,
                    size: (file.size / 1024 / 1024).toFixed(2) + "MB",
                  });
                }}
              />

              <div className="col-span-2 text-center text-[10px] bg-indigo-500/10 border border-indigo-500/20 py-1 rounded text-indigo-400 uppercase font-black mt-2">
                Scheduling &amp; Linking
              </div>

              <div className="col-span-2 md:col-span-1">
                <label className="block text-xs font-black uppercase text-white/40 mb-2">
                  Start Time
                </label>
                <input
                  required
                  type="datetime-local"
                  style={{ colorScheme: "dark" }}
                  className="w-full bg-black border border-white/10 rounded-xl p-3 focus:border-indigo-500 outline-none transition"
                  value={formData.startTime}
                  min={toLocalISOString(new Date().toISOString())}
                  onChange={(e) =>
                    setFormData({ ...formData, startTime: e.target.value })
                  }
                />
              </div>

              <div className="col-span-2 md:col-span-1">
                <label className="block text-xs font-black uppercase text-white/40 mb-2">
                  End Time
                </label>
                <input
                  required
                  type="datetime-local"
                  style={{ colorScheme: "dark" }}
                  className="w-full bg-black border border-white/10 rounded-xl p-3 focus:border-indigo-500 outline-none transition"
                  value={formData.endTime}
                  min={formData.startTime || toLocalISOString(new Date().toISOString())}
                  onChange={(e) =>
                    setFormData({ ...formData, endTime: e.target.value })
                  }
                />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-black uppercase text-white/40 mb-2">
                  Link to Course
                </label>
                <select
                  className="w-full bg-black border border-white/10 rounded-xl p-3 focus:border-indigo-500 outline-none transition"
                  value={formData.courseId}
                  onChange={(e) =>
                    setFormData({ ...formData, courseId: e.target.value })
                  }
                >
                  <option value="">None (General Session)</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-2 pt-4">
                <button
                  type="submit"
                  className="w-full py-4 bg-indigo-600 rounded-xl font-bold hover:bg-indigo-500 transition shadow-xl shadow-indigo-600/20"
                >
                  {editingSession ? "Save Changes" : "Create Session"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveSessionManager;