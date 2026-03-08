import { Routes, Route } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { RegistrationPage } from "./pages/RegistrationPage";
import { Footer } from "./components/Footer";
import { DashboardPage } from "./pages/DashboardPage";
import LandingPage from "./pages/LandingPage";
import { Profile } from "./pages/Profile";
import NotificationsList from "./components/NotificationsList";

import { ProtectedRoute } from "./components/dashboard/ProtectedRoute";
import ProtectedAdminRoute from "./components/admin/ProtectedAdminRoute";
import AdminDashboard from "./pages/admin/AdminDashboard";
import CoursesAdmin from "./pages/admin/CoursesAdmin";
import UsersAdmin from "./pages/admin/UsersAdmin";
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import About from "./pages/About";
import Contact from "./pages/Contact";
import EnrolledCourses from "./pages/EnrolledCourses";
import Analytics from "./pages/admin/Analytics";
import CoursesPage from "./pages/CoursesPage";
import CourseDetailPage from "./pages/CourseDetailPage";
import CoursePlayerPage from "./pages/CoursePlayerPage";
import LiveSessionsPage from "./pages/LiveSessionsPage";
import LiveSessionPlayer from "./pages/LiveSessionPlayer";
import LiveSessionManager from "./pages/admin/LiveSessionManager";
import SupportPage from "./pages/student/SupportPage";
import HelpPage from "./pages/student/HelpPage";
import "react-toastify/dist/ReactToastify.css";

export default function App() {
  // the live sessions page will fetch real data from backend
  // we no longer need static mocks here

  return (
    <div className="app-shell min-h-screen flex flex-col">
      <Navbar />

      {/* padding-bottom equals footer height (64px) so content never hides behind footer */}
      <main className="mx-auto max-w-7xl px-4 py-6 w-full pb-[64px] flex-1">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/register" element={<RegistrationPage />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/notifications" element={<NotificationsList />} />
          <Route path="/enrolled-courses" element={<EnrolledCourses />} />
          <Route path="/my-courses" element={<EnrolledCourses />} />

          {/* Courses */}
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/course/:slug" element={<CourseDetailPage />} />
          <Route
            path="/course/:slug/learn"
            element={
              <ProtectedRoute>
                <CoursePlayerPage />
              </ProtectedRoute>
            }
          />

          {/* Live sessions */}
          <Route path="/live-sessions" element={<LiveSessionsPage />} />
          <Route
            path="/session/:id"
            element={
              <ProtectedRoute>
                <LiveSessionPlayer />
              </ProtectedRoute>
            }
          />

          {/* Dashboard (requires auth) */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Profile (requires auth) */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* Student support/help (requires auth) */}
          <Route
            path="/support"
            element={
              <ProtectedRoute>
                <SupportPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/help"
            element={
              <ProtectedRoute>
                <HelpPage />
              </ProtectedRoute>
            }
          />

          {/* Admin area (requires admin role) */}
          <Route
            path="/admin"
            element={
              <ProtectedAdminRoute>
                <AdminDashboard />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/courses"
            element={
              <ProtectedAdminRoute>
                <CoursesAdmin />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <ProtectedAdminRoute>
                <Analytics />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedAdminRoute>
                <UsersAdmin />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/live-sessions"
            element={
              <ProtectedAdminRoute>
                <LiveSessionManager />
              </ProtectedAdminRoute>
            }
          />

          {/* Optional: 404 fallback */}
          {/* <Route path="*" element={<NotFoundPage />} /> */}
        </Routes>
      </main>

      <Footer />
    </div>
  );
}
