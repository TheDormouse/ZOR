"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";

const TABS = ["sign-in", "sign-up"];

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    }>
      <AuthForm />
    </Suspense>
  );
}

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";

  const [tab, setTab] = useState("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  async function handleEmailPassword(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (tab === "sign-up") {
      const { error: err } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${location.origin}/auth/callback?redirect=${redirect}` },
      });
      if (err) {
        setError(err.message);
      } else {
        setMessage("Check your email for a confirmation link.");
      }
    } else {
      const { error: err } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (err) {
        setError(err.message);
      } else {
        router.push(redirect);
      }
    }
    setLoading(false);
  }

  async function handleMagicLink() {
    if (!email) {
      setError("Enter your email first.");
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);

    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback?redirect=${redirect}` },
    });
    if (err) {
      setError(err.message);
    } else {
      setMessage("Check your email for a magic link.");
    }
    setLoading(false);
  }

  async function handleGoogle() {
    setError(null);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback?redirect=${redirect}` },
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Back link */}
        <button
          onClick={() => router.push("/")}
          className="text-white/40 hover:text-white/70 transition-colors mb-8 text-sm flex items-center gap-1"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M10 12L6 8L10 4" />
          </svg>
          Back Home
        </button>

        <h1 className="text-3xl font-light mb-2">
          {tab === "sign-in" ? "Welcome Back" : "Create Account"}
        </h1>
        <p className="text-white/40 mb-8">
          {tab === "sign-in"
            ? "Sign in to manage your classrooms"
            : "Create an account to start sharing check-ins"}
        </p>

        {/* Tab switcher */}
        <div className="flex gap-1 p-1 bg-white/5 rounded-xl mb-6">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(null); setMessage(null); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                tab === t
                  ? "bg-white/10 text-white"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              {t === "sign-in" ? "Sign In" : "Sign Up"}
            </button>
          ))}
        </div>

        {/* Google */}
        <button
          onClick={handleGoogle}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 transition-all text-sm font-medium"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs text-white/30">or</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Email form */}
        <form onSubmit={handleEmailPassword} className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors"
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required={tab === "sign-up"}
              minLength={tab === "sign-up" ? 6 : undefined}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-white text-slate-900 font-medium hover:bg-white/90 transition-all disabled:opacity-50"
          >
            {loading
              ? "..."
              : tab === "sign-in"
              ? "Sign In"
              : "Create Account"}
          </button>
        </form>

        {/* Magic link */}
        <button
          onClick={handleMagicLink}
          disabled={loading}
          className="w-full mt-3 py-3 rounded-xl border border-white/10 text-white/60 text-sm hover:bg-white/5 transition-all disabled:opacity-50"
        >
          Send Magic Link Instead
        </button>

        {/* Messages */}
        {error && (
          <p className="mt-4 text-sm text-red-400 bg-red-400/10 rounded-xl px-4 py-3">
            {error}
          </p>
        )}
        {message && (
          <p className="mt-4 text-sm text-green-400 bg-green-400/10 rounded-xl px-4 py-3">
            {message}
          </p>
        )}
      </motion.div>
    </div>
  );
}
