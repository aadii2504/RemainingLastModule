import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginApi } from "../api/authApi";
import { normalizeEmail } from "../components/registration/Validation";
import { InputField } from "../components/registration/InputField";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const normalized = normalizeEmail(email);

      const res = await loginApi({
        email: normalized,
        password: password,
      });

      const data = res.data; // { token, name, email, role }

      // ✅ store JWT with PascalCase fallback
      const token = data.token || data.Token;
      const userName = data.name || data.Name;
      const userEmail = data.email || data.Email;
      const userRole = data.role || data.Role || "student";

      localStorage.setItem("token", token);

      // ✅ store user for navbar/role checks
      localStorage.setItem(
        "learnsphere_user",
        JSON.stringify({ name: userName, email: userEmail, role: userRole }),
      );

      // optional: keep your existing keys used in Profile UI
      localStorage.setItem("studentName", userName);
      localStorage.setItem("studentEmail", userEmail);

      window.dispatchEvent(new Event("userUpdated"));

      if (userRole === "admin") navigate("/admin");
      else navigate("/dashboard");
    } catch (err) {
      let msg = "Invalid email or password";

      // Handle different error response formats from backend
      if (err?.response?.data) {
        // If data is a string (direct error message from ASP.NET)
        if (typeof err.response.data === "string") {
          msg = err.response.data;
        }
        // If data is an object with error property
        else if (err.response.data?.error) {
          msg = err.response.data.error;
        }
        // If data is an object with message property
        else if (err.response.data?.message) {
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
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Login</h1>
        <p className="text-sm text-[var(--text)]/60 mb-6">
          Sign in to your account
        </p>

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
            label="Password"
            name="password"
            type="password"
            value={password}
            placeholder="••••••••"
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />

          {error && (
            <div className="text-xs sm:text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg p-2 sm:p-3">
              {error}
            </div>
          )}

          <div className="flex justify-end">
            <Link
              to="/forgot-password"
              className="text-xs sm:text-sm text-indigo-400 hover:text-indigo-300 font-semibold transition"
            >
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            className="w-full rounded-lg px-4 py-2.5 sm:py-3 font-semibold text-sm sm:text-base text-white bg-gradient-to-tr from-indigo-600 to-blue-500 hover:opacity-90 disabled:opacity-50 transition"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs sm:text-sm text-[var(--text)]/60">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="text-indigo-400 hover:text-indigo-300 font-semibold"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
