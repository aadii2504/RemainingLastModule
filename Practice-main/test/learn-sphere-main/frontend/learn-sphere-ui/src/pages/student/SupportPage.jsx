import React, { useState } from "react";
import Sidebar from "../../components/Dashboard/Sidebar";
import { toast } from "react-toastify";

export default function SupportPage() {
  const [formData, setFormData] = useState({
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      toast.success(
        "Support ticket created successfully! We will get back to you soon.",
      );
      setFormData({ subject: "", message: "" });
    }, 1000);
  };

  return (
    <div className="flex min-h-[calc(100vh-80px)]">
      <aside className="w-16 md:w-64 transition-all duration-200 flex-shrink-0">
        <Sidebar />
      </aside>

      <main className="flex-1 w-full p-6 md:p-12 overflow-y-auto bg-black text-white flex flex-col justify-center items-center">
        <div className="w-full max-w-lg">
          <div className="mb-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-2xl mb-4 shadow-[0_0_30px_rgba(99,102,241,0.2)] ring-1 ring-indigo-500/30 mx-auto">
              💬
            </div>
            <h1 className="text-4xl font-black mb-2 tracking-tight">
              Help & Support
            </h1>
            <p className="text-white/50 text-lg">
              Having trouble? Reach out to our support team and we'll help you
              resolve your issue as soon as possible.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-white/70 mb-2 uppercase tracking-wider">
                  Subject
                </label>
                <input
                  type="text"
                  required
                  placeholder="E.g., Cannot access my course materials"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData({ ...formData, subject: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-white/70 mb-2 uppercase tracking-wider">
                  Message
                </label>
                <textarea
                  required
                  rows={6}
                  placeholder="Describe your issue in detail..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-none"
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={
                    loading ||
                    !formData.subject.trim() ||
                    !formData.message.trim()
                  }
                  className="w-full md:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                  ) : (
                    "Submit Support Ticket"
                  )}
                </button>
              </div>
            </form>
          </div>

          <div className="mt-12 p-6 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-start gap-4">
            <div className="text-blue-400 text-2xl">💡</div>
            <div>
              <h3 className="font-bold text-blue-300 mb-1">
                Check the Community!
              </h3>
              <p className="text-blue-200/70 text-sm">
                Before submitting a ticket, your question might already be
                answered in the Community Help section. Feel free to browse
                through the discussions.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
