"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut
} from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"error" | "success">("error");

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "").trim().toLowerCase();
    const password = String(form.get("password") || "");

    try {
      const credential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      await credential.user.reload();

      if (!credential.user.emailVerified) {
        await signOut(auth);
        setMessageType("error");
        setMessage(
          "Please verify your email address using the link we sent before logging in."
        );
        return;
      }

      setMessageType("success");
      setMessage("Login successful. Redirecting to your student dashboard...");

      window.location.href = "/dashboard";
    } catch (error: unknown) {
      const firebaseError = error as { code?: string };

      setMessageType("error");

      if (
        firebaseError.code === "auth/invalid-credential" ||
        firebaseError.code === "auth/user-not-found" ||
        firebaseError.code === "auth/wrong-password"
      ) {
        setMessage("Incorrect email or password.");
      } else if (firebaseError.code === "auth/too-many-requests") {
        setMessage("Too many attempts. Please wait and try again.");
      } else {
        setMessage("Login failed. Please check your details and try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    const emailInput = document.querySelector<HTMLInputElement>(
      'input[name="email"]'
    );

    const email = emailInput?.value.trim().toLowerCase();

    if (!email) {
      setMessageType("error");
      setMessage("Enter your email address first, then tap Forgot Password.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setMessageType("success");
      setMessage("If an account exists for that address, a password reset email has been sent.");
    } catch {
      setMessageType("error");
      setMessage("Unable to send the reset email. Please check the address and try again.");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white p-7 shadow-lg sm:p-10">
        <div className="mb-8 text-center">
          <Link href="/">
            <img
              src="/rcalogo.png"
              alt="Rose Coaching Academy"
              className="mx-auto mb-4 h-20 w-20 object-contain"
            />
          </Link>

          <p className="text-xs font-bold tracking-[3px] text-red-700">
            ROSE COACHING ACADEMY
          </p>

          <h1 className="mt-3 text-3xl font-bold text-slate-900">
            Student Login
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Welcome back to your RCA learning journey.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">
              Gmail Address
            </label>
            <input
              name="email"
              type="email"
              placeholder="Enter your email"
              required
              autoComplete="email"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-red-700"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">
              Password
            </label>
            <input
              name="password"
              type="password"
              placeholder="Enter your password"
              required
              autoComplete="current-password"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-red-700"
            />
          </div>

          <div className="text-right">
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-sm font-semibold text-red-700 hover:underline"
            >
              Forgot Password?
            </button>
          </div>

          {message && (
            <p
              role="status"
              className={`rounded-lg p-3 text-sm ${
                messageType === "success"
                  ? "bg-green-50 text-green-800"
                  : "bg-red-50 text-red-800"
              }`}
            >
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-red-700 px-6 py-4 font-bold text-white hover:bg-red-800 disabled:opacity-60"
          >
            {loading ? "Signing In..." : "Login to RCA"}
          </button>
        </form>

        <p className="mt-7 text-center text-sm text-gray-600">
          New student?{" "}
          <Link href="/signup" className="font-bold text-red-700">
            Register Now
          </Link>
        </p>

        <p className="mt-5 text-center">
          <Link href="/" className="text-sm text-gray-500 hover:text-red-700">
            ← Back to Homepage
          </Link>
        </p>
      </div>
    </main>
  );
  }
