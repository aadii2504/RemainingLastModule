import React, { useState } from "react";
import {
  FaPaperPlane,
  FaQuestionCircle,
  FaEnvelope,
  FaHeadset,
} from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";

export default function HelpPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "support",
    message: "",
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.message.trim()) return;

    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      toast.success("Message sent! Our team will get back to you shortly.", {
        position: "top-center",
        theme: "light",
      });
      setFormData({ name: "", email: "", subject: "support", message: "" });
      setLoading(false);
    }, 1200);
  };

  return (
    <div className="flex-1 flex flex-col min-h-[80vh] bg-slate-900 text-slate-100 overflow-hidden font-sans pt-10">
      <ToastContainer />

      {/* Background aesthetic blobs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl -z-10 pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>

      <div className="max-w-6xl mx-auto w-full px-6 py-12 flex flex-col items-center">
        <div className="text-center mb-16 relative z-10">
          <h1 className="text-4xl md:text-5xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400 drop-shadow-sm">
            How can we help you?
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Whether you have a question about courses, technical issues, or just
            want to report a bug, we're here to help.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 w-full relative z-10">
          {/* Info cards (Left) */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-800/60 backdrop-blur-xl border border-indigo-500/10 p-6 rounded-2xl shadow-xl hover:border-indigo-500/30 transition duration-300">
              <FaHeadset className="text-indigo-400 text-3xl mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">
                Support Options
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Our support team is available Monday through Friday, 9AM to 5PM
                EST to assist you with any inquiries.
              </p>
            </div>

            <div className="bg-slate-800/60 backdrop-blur-xl border border-violet-500/10 p-6 rounded-2xl shadow-xl hover:border-violet-500/30 transition duration-300">
              <FaQuestionCircle className="text-violet-400 text-3xl mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">FAQ</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Before reaching out, try checking our Community Help sections
                inside your courses for rapidly answered questions.
              </p>
            </div>
          </div>

          {/* Form container (Right) */}
          <div className="lg:col-span-2">
            <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-8 md:p-10 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Subject
                  </label>
                  <select
                    value={formData.subject}
                    onChange={(e) =>
                      setFormData({ ...formData, subject: e.target.value })
                    }
                    className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
                  >
                    <option value="support">Technical Support</option>
                    <option value="billing">Billing & Access</option>
                    <option value="courses">Course Questions</option>
                    <option value="other">Other Inquiry</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Your Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Your Email
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="johndoe@example.com"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    How can we help?
                  </label>
                  <textarea
                    required
                    rows="5"
                    placeholder="Describe your issue or question in detail..."
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition resize-none"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-indigo-600 to-violet-500 hover:from-indigo-500 hover:to-violet-400 text-white font-black py-4 rounded-xl flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] shadow-lg disabled:opacity-70 disabled:hover:scale-100"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      Send Message
                      <FaPaperPlane className="text-sm" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
