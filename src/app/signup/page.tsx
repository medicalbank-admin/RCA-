
"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

const pathways = [
  "MBBS Year 1",
  "MBBS Year 2",
  "MBBS Year 3",
  "MBBS Year 4",
  "MBBS Year 5",
  "MBBS Year 6",
  "MD Year 1",
  "MD Year 2",
  "MD Year 3",
  "MD Year 4",
  "MD Year 5",
  "MD Year 6",
  "NRE",
  "USMLE",
  "PLAB",
  "SMLE",
  "DHA",
  "AMC",
  "FCPS"
];

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-red-700";

export default function SignupPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [medicalYear, setMedicalYear] = useState("");
  const [program, setProgram] = useState("MBBS");

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    const form = new FormData(event.currentTarget);

    const fullName = String(form.get("fullName") || "").trim();
    const fatherName = String(form.get("fatherName") || "").trim();
    const nationalId = String(form.get("nationalId") || "").trim();
    const email = String(form.get("email") || "").trim().toLowerCase();
    const whatsapp = String(form.get("whatsapp") || "").trim();
    const countryResidency = String(form.get("countryResidency") || "").trim();
    const countryStudy = String(form.get("countryStudy") || "").trim();
    const courseToStudy = String(form.get("courseToStudy") || "");
    const graduationYear = String(form.get("graduationYear") || "");
    const password = String(form.get("password") || "");
    const confirmPassword = String(form.get("confirmPassword") || "");

    if (!email.endsWith("@gmail.com")) {
      setMessage("Please enter a valid Gmail address.");
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setMessage("Your password must contain at least 8 characters.");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Your passwords do not match.");
      setLoading(false);
      return;
    }

    if (!courseToStudy) {
      setMessage("Please select your course or examination pathway.");
      setLoading(false);
      return;
    }

    if (medicalYear === "Graduated" && !graduationYear) {
      setMessage("Please enter your graduation year.");
      setLoading(false);
      return;
    }

    let createdUser = false;

    try {
      const credential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      createdUser = true;

      await updateProfile(credential.user, {
        displayName: fullName
      });

      await setDoc(doc(db, "users", credential.user.uid), {
        uid: credential.user.uid,
        fullName,
        fatherName,
        nationalId,
        email,
        whatsapp,
        countryResidency,
        countryStudy,
        medicalProgram: program,
        medicalYear,
        graduationYear:
          medicalYear === "Graduated" ? graduationYear : null,
        courseToStudy,
        accountStatus: "pending_verification",
        createdAt: serverTimestamp()
      });

      await sendEmailVerification(credential.user);

      setMessage(
        "Your RCA account has been created. Please check your email and verify your address before logging in."
      );

      event.currentTarget.reset();
      setMedicalYear("");
      setProgram("MBBS");
    } catch (error: unknown) {
      if (createdUser && auth.currentUser) {
        try {
          // Remove the newly created account if profile creation failed.
          // Do not leave an account without its required student profile.
          const { deleteUser } = await import("firebase/auth");
          await deleteUser(auth.currentUser);
        } catch {
          // The account may need manual cleanup if deletion is blocked.
        }
      }

      const firebaseError = error as { code?: string };

      if (firebaseError.code === "auth/email-already-in-use") {
        setMessage("This email is already registered. Please log in.");
      } else if (firebaseError.code === "auth/weak-password") {
        setMessage("Please choose a stronger password.");
      } else if (firebaseError.code === "auth/invalid-email") {
        setMessage("Please enter a valid email address.");
      } else if (firebaseError.code === "permission-denied") {
        setMessage(
          "Your profile could not be saved. Please check the Firestore security rules."
        );
      } else {
        setMessage(
          "Registration could not be completed. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-3xl rounded-2xl bg-white p-6 shadow-lg sm:p-10">
        <div className="mb-8 text-center">
          <Link href="/">
            <img
              src="/rcalogo.png"
              alt="Rose Coaching Academy"
              className="mx-auto mb-4 h-20 w-20 object-contain"
            />
          </Link>
          <p className="text-sm font-bold tracking-[3px] text-red-700">
            ROSE COACHING ACADEMY
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Student Registration
          </h1>
          <p className="mt-2 text-gray-500">
            Create your RCA student account.
          </p>
        </div>

        <form onSubmit={handleSignup} className="space-y-5">
          <div>
            <h2 className="mb-4 text-xl font-bold text-slate-900">
              Personal Information
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <input name="fullName" placeholder="Full Name" required className={inputClass} />
              <input name="fatherName" placeholder="Father Name" required className={inputClass} />
              <input name="nationalId" placeholder="CNIC / National ID / Passport Number" required className={inputClass} />
              <input name="email" type="email" placeholder="Gmail Address" required className={inputClass} />
              <input name="whatsapp" type="tel" placeholder="WhatsApp (+country code)" required className={inputClass} />
              <input name="countryResidency" placeholder="Country of Residency" required className={inputClass} />
              <input name="countryStudy" placeholder="Country of Study" required className={inputClass} />
            </div>
          </div>

          <div className="border-t pt-5">
            <h2 className="mb-4 text-xl font-bold text-slate-900">
              Academic Information
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <select
                value={program}
                onChange={(e) => setProgram(e.target.value)}
                className={inputClass}
              >
                <option value="MBBS">MBBS</option>
                <option value="MD">MD</option>
              </select>

              <select
                name="medicalYear"
                value={medicalYear}
                onChange={(e) => setMedicalYear(e.target.value)}
                required
                className={inputClass}
              >
                <option value="">Select Medical Year</option>
                <option value="1">Year 1</option>
                <option value="2">Year 2</option>
                <option value="3">Year 3</option>
                <option value="4">Year 4</option>
                <option value="5">Year 5</option>
                <option value="6">Year 6</option>
                <option value="Graduated">Graduated</option>
              </select>

              {medicalYear === "Graduated" && (
                <input
                  name="graduationYear"
                  type="number"
                  min="1950"
                  max="2100"
                  placeholder="Graduation Year"
                  required
                  className={inputClass}
                />
              )}

              <select
                name="courseToStudy"
                required
                defaultValue=""
                className={inputClass}
              >
                <option value="">Select Course / Pathway</option>
                {pathways.map((pathway) => (
                  <option key={pathway} value={pathway}>
                    {pathway}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="border-t pt-5">
            <h2 className="mb-4 text-xl font-bold text-slate-900">
              Create Your Password
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                name="password"
                type="password"
                placeholder="Create Password (minimum 8 characters)"
                minLength={8}
                required
                autoComplete="new-password"
                className={inputClass}
              />
              <input
                name="confirmPassword"
                type="password"
                placeholder="Confirm Password"
                minLength={8}
                required
                autoComplete="new-password"
                className={inputClass}
              />
            </div>
          </div>

          {message && (
            <p
              role="status"
              className="rounded-lg bg-red-50 p-4 text-sm text-red-800"
            >
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-red-700 px-6 py-4 font-bold text-white hover:bg-red-800 disabled:opacity-60"
          >
            {loading ? "Creating Account..." : "Create RCA Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already registered?{" "}
          <Link href="/login" className="font-bold text-red-700">
            Login here
          </Link>
        </p>
      </div>
    </main>
  );
  }
      
