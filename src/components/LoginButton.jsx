import React from "react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";

const LoginButton = () => {
  const handleGoogleLogin = () => {
    // window.location.href = "http://localhost:8000/auth/google/login";
    window.location.href = `${BACKEND_URL}/auth/google/login`;
  };

  return (
    <button
      onClick={handleGoogleLogin}
      className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
    >
      Sign in with Google
    </button>
  );
};

export default LoginButton;
