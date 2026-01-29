import React from "react";
import LoginButton from "../components/LoginButton";

function Login() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-400 via-blue-500 to-indigo-600">
      <div className="text-center mb-6">
        <h1 className="text-4xl font-extrabold text-white drop-shadow-md">
          Smart Health Monitor
        </h1>
        <p className="text-md text-white/90 mt-1 drop-shadow-sm">
          Track your vitals in real-time using smart IoT & AI.
        </p>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-lg w-80 text-center">
        <h2 className="text-xl font-bold mb-6">Login</h2>
        <LoginButton />
      </div>
    </div>
  );
}

export default Login;
