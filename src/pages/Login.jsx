// src/pages/Login.jsx

import React from "react";
import { useNavigate } from "react-router-dom";
import LoginButton from "../components/LoginButton";

function Login() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Top */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border bg-white hover:bg-gray-50 text-sm font-semibold"
          >
            ← Back
          </button>

          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm">
              SH
            </div>
            <div className="font-bold text-gray-900">Smart Health Monitor</div>
          </div>
        </div>

        {/* Content */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* Left info */}
          <div className="bg-white rounded-2xl border shadow-sm p-6">
            <h1 className="text-3xl font-extrabold text-gray-900">
              Welcome back
            </h1>
            <p className="mt-2 text-gray-700">
              Sign in to sync wearable data and view your personalized health insights.
            </p>

            <div className="mt-5 rounded-xl border bg-gray-50 p-4">
              <div className="font-semibold text-gray-900">You’ll see:</div>
              <ul className="mt-2 space-y-1 text-sm text-gray-700">
                <li>• Daily anomaly summary + donut chart</li>
                <li>• Timeline markers for unusual windows</li>
                <li>• Trends for Heart Rate, SpO₂ and BP</li>
              </ul>
            </div>

            <div className="mt-4 text-xs text-gray-500">
              Note: This system provides insights based on personal baselines and is not a medical diagnosis.
            </div>
          </div>

          {/* Right login card */}
          <div className="bg-white rounded-2xl border shadow-sm p-6 flex flex-col justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">Login</h2>
              <p className="text-sm text-gray-600 mt-1">
                Continue with your connected account
              </p>
            </div>

            <div className="mt-6 flex justify-center">
              <LoginButton />
            </div>

            <div className="mt-6 text-center text-xs text-gray-500">
              By continuing, you agree to use this app responsibly for self-monitoring.
            </div>
          </div>
        </div>

        <footer className="mt-10 py-6 text-center text-sm text-gray-500">
          © 2026 Smart Health Monitor
        </footer>
      </div>
    </div>
  );
}

export default Login;
