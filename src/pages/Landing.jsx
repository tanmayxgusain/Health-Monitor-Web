// src/pages/Landing.jsx

import React from "react";
import { useNavigate } from "react-router-dom";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      {/* Top bar */}
      <header className="max-w-6xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm">
            SH
          </div>
          <div className="leading-tight">
            <div className="font-bold text-gray-900">Smart Health Monitor</div>
            <div className="text-xs text-gray-500">IoT • AI • Insights</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="hidden sm:inline-flex px-4 py-2 rounded-lg border bg-white hover:bg-gray-50 text-sm font-semibold"
            onClick={() => navigate("/login")}
          >
            Login
          </button>
          <button
            className="inline-flex px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm"
            onClick={() => navigate("/login")}
          >
            Get Started
          </button>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-white text-sm text-gray-700">
              <span className="font-semibold text-blue-700">Personalized</span>
              <span className="text-gray-500">health insights powered by your baseline</span>
            </div>

            <h1 className="mt-4 text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight">
              Track your health.
              <br />
              Spot anomalies early.
              <br />
              Stay in control.
            </h1>

            <p className="mt-4 text-base sm:text-lg text-gray-700 max-w-xl">
              Sync wearable data, visualize trends, and get AI-driven anomaly insights based on
              your personal baseline — designed for clarity and daily use.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm"
                onClick={() => navigate("/login")}
              >
                Connect & Continue
              </button>
              <button
                className="px-5 py-3 rounded-xl border bg-white hover:bg-gray-50 font-semibold"
                onClick={() => {
                  // Keep it simple: route to login for now
                  navigate("/login");
                }}
              >
                View Dashboard (Demo)
              </button>
            </div>

            {/* Trust/notes */}
            <div className="mt-5 text-sm text-gray-600">
              <span className="font-semibold text-gray-800">Privacy-first:</span> your insights are based on
              your data trends. Not a medical diagnosis.
            </div>
          </div>

          {/* Right: preview card */}
          <div className="bg-white rounded-2xl shadow-sm border p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Today</div>
                <div className="text-xl font-bold text-gray-900">Personalized Summary</div>
              </div>
              <div className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-semibold border border-green-200">
                ✅ Normal
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl border p-3">
                <div className="text-xs text-gray-500">Heart Rate</div>
                <div className="text-lg font-bold text-gray-900">72 bpm</div>
                <div className="text-xs text-gray-500 mt-1">Resting • stable</div>
              </div>
              <div className="rounded-xl border p-3">
                <div className="text-xs text-gray-500">SpO₂</div>
                <div className="text-lg font-bold text-gray-900">98%</div>
                <div className="text-xs text-gray-500 mt-1">Good saturation</div>
              </div>
              <div className="rounded-xl border p-3">
                <div className="text-xs text-gray-500">Blood Pressure</div>
                <div className="text-lg font-bold text-gray-900">120/80</div>
                <div className="text-xs text-gray-500 mt-1">Within range</div>
              </div>
              <div className="rounded-xl border p-3">
                <div className="text-xs text-gray-500">Anomaly Rate</div>
                <div className="text-lg font-bold text-gray-900">4.86%</div>
                <div className="text-xs text-gray-500 mt-1">Baseline matched</div>
              </div>
            </div>

            <div className="mt-4 rounded-xl border bg-gray-50 p-3">
              <div className="text-sm font-semibold text-gray-800">What you’ll get</div>
              <ul className="mt-2 space-y-1 text-sm text-gray-700">
                <li>• Clean charts with anomaly markers</li>
                <li>• Personalized baseline per user</li>
                <li>• Sleep + activity insights</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Features */}
        <section className="mt-10">
          <div className="text-xl font-bold text-gray-900">Core features</div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border shadow-sm p-5">
              <div className="text-2xl">🔄</div>
              <div className="mt-2 font-bold text-gray-900">Wearable sync</div>
              <div className="mt-1 text-sm text-gray-700">
                Incremental sync with timestamps for fast, reliable updates.
              </div>
            </div>

            <div className="bg-white rounded-2xl border shadow-sm p-5">
              <div className="text-2xl">🧠</div>
              <div className="mt-2 font-bold text-gray-900">Personalized AI</div>
              <div className="mt-1 text-sm text-gray-700">
                Anomaly detection trained on your own resting baseline windows.
              </div>
            </div>

            <div className="bg-white rounded-2xl border shadow-sm p-5">
              <div className="text-2xl">📈</div>
              <div className="mt-2 font-bold text-gray-900">Clear visuals</div>
              <div className="mt-1 text-sm text-gray-700">
                Timeline markers, trend charts, and summary insights that feel calm.
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-10 py-6 text-center text-sm text-gray-500">
          © 2026 Smart Health Monitor
        </footer>
      </main>
    </div>
  );
};

export default Landing;
