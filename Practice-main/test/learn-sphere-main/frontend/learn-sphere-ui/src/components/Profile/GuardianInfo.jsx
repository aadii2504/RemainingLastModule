import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { saveMeApi } from "../../api/studentApi";
import { toast } from "react-toastify";

export const GuardianInfo = ({ guardianData, setGuardianData }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setGuardianData((p) => ({ ...p, [name]: value }));
  };

  const fieldClass =
    "w-full rounded-md px-3 py-2 mb-3 bg-[var(--card)] border border-[var(--border)] text-[var(--text)]";

  return (
    <section className="mb-8 max-w-3xl">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-[var(--text)]">
              Guardian Information
            </h3>
            <p className="text-sm text-[var(--text)]/80">
              Enter guardian details
            </p>
          </div>
        </div>

        <input
          name="guardianName"
          type="text"
          placeholder="Guardian Name"
          value={guardianData.guardianName}
          onChange={handleChange}
          className={fieldClass}
        />

        <input
          name="guardianPhone"
          type="text"
          placeholder="Guardian Phone"
          value={guardianData.guardianPhone}
          onChange={handleChange}
          className={fieldClass}
        />

        <input
          name="guardianEmail"
          type="email"
          placeholder="Guardian Email"
          value={guardianData.guardianEmail}
          onChange={handleChange}
          className={fieldClass}
        />

        <textarea
          name="guardianAddress"
          placeholder="Guardian Address"
          value={guardianData.guardianAddress}
          onChange={handleChange}
          className={fieldClass + " h-20 resize-none"}
        />

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={() => {
              localStorage.setItem(
                "guardian_draft",
                JSON.stringify(guardianData),
              );
              toast.success("Saved as draft!");
            }}
            className="flex-1 rounded-md px-4 py-2 font-semibold bg-[var(--card)] border border-[var(--border)] text-[var(--text)] hover:brightness-110 transition"
          >
            Save Draft
          </button>
          <button
            type="button"
            onClick={async () => {
              try {
                const payload = {
                  fullName: localStorage.getItem("studentName") || "",
                  dateOfBirth: localStorage.getItem("studentDob") || null,
                  gender: localStorage.getItem("studentGender") || null,
                  email: localStorage.getItem("studentEmail") || "",
                  country: localStorage.getItem("studentCountry") || null,
                  phone: localStorage.getItem("studentPhone") || null,
                  rollNumber: localStorage.getItem("studentRollNumber") || null,
                  course: localStorage.getItem("studentCourse") || null,
                  year:
                    Number(localStorage.getItem("studentYear") || 0) || null,
                  guardianName: guardianData.guardianName || null,
                  guardianPhone: guardianData.guardianPhone || null,
                  guardianEmail: guardianData.guardianEmail || null,
                  guardianAddress: guardianData.guardianAddress || null,
                };

                await saveMeApi(payload);
                toast.success("Profile saved successfully!");
                setTimeout(() => {
                  window.dispatchEvent(new CustomEvent("profileSaved"));
                }, 500);
              } catch (err) {
                console.error("Save error:", err);
                toast.error("Failed to save profile");
              }
            }}
            className="flex-1 rounded-md px-4 py-2 font-semibold text-white bg-gradient-to-tr from-indigo-600 to-blue-500 hover:shadow-lg transition"
          >
            Submit
          </button>
        </div>
      </div>
    </section>
  );
};
