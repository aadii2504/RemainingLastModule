import { useState, useEffect } from "react";

export const PAcademic = () => {
  const [rollNumber, setRollNumber] = useState(
    () => localStorage.getItem("studentRollNumber") || "",
  );
  const [course, setCourse] = useState(
    () => localStorage.getItem("studentCourse") || "",
  );
  const [year, setYear] = useState(
    () => localStorage.getItem("studentYear") || "",
  );

  useEffect(() => {
    localStorage.setItem("studentRollNumber", rollNumber);
    localStorage.setItem("studentCourse", course);
    localStorage.setItem("studentYear", year);
  }, [rollNumber, course, year]);

  const fieldClass =
    "w-full rounded-md px-3 py-2 mb-3 bg-[var(--card)] border border-[var(--border)] text-[var(--text)]";

  return (
    <section className="mb-8 max-w-3xl">
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-[var(--text)]">
            Academic Information
          </h3>
          <p className="text-sm text-[var(--text)]/80">
            School / college details
          </p>
        </div>

        <input
          type="text"
          placeholder="Roll Number"
          value={rollNumber}
          onChange={(e) => setRollNumber(e.target.value)}
          title="Roll number can include letters, numbers, and - _ /"
          className={fieldClass}
          required
        />

        <select
          value={course}
          onChange={(e) => setCourse(e.target.value)}
          className={fieldClass}
          required
        >
          <option value="">Select Course</option>
          <option>B.E. Computer Science</option>
          <option>B.Tech Information Technology</option>
          <option>B.E. Electronics</option>
          <option>B.Com</option>
          <option>B.Sc</option>
          <option>Other</option>
        </select>

        <input
          type="number"
          placeholder="Year (e.g., 1–5)"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          min={1}
          max={5}
          className={fieldClass}
          required
        />
      </div>
    </section>
  );
};
