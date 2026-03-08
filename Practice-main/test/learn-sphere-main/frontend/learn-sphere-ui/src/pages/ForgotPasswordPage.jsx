import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { resetPasswordApi } from "../api/authApi";
import { normalizeEmail } from "../components/registration/Validation";
import { InputField } from "../components/registration/InputField";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    // Front-end validation matching our backend requirements
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);

    try {
      const normalized = normalizeEmail(email);

      await resetPasswordApi({
        email: normalized,
        newPassword: newPassword,
      });

      setSuccess(true);

      // Navigate back to login page after 2 seconds
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      let msg =
        "Failed to reset password. Please check your email and try again.";

      if (err?.response?.data) {
        if (typeof err.response.data === "string") {
          msg = err.response.data;
        } else if (err.response.data?.error) {
          msg = err.response.data.error;
        } else if (err.response.data?.message) {
          msg = err.response.data.message;
        }
      }

      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Reset Password</h1>
        <p className="text-sm text-[var(--text)]/60 mb-6">
          Enter your email and a new password.
        </p>

        {success ? (
          <div className="text-sm sm:text-base text-green-600 bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center">
            Password updated successfully! Redirecting to login...
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate className="space-y-4">
            <InputField
              label="Email"
              name="email"
              type="email"
              value={email}
              placeholder="you@example.com"
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />

            <InputField
              label="New Password"
              name="newPassword"
              type="password"
              value={newPassword}
              placeholder="••••••••"
              onChange={(e) => setNewPassword(e.target.value)}
              required
              autoComplete="new-password"
            />

            {error && (
              <div className="text-xs sm:text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg p-2 sm:p-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full rounded-lg px-4 py-2.5 sm:py-3 font-semibold text-sm sm:text-base text-white bg-gradient-to-tr from-indigo-600 to-blue-500 hover:opacity-90 disabled:opacity-50 transition"
              disabled={loading}
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-xs sm:text-sm text-[var(--text)]/60">
          Remember your password?{" "}
          <Link
            to="/login"
            className="text-indigo-400 hover:text-indigo-300 font-semibold"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
