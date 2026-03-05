
// components/admin/courses/CourseCard.jsx
import React from "react";
import CourseCardMenu from "./CourseCardMenu";

const CourseCard = React.forwardRef(function CourseCard(
  { course, highlight = false, onEdit, onDelete, onViewContent },
  ref
) {
  return (
    <article
      onClick={() => onViewContent(course)}
      ref={highlight ? ref : null}
      className={[
        "rounded-xl border overflow-hidden group flex flex-col transition-shadow cursor-pointer hover:shadow-xl",
        "hover:shadow-lg",
        highlight ? "ring-2 ring-indigo-500" : "",
      ].join(" ")}
      style={{
        borderColor: "var(--border)",
        background: "var(--card)",
      }}
    >
      {/* Thumbnail */}
      <div
        className="h-24 w-full bg-center bg-cover"
        style={{
          backgroundImage: course.thumbnail
            ? `url('${course.thumbnail}')`
            : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          backgroundColor: course.thumbnail ? "transparent" : "#667eea",
        }}
        aria-label={course.title}
      />

      {/* Body */}
      <div className="p-3 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-sm flex-1">{course.title}</h3>
          <CourseCardMenu course={course} onEdit={onEdit} onDelete={onDelete} />
        </div>

        <span
          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold whitespace-nowrap mb-1 w-fit ${
            course.status === "published"
              ? "bg-green-600/20 text-green-400"
              : course.status === "draft"
              ? "bg-yellow-600/20 text-yellow-400"
              : "bg-gray-600/20 text-gray-400"
          }`}
        >
          {course.status}
        </span>

        <p className="text-xs text-[var(--text)]/80 mb-2 line-clamp-2">
          {course.smallDescription}
        </p>

        <div className="text-xs text-[var(--text)]/70 space-y-0.5 mb-2 flex-1">
          <p>
            Level: <span className="font-semibold">{course.level}</span>
          </p>
          <p>
            Duration: <span className="font-semibold">{course.duration}</span>
          </p>
          {course.categories && (
            <p>
              Categories:{" "}
              <span className="font-semibold line-clamp-1">
                {(typeof course.categories === "string"
                  ? course.categories.split(",").map(c => c.trim())
                  : course.categories
                ).slice(0, 2).join(", ")}
              </span>
            </p>
          )}
        </div>
      </div>
    </article>
  );
});

export default CourseCard;
