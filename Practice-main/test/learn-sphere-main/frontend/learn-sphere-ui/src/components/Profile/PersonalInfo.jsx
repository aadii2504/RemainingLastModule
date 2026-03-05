import { useState, useEffect } from "react";
import { InputField } from "../registration/InputField";

export const PersonalInfo = () => {
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    setName(localStorage.getItem("studentName") || "");
    setDob(localStorage.getItem("studentDob") || "");
    setGender(localStorage.getItem("studentGender") || "");
    setEmail(localStorage.getItem("studentEmail") || "");
    setCountry(localStorage.getItem("studentCountry") || "");
    setPhone(localStorage.getItem("studentPhone") || "");
    setPassword(localStorage.getItem("studentPassword") || "");
  }, []);

  useEffect(() => {
    localStorage.setItem("studentName", name);
    localStorage.setItem("studentDob", dob);
    localStorage.setItem("studentGender", gender);
    localStorage.setItem("studentEmail", email);
    localStorage.setItem("studentCountry", country);
    localStorage.setItem("studentPhone", phone);
    localStorage.setItem("studentPassword", password);
  }, [name, dob, gender, email, country, phone, password]);

  const fieldClass =
    "w-full rounded-md px-3 py-2 mb-3 bg-[var(--card)] border border-[var(--border)] text-[var(--text)]";

  return (
    <section className="mb-8 max-w-3xl">
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-[var(--text)]">
              Personal Information
            </h3>
            <p className="text-sm text-[var(--text)]/80">
              Changes saved automatically
            </p>
          </div>
        </div>

        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={fieldClass}
        />

        <input
          type="date"
          value={dob}
          onChange={(e) => setDob(e.target.value)}
          className={fieldClass}
        />

        <select
          value={gender}
          onChange={(e) => setGender(e.target.value)}
          className={fieldClass}
        >
          <option value="">Select Gender</option>
          <option>Male</option>
          <option>Female</option>
          <option>Other</option>
        </select>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={fieldClass}
        />

        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className={fieldClass}
        >
          <option value="">Select Country</option>
          <option>India</option>
          <option>USA</option>
          <option>UK</option>
          <option>Canada</option>
        </select>

        <input
          type="tel"
          placeholder="Phone (10 digits)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className={fieldClass}
        />

        <InputField
          label="Password"
          name="studentPassword"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password (min 8 characters)"
          className={fieldClass}
        />
      </div>
    </section>
  );
};
