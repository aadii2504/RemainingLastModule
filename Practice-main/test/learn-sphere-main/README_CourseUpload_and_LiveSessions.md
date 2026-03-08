# Course Upload and Live Sessions Flow

This document explains how course content upload and live session features work in the LearnSphere application, covering both **backend API endpoints** and the **frontend components** that interact with them.

---

## 1. Course Content Upload

### Backend

All content (videos, documents, images, audio) is managed under the `CoursesController` in the backend.

#### Key endpoints

- **POST** `/api/courses/{courseId}/chapters/{chapterId}/lessons/{lessonId}/content`
  - Accepts `FormData` with fields: `file` (IFormFile), `contentType` (video/audio/document/image), `title`, `description` (optional), `order` (int).
  - Validates authentication (`admin` role) and that the specified lesson/chapter/course exist.
  - Uses `IFileUploadService` to store the file and returns a `CourseContentDto` including `fileUrl`, `fileName`, `fileSize`.

- **GET** `/api/courses/{courseId}/chapters/{chapterId}/lessons/{lessonId}/content/{id}`
  - Retrieves metadata for a single content item.

- **DELETE** `/api/courses/{courseId}/chapters/{chapterId}/lessons/{lessonId}/content/{id}`
  - Removes the content and deletes the associated file via `IFileUploadService`.

The controller also contains endpoints for fetching course structure (`/structure`) and CRUD operations for chapters/lessons, which the frontend uses when building course pages.

### Frontend

The `courseApi` module defines helper methods mirroring the backend routes. The upload methods are used primarily in admin interfaces.

- `courseApi.content.upload(courseId, chapterId, lessonId, formData)` sends a POST request to the upload endpoint.
- `courseApi.content.delete(...)` deletes content.

#### User interface

1. **CourseStructureManager.jsx** (admin component)
   - Loads course structure and allows adding chapters/lessons.
   - When "Upload Content" is clicked on a lesson, it opens `ContentUploadModal.jsx`.
   - `ContentUploadModal` handles drag/drop or file selection, validates file size (max 500 MB), collects title/description/type/order, and builds a `FormData` object.
   - On submit, it calls `handleUploadContent` which uses `courseApi.content.upload` and reloads the structure upon success.
   - Errors from the backend are displayed to the user.

2. **ContentUploadModal.jsx**
   - Generic modal used by the structure manager; supports four content types with appropriate accept filters.
   - Shows preview of selected file and resets after success.

These components also handle error states (e.g. missing title or file) and disable buttons during upload.

---

## 2. Live Sessions

LearnSphere supports scheduled video sessions with optional files and course linkage. The backend stores sessions in the `LiveSessions` table.

### Backend

Controlled by `LiveSessionsController`.

#### Student-like endpoints

- **GET** `/api/LiveSessions` - lists all sessions (public).
- **GET** `/api/LiveSessions/{id}` - get details for one session.
- **POST** `/api/LiveSessions/{id}/join` - authenticated student records attendance if the session is currently live (between `StartTime` and `EndTime`). Returns `{ joined: true/false }`.

#### Admin endpoints

- **POST** `/api/LiveSessions` - create session (admin only). Accepts `FormData`:
  - `title`, `description`, `startTime`, `endTime`, optional `courseId`, plus either file uploads `videoFile`, `thumbnailFile` or URLs `videoUrl`, `thumbnailUrl`.
  - Files are stored via `IFileUploadService`.
  - Sends notifications to all students with the IST-converted start time.

- **PUT** `/api/LiveSessions/{id}` - update session (admin only). Same `FormData` semantics; existing files may be replaced.
- **DELETE** `/api/LiveSessions/{id}` - delete session and optionally remove stored files.

The controller includes helper to convert timezone to IST and logging attendance.

### Frontend

`liveSessionApi` in `courseApi.js` wraps the backend calls:

- `getAll()`, `getById(id)`, `create(payload)`, `update(id, payload)`, `delete(id)`, `join(id)`.

#### Admin UI

- **LiveSessionManager.jsx** provides a dashboard for admins:
  1. Fetches sessions and courses on mount.
  2. Displays a card grid with session thumbnails, titles, times, duration, and action buttons (edit, delete, open player).
  3. Modal form allows creating or editing sessions; uses `FormData` similar to backend.
  4. Upload fields for video/thumbnail support drag/drop with previews (`FileDropZone`).
  5. Fields include start/end times (datetime-local inputs), optional course link.
  6. On submit, it calls `liveSessionApi.create` or `update` and reloads data.

- Validations: required title/start/end; file size/type handled when dropped.

#### Student-facing

- **LiveSessionsPage.jsx** lists all sessions, optionally passed from dashboard, with sorting and filtering logic.
- **LiveSessionPlayer.jsx** renders the selected session:
  1. Retrieves session by ID, sets `status` (`upcoming`, `active`, `ended`) with timer updates.
  2. If `active` or `ended`, displays video/iframe element; otherwise shows countdown.
  3. If session video URL points to remote or upload, uses `<video>` or `<iframe>` appropriately.
  4. During active sessions, seeks are restricted to maintain live experience.
  5. Buttons/navigation allow returning to dashboard.

- The join endpoint (`liveSessionApi.join`) is called when student clicks a join button elsewhere (e.g. in `DashboardPage.jsx`) to record attendance.

---

## 3. Additional Notes

- **Authentication:** API uses JWT; frontend attaches token via interceptor. Admin-only endpoints check `User.IsInRole("admin")`.
- **File handling:** `IFileUploadService` abstracts storage; uploading returns a URL used by frontend directly in media elements.
- **Frontend state:** Course structure and sessions are reloaded after mutations to keep UI in sync.
- **Timezones:** Backend stores UTC; conversion helpers accommodate IST for notification messages. Frontend normalizes ISO strings for display and form inputs.

---

This README should help developers and integrators understand how course content and live session features are structured and where to look when extending or debugging these areas.