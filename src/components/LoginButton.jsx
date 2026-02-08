// src/components/LoginButton.jsx

import React, { useState } from "react";

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";

const LoginButton = () => {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = () => {
    if (loading) return;
    setLoading(true);
    window.location.href = `${BACKEND_URL}/auth/google/login`;
  };

  return (
    <button
      onClick={handleGoogleLogin}
      disabled={loading}
      className={`
        w-full flex items-center justify-center gap-3
        border rounded-xl px-4 py-3
        bg-white text-gray-800 font-semibold
        shadow-sm
        hover:bg-gray-50 hover:shadow
        active:scale-[0.99]
        transition
        disabled:opacity-60 disabled:cursor-not-allowed
      `}
    >
      {/* Google icon */}
      <svg
        width="20"
        height="20"
        viewBox="0 0 48 48"
        aria-hidden="true"
      >
        <path
          fill="#EA4335"
          d="M24 9.5c3.54 0 6.7 1.22 9.2 3.6l6.9-6.9C35.9 2.4 30.4 0 24 0 14.6 0 6.5 5.4 2.6 13.3l8.1 6.3C12.7 13.2 17.9 9.5 24 9.5z"
        />
        <path
          fill="#4285F4"
          d="M46.1 24.5c0-1.6-.1-2.8-.4-4.1H24v7.8h12.7c-.5 2.6-2.1 4.9-4.4 6.4l7 5.4c4.1-3.8 6.8-9.4 6.8-15.5z"
        />
        <path
          fill="#FBBC05"
          d="M10.7 28.1c-.5-1.6-.8-3.3-.8-5.1s.3-3.5.8-5.1l-8.1-6.3C.9 14.8 0 19.3 0 24s.9 9.2 2.6 12.4l8.1-6.3z"
        />
        <path
          fill="#34A853"
          d="M24 48c6.5 0 12-2.1 16-5.8l-7-5.4c-1.9 1.3-4.4 2.1-9 2.1-6.1 0-11.3-3.7-13.3-8.9l-8.1 6.3C6.5 42.6 14.6 48 24 48z"
        />
      </svg>

      <span>
        {loading ? "Redirecting…" : "Continue with Google"}
      </span>
    </button>
  );
};

export default LoginButton;
