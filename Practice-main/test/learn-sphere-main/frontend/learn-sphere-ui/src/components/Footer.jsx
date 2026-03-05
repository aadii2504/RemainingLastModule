import React from "react";

export const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer
      className="
        w-full
        border-t border-[var(--border)]
        bg-[var(--card)]
        text-center text-[var(--text)]/70
        px-4 py-6
      "
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <p>© {year} LearnSphere</p>
        <nav className="mt-2 flex gap-3 text-sm">
          <a href="/about" className="hover:underline">About</a>
          <a href="/contact" className="hover:underline">Contact</a>
        </nav>
      </div>
    </footer>
  );
};