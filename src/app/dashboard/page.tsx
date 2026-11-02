
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

type StudentProfile = {
  fullName?: string;
  email?: string;
  courseToStudy?: string;
  medicalProgram?: string;
  medicalYear?: string;
  accountStatus?: string;
};

export default function StudentDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        window.location.replace("/login");
        return;
      }

      try {
        await currentUser.reload();

        if (!currentUser.emailVerified) {
          await signOut(auth);
          window.location.replace("/login");
          return;
        }

        setUser(currentUser);

        const profileRef = doc(db, "users", currentUser.uid);
        const profileSnapshot = await getDoc(profileRef);

        if (!profileSnapshot.exists()) {
          setError("Your student profile could not be found. Please contact RCA support.");
        } else {
          setProfile(profileSnapshot.data() as StudentProfile);
        }
      } catch (err) {
        console.error("Dashboard loading error:", err);
        setError("Unable to load your dashboard. Please try again.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  async function handleLogout() {
    await signOut(auth);
    window.location.replace("/login");
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="font-semibold text-slate-700">
          Loading your RCA dashboard...
        </p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md rounded-xl bg-white p-8 text-center shadow">
          <h1 className="text-xl font-bold text-red-700">
            Dashboard Error
          </h1>
          <p className="mt-3 text-gray-600">{error}</p>
          <Link href="/login" className="mt-6 inline-block font-bold text-red-700">
            Return to Login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b bg-white px-5 py-4 shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/rcalogo.png"
              alt="RCA Logo"
              className="h-12 w-12 object-contain"
            />
            <div>
              <h1 className="font-bold text-red-700">
                Rose Coaching Academy
              </h1>
              <p className="text-xs text-gray-500">
                Student Portal
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-lg bg-red-700 px-4 py-2 text-sm font-bold text-white"
          >
            Logout
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-10">
        <div className="rounded-2xl bg-gradient-to-r from-red-800 to-red-600 p-8 text-white">
          <p className="text-sm text-red-100">
            Welcome to your student portal
          </p>
          <h2 className="mt-2 text-3xl font-bold">
            Hello, {profile?.fullName || user?.displayName || "Student"}!
          </h2>
          <p className="mt-2 text-red-100">
            Continue your medical learning journey with RCA.
          </p>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900">
              My Courses
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Access your enrolled medical courses and lectures.
            </p>
            <p className="mt-4 font-semibold text-red-700">
              Coming soon
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900">
              My Exams
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Practice MCQs and access your assigned examinations.
            </p>
            <p className="mt-4 font-semibold text-red-700">
              Coming soon
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900">
              My Membership
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              View your membership and subscription information.
            </p>
            <p className="mt-4 font-semibold text-red-700">
              Coming soon
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="text-xl font-bold text-slate-900">
            My Academic Profile
          </h3>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-gray-500">Full Name</p>
              <p className="font-semibold text-slate-800">
                {profile?.fullName || "Not available"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-semibold text-slate-800">
                {profile?.email || user?.email}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Medical Program</p>
              <p className="font-semibold text-slate-800">
                {profile?.medicalProgram || "Not available"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Medical Year</p>
              <p className="font-semibold text-slate-800">
                {profile?.medicalYear || "Not available"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Selected Pathway</p>
              <p className="font-semibold text-slate-800">
                {profile?.courseToStudy || "Not available"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Account Status</p>
              <p className="font-semibold text-amber-700">
                {profile?.accountStatus || "Pending"}
              </p>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-gray-400">
          © Rose Coaching Academy (RCA)
        </p>
      </section>
    </main>
  );
}
  
