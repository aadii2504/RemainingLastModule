import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PersonalInfo } from "../components/Profile/PersonalInfo";
import { PAcademic } from "../components/Profile/PAcademic";
import { GuardianInfo } from "../components/Profile/GuardianInfo";
import { getMeApi } from "../api/studentApi";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export const Profile = () => {
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState("Student");
  const [course, setCourse] = useState("");
  const [year, setYear] = useState("");
  const [guardianData, setGuardianData] = useState({
    guardianName: "",
    guardianPhone: "",
    guardianEmail: "",
    guardianAddress: "",
  });
  const [registrationDate, setRegistrationDate] = useState(
    () => localStorage.getItem("studentRegistrationDate") || "—",
  );
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const res = await getMeApi();
        const data = res.data;
        console.log("Profile data:", data);

        const date = data.registrationDate || data.RegistrationDate || "—";
        setRegistrationDate(date);
        if (date !== "—") {
          localStorage.setItem("studentRegistrationDate", date);
        }

        localStorage.setItem("studentName", data.fullName || "");
        localStorage.setItem("studentDob", data.dateOfBirth || "");
        localStorage.setItem("studentGender", data.gender || "");
        localStorage.setItem("studentEmail", data.email || "");
        localStorage.setItem("studentCountry", data.country || "");
        localStorage.setItem("studentPhone", data.phone || "");

        localStorage.setItem("studentRollNumber", data.rollNumber || "");
        localStorage.setItem("studentCourse", data.course || "");
        localStorage.setItem("studentYear", data.year?.toString() || "");

        localStorage.setItem(
          "guardian_draft",
          JSON.stringify({
            guardianName: data.guardianName || "",
            guardianPhone: data.guardianPhone || "",
            guardianEmail: data.guardianEmail || "",
            guardianAddress: data.guardianAddress || "",
          }),
        );

        setName(data.fullName || "Student");
        setCourse(data.course || "—");
        setYear(data.year?.toString() || "—");
        setGuardianData({
          guardianName: data.guardianName || "",
          guardianPhone: data.guardianPhone || "",
          guardianEmail: data.guardianEmail || "",
          guardianAddress: data.guardianAddress || "",
        });
      } catch {
        // if 404 profile not found, ignore
      }
    })();

    const handleProfileSaved = () => {
      setEditMode(false);
    };

    window.addEventListener("profileSaved", handleProfileSaved);
    return () => window.removeEventListener("profileSaved", handleProfileSaved);
  }, []);

  // ✅ FIX 1: define stats
  const stats = [
    { label: "Course", value: course || "Not set" },
    { label: "Year", value: year || "Not set" },
    { label: "Enrolled", value: registrationDate },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text)]">{name}</h2>
          <p className="text-sm text-[var(--text)]/80">
            Student profile and details
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (editMode) {
                setEditMode(false);
              } else {
                setEditMode(true);
              }
            }}
            className="px-3 py-2 rounded-md font-semibold bg-[var(--card)] border border-[var(--border)] text-[var(--text)]"
          >
            {editMode ? "Edit Profile" : "Edit Profile"}
          </button>

          <button
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("learnsphere_user");
              localStorage.removeItem("studentName");

              window.dispatchEvent(new Event("userUpdated"));
              navigate("/");
              window.location.reload();
            }}
            className="px-3 py-2 rounded-md font-semibold bg-red-600 text-white hover:brightness-110 transition"
          >
            Logout
          </button>
        </div>
      </div>

      {!editMode ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4"
            >
              <div className="text-sm text-[var(--text)]/80">{s.label}</div>
              <div className="mt-2 font-semibold text-[var(--text)]">
                {s.value}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {editMode ? (
        <div>
          <PersonalInfo />
          <PAcademic />
          <GuardianInfo
            guardianData={guardianData}
            setGuardianData={setGuardianData}
          />
        </div>
      ) : null}
    </div>
  );
};
