// src/pages/Landing.jsx
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { enterDemoMode, isDemoMode } from "../demo/demoMode";

const Landing = () => {
  const navigate = useNavigate();

  // ✅ Auto-redirect if already logged in or demo mode is active
  useEffect(() => {
    const email = localStorage.getItem("user_email");
    const demo = isDemoMode();
    if (demo || email) navigate("/dashboard", { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-white sm:bg-gradient-to-br sm:from-blue-50 sm:via-white sm:to-blue-100">
      {/* Top bar */}
      <header className="max-w-6xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-extrabold shadow-sm">
            SH
          </div>
          <div className="leading-tight">
            <div className="font-extrabold text-gray-900">Smart Health Monitor</div>
            <div className="text-xs text-gray-500 hidden sm:block">
              Calm charts • Personalized baseline • Google Fit sync
            </div>
          </div>
        </div>

        <button
          className="px-3 py-2 rounded-xl text-sm font-semibold text-gray-700 hover:bg-white/70 border border-transparent hover:border-gray-200 transition"
          onClick={() => navigate("/login")}
        >
          Login
        </button>
      </header>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          {/* Left: hero */}
          <div className="pt-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-white/80 text-sm text-gray-700">
              <span className="font-semibold text-blue-700">Demo available</span>
              <span className="text-gray-500 hidden sm:inline">
                explore without Google login
              </span>
            </div>

            <h1 className="mt-4 text-3xl sm:text-5xl font-extrabold text-gray-900 leading-tight">
              Health trends,
              <br />
              explained simply.
            </h1>

            <p className="mt-3 text-base sm:text-lg text-gray-700 max-w-xl">
              Sync Google Fit data, view calm charts, and get personalized baseline insights.
              Built for clarity — not clutter.
            </p>

            {/* CTAs */}
            <div className="mt-7 flex flex-col sm:flex-row gap-3 sm:items-center">
              <button
                className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm transition"
                onClick={() => navigate("/login")}
              >
                Connect Google Fit
              </button>

              <button
                className="w-full sm:w-auto px-5 py-3 rounded-2xl border bg-white hover:bg-gray-50 text-gray-900 font-semibold shadow-sm transition"
                onClick={() => {
                  enterDemoMode();
                  navigate("/dashboard", { replace: true });
                }}
              >
                Try Demo (no login)
              </button>
            </div>

            <div className="mt-5 text-sm text-gray-600 leading-relaxed">
              <span className="font-semibold text-gray-900">Privacy-first.</span>{" "}
              Insights are based on your personal baseline and are{" "}
              <span className="font-semibold">not a medical diagnosis</span>.
            </div>

            {/* Tiny proof points */}
            <div className="mt-6 flex flex-wrap gap-2">
              {["Fast sync", "Mobile-friendly", "Personalized AI"].map((t) => (
                <span
                  key={t}
                  className="px-3 py-1 rounded-full border bg-white/80 text-xs font-semibold text-gray-700"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Right: minimal preview */}
          <div className="bg-white/90 backdrop-blur rounded-3xl border shadow-sm p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-500">Preview</div>
                <div className="text-lg font-extrabold text-gray-900">
                  Personalized Summary
                </div>
              </div>
              <span className="px-3 py-1 rounded-full border bg-green-50 text-green-700 text-xs font-semibold">
                Normal
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border p-4">
                <div className="text-xs text-gray-500">Heart Rate</div>
                <div className="mt-1 text-xl font-extrabold text-gray-900">72 bpm</div>
                <div className="mt-1 text-xs text-gray-500">Median • today</div>
              </div>
              <div className="rounded-2xl border p-4">
                <div className="text-xs text-gray-500">SpO₂</div>
                <div className="mt-1 text-xl font-extrabold text-gray-900">98%</div>
                <div className="mt-1 text-xs text-gray-500">Min • today</div>
              </div>
            </div>

            <div className="mt-3 rounded-2xl border bg-gray-50 p-4">
              <div className="text-sm font-semibold text-gray-900">What you’ll see</div>
              <ul className="mt-2 space-y-1 text-sm text-gray-700">
                <li>• Trends for HR, SpO₂, BP, Sleep</li>
                <li>• Anomaly timeline vs baseline</li>
                <li>• Clean, calm dashboard UI</li>
              </ul>
            </div>

            <div className="mt-4 text-xs text-gray-500">
              Tip: Try demo first, then connect Google Fit when ready.
            </div>
          </div>
        </div>

        <footer className="mt-10 text-center text-xs text-gray-500">
          © 2026 Smart Health Monitor
        </footer>
      </main>
    </div>
  );
};

export default Landing;