
// src/components/Registration/RegistrationForm.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { isEmail, passwordIssues, normalizeEmail } from "../registration/Validation";
import { checkDuplicateEmail } from "../registration/Api";
import { InputField } from "../registration/InputField";
import { registerApi } from "../../api/authApi";

const LS_USERS = "learnsphere_users";

export const RegistrationForm = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();


  const validateField = async (name, value) => {
    let error = "";

    if (name === "name" && !value.trim()) {
      error = "Name is required";
    }

    if (name === "email") {
      if (!value.trim()) error = "Email is required";
      else if (!isEmail(value)) error = "Invalid email";
      else {
        const normalized = normalizeEmail(value);
        const isDup = await checkDuplicateEmail(normalized);
        if (isDup) error = "Email already exists";
      }
    }

    if (name === "password") {
      if (!value) error = "Password is required";
      else {
        const pwdIssues = passwordIssues(value);
        if (pwdIssues.length) error = pwdIssues;
      }
    }

    if (name === "confirmPassword") {
      if (!value) error = "Confirm Password is required";
      else if (value !== form.password) error = "Passwords do not match";
    }

    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const onChange = async (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    await validateField(name, value);
  };

  const validateAll = async () => {
    const nextErrors = {};

    // name
    if (!form.name.trim()) {
      nextErrors.name = "Name is required";
    }

    // email
    if (!form.email.trim()) {
      nextErrors.email = "Email is required";
    } else if (!isEmail(form.email)) {
      nextErrors.email = "Invalid email";
    } else {
      const normalized = normalizeEmail(form.email);
      const isDup = await checkDuplicateEmail(normalized);
      if (isDup) nextErrors.email = "Email already exists";
    }

    // password
    if (!form.password) {
      nextErrors.password = "Password is required";
    } else {
      const pwdIssues = passwordIssues(form.password);
      if (pwdIssues.length) nextErrors.password = pwdIssues;
    }

    // confirmPassword
    if (!form.confirmPassword) {
      nextErrors.confirmPassword = "Confirm Password is required";
    } else if (form.confirmPassword !== form.password) {
      nextErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const isValid = await validateAll();
    if (!isValid) {
      setSubmitting(false);
      return;
    }

    const normalizedEmail = normalizeEmail(form.email);

    try {
      const res = await registerApi({
        name: form.name,
        email: normalizedEmail,
        password: form.password,
      });

      const data = res.data; // { token, name, email, role }

      // Success: store auth and user data
      localStorage.setItem("token", data.token || data.Token);
      localStorage.setItem(
        "learnsphere_user",
        JSON.stringify({
          name: data.name || data.Name,
          email: data.email || data.Email,
          role: data.role || data.Role || "student"
        })
      );

      // Compat for legacy Profile UI
      localStorage.setItem("studentName", data.name || data.Name);
      localStorage.setItem("studentEmail", data.email || data.Email);

      window.dispatchEvent(new Event("userUpdated"));
      navigate("/dashboard");
    } catch (err) {
      console.error("Registration error:", err);
      const msg = err?.response?.data || "Registration failed";
      setErrors((prev) => ({ ...prev, email: msg }));
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-md px-4 py-10">
      <h2 className="text-2xl font-bold text-slate-100 mb-6">
        Create your account
      </h2>

      <InputField
        label="Name"
        name="name"
        value={form.name}
        onChange={onChange}
        error={errors.name}
        placeholder="Jane Doe"
      />

      <InputField
        label="Email"
        name="email"
        type="email"
        value={form.email}
        onChange={onChange}
        error={errors.email}
        placeholder="jane@example.com"
      />

      <InputField
        label="Password"
        name="password"
        type="password"
        value={form.password}
        onChange={onChange}
        error={errors.password}
        placeholder="Minimum 10 characters"
      />

      <InputField
        label="Confirm Password"
        name="confirmPassword"
        type="password"
        value={form.confirmPassword}
        onChange={onChange}
        error={errors.confirmPassword}
        placeholder="Re-enter your password"
      />

      <button
        type="submit"
        disabled={submitting}
        className={[
          "mt-4 w-full rounded-lg px-4 py-2.5 font-semibold",
          "text-white bg-gradient-to-tr from-indigo-600 to-blue-500 shadow-lg hover:shadow-xl transition",
          submitting ? "opacity-60 cursor-not-allowed" : "",
        ].join(" ")}
      >
        {submitting ? "Registering..." : "Register"}
      </button>
    </form>
  );
};
