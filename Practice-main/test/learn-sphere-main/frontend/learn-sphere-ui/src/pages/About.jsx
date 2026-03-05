import React from "react";

export default function About() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold mb-4">About LearnSphere</h1>
      <p className="text-[var(--text)]/80 mb-4">
        LearnSphere is a beginner-friendly platform for mastering programming
        skills. We provide curated courses, hands-on projects and mentorship to
        help learners build practical experience. Our goal is to make
        high-quality technical education accessible and engaging.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">Our Mission</h2>
      <p className="text-[var(--text)]/80">
        To empower learners with the knowledge and tools they need to build
        real-world applications and pursue careers in software development.
      </p>
    </div>
  );
}
