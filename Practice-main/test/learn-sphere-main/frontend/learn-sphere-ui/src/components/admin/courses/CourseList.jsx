import CourseCard from "./CourseCard";

export default function CourseList({
  courses,
  justCreatedId,
  newCardRef,
  onEdit,
  onDelete,
  onViewContent,
  deletingId,
}) {
  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {courses.map((course) => (
        <CourseCard
          key={course.id}
          ref={course.id === justCreatedId ? newCardRef : null}
          course={course}
          highlight={course.id === justCreatedId}
          onEdit={onEdit}
          onDelete={onDelete}
          onViewContent={onViewContent}
          deletingId={deletingId}
        />
      ))}
    </div>
  );
}
