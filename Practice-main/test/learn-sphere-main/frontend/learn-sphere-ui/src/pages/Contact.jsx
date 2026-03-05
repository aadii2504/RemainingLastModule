import React, { useState } from "react";

export default function Contact() {
  const [status, setStatus] = useState("");

  const onSubmit = (e) => {
    e.preventDefault();
    setStatus("Thanks — your message was submitted (mock).");
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold mb-4">Contact Us</h1>

      <p className="text-[var(--text)]/80 mb-6">
        Have questions or feedback? Send us a message.
      </p>

      <form onSubmit={onSubmit} className="max-w-lg space-y-4">
        <label className="block">
          <span className="text-sm">Name</span>
          <input
            required
            className="w-full rounded-md px-3 py-2 mt-1 bg-[var(--card)] border border-[var(--border)]"
          />
        </label>

        <label className="block">
          <span className="text-sm">Email</span>
          <input
            type="email"
            required
            className="w-full rounded-md px-3 py-2 mt-1 bg-[var(--card)] border border-[var(--border)]"
          />
        </label>

        <label className="block">
          <span className="text-sm">Message</span>
          <textarea
            required
            className="w-full rounded-md px-3 py-2 mt-1 h-28 bg-[var(--card)] border border-[var(--border)]"
          />
        </label>

        <div>
          <button className="px-4 py-2 rounded-md bg-indigo-600 text-white">
            Send Message
          </button>
        </div>

        {status && <div className="text-sm text-green-400">{status}</div>}
      </form>
    </div>
  );
}
