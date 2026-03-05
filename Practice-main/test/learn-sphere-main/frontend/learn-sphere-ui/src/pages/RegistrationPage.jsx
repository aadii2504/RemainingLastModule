
// src/pages/RegistrationPage.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { RegistrationForm } from "../components/registration/RegistrationForm";

export const RegistrationPage = () => {
  const navigate = useNavigate();

  const handleRegistered = () => {
    // After successful registration:
    // navigate to dashboard (or login) as per your app flow
    navigate("/dashboard");
  };

  return (
    <>
      <section style={{ maxWidth: 480, margin: "2rem auto" }}>
        <h2>Student Registration</h2>
        <p>Register to access courses and learning materials.</p>
        <RegistrationForm onRegistered={handleRegistered} />
      </section>
    </>
  );
};
