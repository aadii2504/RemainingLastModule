/* eslint-disable no-empty */
import {
  enrollCourseAPI,
  getEnrolledCoursesAPI,
  unenrollCourseAPI,
} from "../api/enrollmentApi";

const listeners = new Set();
let enrollments = [];
let isLoaded = false;

async function loadEnrollmentsFromBackend() {
  if (isLoaded) return;
  try {
    const courses = await getEnrolledCoursesAPI();
    enrollments = courses || [];
    isLoaded = true;
    emit();
  } catch (err) {
    console.error("Failed to load enrollments from backend", err);
    enrollments = [];
    isLoaded = true;
  }
}

function emit() {
  listeners.forEach((fn) => fn());
}

// External Store API
export function subscribe(fn) {
  listeners.add(fn);
  loadEnrollmentsFromBackend(); // Load from backend on first subscription
  return () => listeners.delete(fn);
}

export function getSnapshot() {
  return enrollments;
}

// Mutations
export async function enrollCourse(course) {
  try {
    await enrollCourseAPI(course.id);
    if (!enrollments.some((c) => c.id === course.id)) {
      enrollments = [...enrollments, course];
      emit();
    }
  } catch (err) {
    console.error("Failed to enroll", err);
    throw err;
  }
}

export async function unenrollCourse(id) {
  try {
    await unenrollCourseAPI(id);
    enrollments = enrollments.filter((c) => c.id !== id);
    emit();
  } catch (err) {
    console.error("Failed to unenroll", err);
    throw err;
  }
}
