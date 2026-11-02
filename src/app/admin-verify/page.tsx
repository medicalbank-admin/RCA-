
"use client";

import { useState } from "react";
import {
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut
} from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function AdminVerifyPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const result = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      await result.user.reload();

      if (result.user.emailVerified) {
        setMessage("This email is already verified.");
      } else {
        await sendEmailVerification(result.user);
        setMessage(
          "Verification email sent. Check your inbox and spam folder."
        );
      }

      await signOut(auth);
    } catch {
      setMessage(
        "Unable to send verification email. Check your email and password."
      );
      if (auth.currentUser) await signOut(auth);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-5">
      <form
        onSubmit={handleVerify}
        className="w-full max-w-md space-y-4 rounded-2xl bg-white p-7 shadow"
      >
        <h1 className="text-2xl font-bold text-slate-900">
          RCA Admin Email Verification
        </h1>

        <input
          type="email"
          placeholder="Admin email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded-lg border p-3"
        />

        <input
          type="password"
          placeholder="Admin password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full rounded-lg border p-3"
        />

        {message && (
          <p className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
            {message}
          </p>
        )}

        <button
          disabled={loading}
          className="w-full rounded-lg bg-red-700 p-3 font-bold text-white disabled:opacity-50"
        >
          {loading ? "Sending..." : "Send Verification Email"}
        </button>
      </form>
    </main>
  );
  }
